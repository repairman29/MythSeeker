import React from 'react';
import { User } from 'lucide-react';

interface ProfilePageProps {
  user: any;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user }) => {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-blue-200">Your account settings and preferences</p>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
          <div className="flex items-center space-x-6 mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-20 h-20 rounded-full" />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{user?.displayName || 'Adventurer'}</h2>
              <p className="text-blue-200">{user?.email}</p>
              <p className="text-slate-400 text-sm">Member since {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Account Settings</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                  <span className="text-white">Edit Profile</span>
                </button>
                <button className="w-full text-left p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                  <span className="text-white">Change Password</span>
                </button>
                <button className="w-full text-left p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                  <span className="text-white">Privacy Settings</span>
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Game Statistics</h3>
              <div className="space-y-3">
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-400 text-sm">Campaigns Played</span>
                  <p className="text-white font-semibold">0</p>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-400 text-sm">Characters Created</span>
                  <p className="text-white font-semibold">0</p>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-400 text-sm">Total Play Time</span>
                  <p className="text-white font-semibold">0 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 