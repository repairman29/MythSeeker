import { ref, set, get, onValue, off, push, update } from 'firebase/database';
import { database, useDemoMode } from './firebase';

export interface MultiplayerGame {
  id: string;
  code: string;
  theme: string;
  background: string;
  players: Player[];
  messages: GameMessage[];
  started: boolean;
  customPrompt: string;
  isMultiplayer: boolean;
  maxPlayers: number;
  createdAt: number;
  lastActivity: number;
}

export interface Player {
  id: string;
  name: string;
  character: any;
  isHost: boolean;
  isOnline: boolean;
  lastSeen: number;
}

export interface GameMessage {
  id: string;
  type: 'player' | 'dm' | 'system';
  content: string;
  character?: string;
  playerId?: string;
  playerName?: string;
  timestamp: number;
  choices?: string[];
}

class MultiplayerService {
  private listeners: { [key: string]: () => void } = {};

  // Create a new multiplayer game
  async createGame(gameData: Omit<MultiplayerGame, 'id' | 'createdAt' | 'lastActivity'>): Promise<string> {
    const gameRef = push(ref(database, 'games'));
    const gameId = gameRef.key!;
    
    const game: MultiplayerGame = {
      ...gameData,
      id: gameId,
      createdAt: Date.now(),
      lastActivity: Date.now()
    };

    await set(gameRef, game);
    return gameId;
  }

  // Join an existing game
  async joinGame(gameCode: string, player: Omit<Player, 'lastSeen'>): Promise<MultiplayerGame | null> {
    const gamesRef = ref(database, 'games');
    const snapshot = await get(gamesRef);
    
    if (!snapshot.exists()) return null;
    
    const games = snapshot.val();
    const game = Object.values(games).find((g: any) => g.code === gameCode) as MultiplayerGame;
    
    if (!game || game.started || game.players.length >= game.maxPlayers) {
      return null;
    }

    // Add player to game
    const updatedPlayers = [...game.players, { ...player, lastSeen: Date.now() }];
    await update(ref(database, `games/${game.id}`), {
      players: updatedPlayers,
      lastActivity: Date.now()
    });

    return { ...game, players: updatedPlayers };
  }

  // Listen to game updates
  onGameUpdate(gameId: string, callback: (game: MultiplayerGame) => void): () => void {
    const gameRef = ref(database, `games/${gameId}`);
    
    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const game = snapshot.val() as MultiplayerGame;
        callback(game);
      }
    });

    this.listeners[gameId] = unsubscribe;
    return unsubscribe;
  }

  // Send a message to the game
  async sendMessage(gameId: string, message: Omit<GameMessage, 'id' | 'timestamp'>): Promise<void> {
    const messagesRef = push(ref(database, `games/${gameId}/messages`));
    const messageId = messagesRef.key!;
    
    const fullMessage: GameMessage = {
      ...message,
      id: messageId,
      timestamp: Date.now()
    };

    await set(messagesRef, fullMessage);
    
    // Update last activity
    await update(ref(database, `games/${gameId}`), {
      lastActivity: Date.now()
    });
  }

  // Update player status (online/offline)
  async updatePlayerStatus(gameId: string, playerId: string, isOnline: boolean): Promise<void> {
    const gameRef = ref(database, `games/${gameId}`);
    const snapshot = await get(gameRef);
    
    if (!snapshot.exists()) return;
    
    const game = snapshot.val() as MultiplayerGame;
    const updatedPlayers = game.players.map(player => 
      player.id === playerId 
        ? { ...player, isOnline, lastSeen: Date.now() }
        : player
    );

    await update(gameRef, {
      players: updatedPlayers,
      lastActivity: Date.now()
    });
  }

  // Start the game (host only)
  async startGame(gameId: string): Promise<void> {
    await update(ref(database, `games/${gameId}`), {
      started: true,
      lastActivity: Date.now()
    });
  }

  // Leave the game
  async leaveGame(gameId: string, playerId: string): Promise<void> {
    const gameRef = ref(database, `games/${gameId}`);
    const snapshot = await get(gameRef);
    
    if (!snapshot.exists()) return;
    
    const game = snapshot.val() as MultiplayerGame;
    const updatedPlayers = game.players.filter(player => player.id !== playerId);

    if (updatedPlayers.length === 0) {
      // Delete the game if no players left
      await set(gameRef, null);
    } else {
      // Update players list
      await update(gameRef, {
        players: updatedPlayers,
        lastActivity: Date.now()
      });
    }
  }

  // Clean up listeners
  cleanup(): void {
    Object.values(this.listeners).forEach(unsubscribe => unsubscribe());
    this.listeners = {};
  }

  // Demo mode for testing without Firebase
  createDemoGame(): MultiplayerGame {
    return {
      id: 'demo-' + Date.now(),
      code: 'DEMO123',
      theme: 'Classic Fantasy',
      background: 'fantasy',
      players: [],
      messages: [],
      started: false,
      customPrompt: '',
      isMultiplayer: true,
      maxPlayers: 6,
      createdAt: Date.now(),
      lastActivity: Date.now()
    };
  }
}

export const multiplayerService = new MultiplayerService(); 