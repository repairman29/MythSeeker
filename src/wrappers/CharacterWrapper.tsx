import React from 'react';
import { BaseWrapper } from './BaseWrapper';

interface CharacterWrapperProps {
  user: any;
}

// Placeholder component - will be implemented with proper character management
const CharactersPage: React.FC<{ user: any }> = ({ user }) => (
  <div className="p-8">
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-white mb-8">Character Management</h1>
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <p className="text-slate-300 mb-4">Character management system coming soon!</p>
        <p className="text-sm text-slate-400">
          This will include character creation, editing, and management features.
        </p>
      </div>
    </div>
  </div>
);

export const CharacterWrapper: React.FC<CharacterWrapperProps> = ({ user }) => {
  return (
    <BaseWrapper user={user}>
      <CharactersPage user={user} />
    </BaseWrapper>
  );
}; 