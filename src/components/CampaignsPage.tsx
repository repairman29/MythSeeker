/**
 * Campaigns Page Component
 * 
 * Campaign management interface extracted from the original monolithic App.tsx
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { firebaseService, Character } from '../firebaseService';
import { Plus, Edit, Trash2, Users, Globe, Clock, Star, Play, Copy } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description: string;
  theme: string;
  isMultiplayer: boolean;
  maxPlayers: number;
  currentPlayers: number;
  playerCount?: number;
  isHost: boolean;
  joinCode?: string;
  lastActivity: Date;
  created: Date;
  status: 'active' | 'paused' | 'completed';
  image?: string;
  tags?: string[];
}

interface CampaignsPageProps {
  user: any;
}

const CampaignsPage: React.FC<CampaignsPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const userCampaigns = await firebaseService.getUserCampaigns(user.uid);
        setCampaigns(userCampaigns || []);
      } catch (error) {
        console.error('Error loading campaigns:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCampaigns();
  }, [user.uid]);

  const handleCreateCampaign = () => {
    navigate('/campaign-creator');
  };

  const handleJoinCampaign = async () => {
    if (!joinCode.trim()) return;
    
    try {
      // Implement join campaign logic
      const result = await firebaseService.joinCampaign(user.uid, joinCode.trim());
      if (result.success) {
        setJoinCode('');
        setShowJoinModal(false);
        // Reload campaigns
        const userCampaigns = await firebaseService.getUserCampaigns(user.uid);
        setCampaigns(userCampaigns || []);
      }
    } catch (error) {
      console.error('Error joining campaign:', error);
    }
  };

  const handleEditCampaign = (campaign: Campaign) => {
    navigate(`/campaign-creator?edit=${campaign.id}`);
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await firebaseService.deleteCampaign(user.uid, campaignId);
      setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const handlePlayCampaign = (campaign: Campaign) => {
    navigate(`/campaigns/${campaign.id}`);
  };

  const handleCopyJoinCode = (joinCode: string) => {
    navigator.clipboard.writeText(joinCode);
    // Show toast notification
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'paused': return 'text-yellow-400';
      case 'completed': return 'text-gray-400';
      default: return 'text-blue-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'paused': return 'Paused';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-300/30 border-t-blue-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-white text-lg">Loading your campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Your Campaigns</h1>
            <p className="text-blue-200">
              Manage your adventures and join multiplayer sessions
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Users size={20} />
              <span>Join Campaign</span>
            </button>
            <button
              onClick={handleCreateCampaign}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Plus size={20} />
              <span>Create Campaign</span>
            </button>
          </div>
        </div>

        {/* Campaigns Grid */}
        {campaigns.length === 0 ? (
          <div className="text-center py-16">
            <Globe size={64} className="mx-auto text-blue-300/50 mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">No Campaigns Yet</h3>
            <p className="text-blue-200 mb-6">
              Create your first campaign or join an existing one to begin your adventure
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleCreateCampaign}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors"
              >
                Create Campaign
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg transition-colors"
              >
                Join Campaign
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-all duration-200"
              >
                {/* Campaign Image/Header */}
                <div className="relative h-32 bg-gradient-to-br from-blue-600 to-purple-700">
                  {campaign.image ? (
                    <img 
                      src={campaign.image} 
                      alt={campaign.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Globe size={32} className="text-white/80" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-black/50 backdrop-blur-sm ${getStatusColor(campaign.status)}`}>
                      {getStatusText(campaign.status)}
                    </span>
                  </div>

                  {/* Multiplayer Badge */}
                  {campaign.isMultiplayer && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-black/50 backdrop-blur-sm text-green-400">
                        Multiplayer
                      </span>
                    </div>
                  )}
                </div>

                {/* Campaign Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-white">{campaign.name}</h3>
                    {campaign.isHost && (
                      <Star size={16} className="text-yellow-400 mt-1" />
                    )}
                  </div>

                  <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                    {campaign.description || `A ${campaign.theme} adventure awaits...`}
                  </p>

                  {/* Campaign Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Users size={14} className="text-blue-400" />
                      <span className="text-slate-300">
                        {campaign.currentPlayers || campaign.playerCount || 1}/{campaign.maxPlayers || 4}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock size={14} className="text-green-400" />
                      <span className="text-slate-300">
                        {new Date(campaign.lastActivity).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Join Code */}
                  {campaign.joinCode && campaign.isHost && (
                    <div className="mb-4 p-2 bg-slate-700/50 rounded flex items-center justify-between">
                      <span className="text-xs text-slate-400">Join Code:</span>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm text-blue-300 font-mono">{campaign.joinCode}</code>
                        <button
                          onClick={() => handleCopyJoinCode(campaign.joinCode!)}
                          className="text-slate-400 hover:text-white transition-colors"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {campaign.tags && campaign.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {campaign.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-blue-600/30 text-blue-300 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {campaign.tags.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-slate-600/50 text-slate-400 rounded">
                          +{campaign.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePlayCampaign(campaign)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                    >
                      <Play size={16} />
                      <span>Play</span>
                    </button>
                    
                    {campaign.isHost && (
                      <>
                        <button
                          onClick={() => handleEditCampaign(campaign)}
                          className="flex items-center justify-center bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(campaign.id)}
                          className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Join Campaign Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">
              Join Campaign
            </h3>
            <p className="text-slate-300 mb-4">
              Enter the campaign join code provided by the DM:
            </p>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter join code"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 mb-6"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinCode('');
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinCampaign}
                disabled={!joinCode.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">
              Delete Campaign
            </h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete this campaign? This action cannot be undone and will remove all progress.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCampaign(showDeleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsPage; 