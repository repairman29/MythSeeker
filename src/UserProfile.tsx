import React, { useEffect, useState } from 'react';
import { firebaseService } from './firebaseService';

const UserProfile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firebaseService.onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        try {
          const userProfile = await firebaseService.getUserProfile(firebaseUser.uid);
          setProfile(userProfile);
        } catch (error) {
          console.warn('Error loading user profile:', error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await firebaseService.signInWithGoogle();
    } catch (e) {
      alert('Login failed: ' + e);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await firebaseService.signOut();
    } catch (e) {
      alert('Logout failed: ' + e);
    }
    setLoading(false);
  };

  if (loading) return <div className="text-blue-200">Loading...</div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center space-y-2">
        <button
          onClick={handleLogin}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <img src={user.photoURL} alt="avatar" className="w-16 h-16 rounded-full border-2 border-blue-400" />
      <div className="text-white font-bold">{user.displayName}</div>
      <div className="text-blue-200 text-sm">{user.email}</div>
      {profile && (
        <div className="text-xs text-green-300">XP: {profile.totalPlayTime || 0} | Campaigns: {profile.campaignsJoined || 0}</div>
      )}
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
      >
        Sign out
      </button>
    </div>
  );
};

export default UserProfile; 