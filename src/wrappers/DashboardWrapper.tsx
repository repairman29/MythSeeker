import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseWrapper } from './BaseWrapper';
import Dashboard from '../components/Dashboard';
import { firebaseService } from '../firebaseService';

interface DashboardWrapperProps {
  user: any;
}

export const DashboardWrapper: React.FC<DashboardWrapperProps> = ({ user }) => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [isDiceRollerOpen, setIsDiceRollerOpen] = useState(false);

  useEffect(() => {
    // Load user data
    const loadUserData = async () => {
      try {
        const userCampaigns = await firebaseService.getUserCampaigns(user.uid);
        const userCharacters = await firebaseService.getUserCharacters(user.uid);
        setCampaigns(userCampaigns || []);
        setCharacters(userCharacters || []);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, [user.uid]);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleCreateCampaign = () => {
    navigate('/campaigns');
  };

  const handleCreateCharacter = () => {
    navigate('/characters/create');
  };

  const handleJoinCampaign = () => {
    navigate('/campaigns');
  };

  const handleResumeCampaign = (campaignId: string) => {
    navigate(`/campaigns/${campaignId}`);
  };

  const handleOpenDiceRoller = () => {
    setIsDiceRollerOpen(true);
  };

  const handleOpenProfile = () => {
    navigate('/profile');
  };

  const handleOpenSettings = () => {
    navigate('/settings');
  };

  const handleOpenAchievements = () => {
    navigate('/achievements');
  };

  const handleOpenHelp = () => {
    navigate('/help');
  };

  return (
    <BaseWrapper user={user} showFloatingButton={true}>
      <Dashboard
        user={user}
        campaigns={campaigns}
        characters={characters}
        onNavigate={handleNavigate}
        onCreateCampaign={handleCreateCampaign}
        onCreateCharacter={handleCreateCharacter}
        onJoinCampaign={handleJoinCampaign}
        onResumeCampaign={handleResumeCampaign}
        onOpenDiceRoller={handleOpenDiceRoller}
        onOpenProfile={handleOpenProfile}
        onOpenSettings={handleOpenSettings}
        onOpenAchievements={handleOpenAchievements}
        onOpenHelp={handleOpenHelp}
      />
    </BaseWrapper>
  );
}; 