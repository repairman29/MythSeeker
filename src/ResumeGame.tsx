import React, { useEffect, useState } from 'react';
import { firebaseService, db } from './firebaseService';
import { collection, query, where, getDocs } from 'firebase/firestore';

const ResumeGame: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firebaseService.onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const chars = await firebaseService.getUserCharacters(firebaseUser.uid);
        setCharacters(chars);
        // Load games where user is a participant
        const gamesQuery = query(
          collection(db, 'games'),
          where('players', 'array-contains', { id: firebaseUser.uid })
        );
        const gamesSnapshot = await getDocs(gamesQuery);
        setGames(gamesSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
      } else {
        setCharacters([]);
        setGames([]);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <div className="text-blue-200">Loading...</div>;
  if (!user) return null;

  return (
    <div className="bg-white/10 rounded-xl p-4 mt-4">
      <h3 className="text-lg font-bold text-white mb-2">Resume Your Adventure</h3>
      {characters.length === 0 && games.length === 0 && (
        <div className="text-blue-200">No saved characters or games yet.</div>
      )}
      {characters.length > 0 && (
        <div className="mb-4">
          <div className="text-blue-200 mb-1">Your Characters:</div>
          <ul className="space-y-1">
            {characters.map((char) => (
              <li key={char.id} className="bg-black/20 rounded p-2 text-white flex items-center justify-between">
                <span>{char.name} (Level {char.level} {char.class})</span>
                {/* Add a button to resume or edit character */}
                <button className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs">Resume</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {games.length > 0 && (
        <div>
          <div className="text-blue-200 mb-1">Your Games:</div>
          <ul className="space-y-1">
            {games.map((game) => (
              <li key={game.id} className="bg-black/20 rounded p-2 text-white flex items-center justify-between">
                <span>{game.theme} ({game.players.length} players)</span>
                {/* Add a button to rejoin game */}
                <button className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs">Rejoin</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResumeGame; 