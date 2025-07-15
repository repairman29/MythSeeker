import { MultiplayerGame, Player, GameMessage } from './multiplayer';

class DemoMultiplayerService {
  private games: { [key: string]: MultiplayerGame } = {};
  private listeners: { [key: string]: (game: MultiplayerGame) => void } = {};
  private interval: NodeJS.Timeout | null = null;

  constructor() {
    // Load games from localStorage
    const savedGames = localStorage.getItem('mythseeker-games');
    if (savedGames) {
      this.games = JSON.parse(savedGames);
    }

    // Set up periodic updates to simulate real-time
    this.interval = setInterval(() => {
      this.notifyListeners();
    }, 1000);
  }

  private saveGames() {
    localStorage.setItem('mythseeker-games', JSON.stringify(this.games));
  }

  private notifyListeners() {
    Object.entries(this.listeners).forEach(([gameId, callback]) => {
      if (this.games[gameId]) {
        callback(this.games[gameId]);
      }
    });
  }

  async createGame(gameData: Omit<MultiplayerGame, 'id' | 'createdAt' | 'lastActivity'>): Promise<string> {
    const gameId = 'demo-' + Date.now();
    
    const game: MultiplayerGame = {
      ...gameData,
      id: gameId,
      createdAt: Date.now(),
      lastActivity: Date.now()
    };

    this.games[gameId] = game;
    this.saveGames();
    this.notifyListeners();
    
    return gameId;
  }

  async joinGame(gameCode: string, player: Omit<Player, 'lastSeen'>): Promise<MultiplayerGame | null> {
    const game = Object.values(this.games).find(g => g.code === gameCode);
    
    if (!game || game.started || game.players.length >= game.maxPlayers) {
      return null;
    }

    // Add player to game
    const updatedPlayers = [...game.players, { ...player, lastSeen: Date.now() }];
    game.players = updatedPlayers;
    game.lastActivity = Date.now();

    this.saveGames();
    this.notifyListeners();

    return game;
  }

  onGameUpdate(gameId: string, callback: (game: MultiplayerGame) => void): () => void {
    this.listeners[gameId] = callback;
    
    // Immediately call with current state
    if (this.games[gameId]) {
      callback(this.games[gameId]);
    }

    return () => {
      delete this.listeners[gameId];
    };
  }

  async sendMessage(gameId: string, message: Omit<GameMessage, 'id' | 'timestamp'>): Promise<void> {
    if (!this.games[gameId]) return;

    const messageId = 'msg-' + Date.now();
    const fullMessage: GameMessage = {
      ...message,
      id: messageId,
      timestamp: Date.now()
    };

    this.games[gameId].messages.push(fullMessage);
    this.games[gameId].lastActivity = Date.now();

    this.saveGames();
    this.notifyListeners();
  }

  async updatePlayerStatus(gameId: string, playerId: string, isOnline: boolean): Promise<void> {
    if (!this.games[gameId]) return;

    const game = this.games[gameId];
    game.players = game.players.map(player => 
      player.id === playerId 
        ? { ...player, isOnline, lastSeen: Date.now() }
        : player
    );

    game.lastActivity = Date.now();
    this.saveGames();
    this.notifyListeners();
  }

  async startGame(gameId: string): Promise<void> {
    if (!this.games[gameId]) return;

    this.games[gameId].started = true;
    this.games[gameId].lastActivity = Date.now();

    this.saveGames();
    this.notifyListeners();
  }

  async leaveGame(gameId: string, playerId: string): Promise<void> {
    if (!this.games[gameId]) return;

    const game = this.games[gameId];
    game.players = game.players.filter(player => player.id !== playerId);

    if (game.players.length === 0) {
      delete this.games[gameId];
    } else {
      game.lastActivity = Date.now();
    }

    this.saveGames();
    this.notifyListeners();
  }

  cleanup(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.listeners = {};
  }

  // Get all active games for debugging
  getActiveGames(): MultiplayerGame[] {
    return Object.values(this.games);
  }
}

export const demoMultiplayerService = new DemoMultiplayerService(); 