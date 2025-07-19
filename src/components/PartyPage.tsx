import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Edit, Sword, User, Book, ChevronRight } from 'lucide-react';

interface PartyPageProps {
  user: any;
}

const PartyPage: React.FC<PartyPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const [partyMembers, setPartyMembers] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

  useEffect(() => {
    const loadPartyData = async () => {
      try {
        // Load party members from localStorage (simulated database)
        const members = JSON.parse(localStorage.getItem(`mythseeker_party_${user.uid}`) || '[]');
        setPartyMembers(members);
        
        // Load pending invites
        const invites = JSON.parse(localStorage.getItem(`mythseeker_invites_${user.uid}`) || '[]');
        setPendingInvites(invites);
      } catch (error) {
        console.error('Error loading party data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPartyData();
  }, [user.uid]);

  const generateInviteCode = () => {
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    setInviteCode(code);
    return code;
  };

  const handleCreateInvite = () => {
    const code = generateInviteCode();
    setShowInviteModal(true);
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    alert('Invite code copied to clipboard!');
  };

  const handleJoinParty = async () => {
    if (!joinCode.trim()) return;
    
    try {
      // Simulate joining a party with the code
      // In a real app, this would validate the code with the server
      const mockPartyMember = {
        id: Date.now().toString(),
        name: user.displayName || 'Adventurer',
        email: user.email,
        character: {
          name: 'Your Character',
          class: 'Adventurer',
          level: 1
        },
        joinedAt: new Date().toISOString(),
        notes: '',
        isOnline: true
      };
      
      // Add to party members
      const updatedMembers = [...partyMembers, mockPartyMember];
      setPartyMembers(updatedMembers);
      localStorage.setItem(`mythseeker_party_${user.uid}`, JSON.stringify(updatedMembers));
      
      setShowJoinModal(false);
      setJoinCode('');
      alert('Successfully joined the party!');
    } catch (error) {
      console.error('Error joining party:', error);
      alert('Failed to join party. Please check the code and try again.');
    }
  };

  const handleAddMember = (memberData: any) => {
    const newMember = {
      id: Date.now().toString(),
      ...memberData,
      joinedAt: new Date().toISOString(),
      notes: '',
      isOnline: false
    };
    
    const updatedMembers = [...partyMembers, newMember];
    setPartyMembers(updatedMembers);
    localStorage.setItem(`mythseeker_party_${user.uid}`, JSON.stringify(updatedMembers));
    setShowInviteModal(false);
    setInviteCode('');
  };

  const handleRemoveMember = (memberId: string) => {
    const updatedMembers = partyMembers.filter(member => member.id !== memberId);
    setPartyMembers(updatedMembers);
    localStorage.setItem(`mythseeker_party_${user.uid}`, JSON.stringify(updatedMembers));
  };

  const handleUpdateMemberNotes = (memberId: string, notes: string) => {
    const updatedMembers = partyMembers.map(member => 
      member.id === memberId ? { ...member, notes } : member
    );
    setPartyMembers(updatedMembers);
    localStorage.setItem(`mythseeker_party_${user.uid}`, JSON.stringify(updatedMembers));
  };

  const handleAcceptInvite = (invite: any) => {
    setJoinCode(invite.code);
    setShowJoinModal(true);
  };

  const handleDeclineInvite = (inviteId: string) => {
    const updatedInvites = pendingInvites.filter(invite => invite.id !== inviteId);
    setPendingInvites(updatedInvites);
    localStorage.setItem(`mythseeker_invites_${user.uid}`, JSON.stringify(updatedInvites));
  };

  const getClassIcon = (className: string) => {
    switch (className?.toLowerCase()) {
      case 'warrior': return '⚔️';
      case 'rogue': return '🗡️';
      case 'mage': return '🔮';
      case 'cleric': return '⚡';
      case 'ranger': return '🏹';
      case 'bard': return '🎵';
      default: return '👤';
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-300/30 border-t-blue-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-blue-200">Loading party data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Party</h1>
            <p className="text-blue-200">Manage your adventuring companions and friends</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowJoinModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Join Party
            </button>
            <button 
              onClick={handleCreateInvite}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Invite Friend
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Party Members */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Party Members ({partyMembers.length})</h3>
                <button 
                  onClick={handleCreateInvite}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  + Add Member
                </button>
              </div>
              
              {partyMembers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-blue-200 mb-2">No party members yet</p>
                  <p className="text-slate-400 text-sm mb-4">Invite friends to start your adventuring party</p>
                  <button 
                    onClick={handleCreateInvite}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
                  >
                    Invite First Member
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partyMembers.map((member) => (
                    <div key={member.id} className="bg-slate-700/30 rounded-lg p-4 hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-lg">{getClassIcon(member.character?.class)}</span>
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{member.name}</h4>
                            <p className="text-blue-200 text-sm">
                              {member.character?.name} • Level {member.character?.level} {member.character?.class}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            member.isOnline ? 'bg-green-400' : 'bg-slate-400'
                          }`}></div>
                          <button
                            onClick={() => {
                              setSelectedMember(member);
                              setShowMemberModal(true);
                            }}
                            className="text-slate-400 hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {member.notes && (
                        <p className="text-slate-300 text-sm mb-3 italic">"{member.notes}"</p>
                      )}
                      
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pending Invites */}
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Pending Invites</h3>
              {pendingInvites.length > 0 ? (
                <div className="space-y-3">
                  {pendingInvites.map((invite) => (
                    <div key={invite.id} className="p-3 bg-slate-700/30 rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-white font-medium">{invite.hostName}</p>
                          <p className="text-blue-200 text-sm">{invite.partyName}</p>
                        </div>
                        <span className="text-slate-400 text-xs">
                          {new Date(invite.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleAcceptInvite(invite)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleDeclineInvite(invite.id)}
                          className="flex-1 bg-slate-600 hover:bg-slate-500 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-slate-400 text-sm">No pending invites</p>
                </div>
              )}
            </div>

            {/* Party Stats */}
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Party Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-300">Total Members</span>
                  <span className="text-white font-semibold">{partyMembers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Online Now</span>
                  <span className="text-white font-semibold">
                    {partyMembers.filter(m => m.isOnline).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Average Level</span>
                  <span className="text-white font-semibold">
                    {partyMembers.length > 0 
                      ? Math.round(partyMembers.reduce((sum, m) => sum + (m.character?.level || 1), 0) / partyMembers.length)
                      : 0
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/game')}
                  className="w-full flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Sword className="w-4 h-4 text-green-400" />
                    <span className="text-sm">Start Adventure</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/characters')}
                  className="w-full flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-blue-400" />
                    <span className="text-sm">Manage Characters</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/campaigns')}
                  className="w-full flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Book className="w-4 h-4 text-purple-400" />
                    <span className="text-sm">View Campaigns</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Invite Friend</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Invite Code</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inviteCode}
                    readOnly
                    className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                  />
                  <button
                    onClick={handleCopyInviteCode}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-slate-400 text-xs mt-2">
                  Share this code with your friend to invite them to your party
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Join Party</h2>
              <button
                onClick={() => setShowJoinModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Invite Code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  maxLength={6}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-blue-400"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinParty}
                  disabled={!joinCode.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Join Party
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Details Modal */}
      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Party Member</h2>
              <button
                onClick={() => setShowMemberModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">{getClassIcon(selectedMember.character?.class)}</span>
                </div>
                <div>
                  <h3 className="text-white font-medium">{selectedMember.name}</h3>
                  <p className="text-blue-200 text-sm">
                    {selectedMember.character?.name} • Level {selectedMember.character?.level} {selectedMember.character?.class}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
                <textarea
                  value={selectedMember.notes || ''}
                  onChange={(e) => handleUpdateMemberNotes(selectedMember.id, e.target.value)}
                  placeholder="Add notes about this party member..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-blue-400"
                />
              </div>
              
              <div className="text-sm text-slate-400">
                <p>Joined: {new Date(selectedMember.joinedAt).toLocaleDateString()}</p>
                <p>Status: {selectedMember.isOnline ? 'Online' : 'Offline'}</p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowMemberModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleRemoveMember(selectedMember.id);
                    setShowMemberModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Remove from Party
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartyPage; 