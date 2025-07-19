import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DMCenter from './DMCenter';
import { firebaseService } from '../firebaseService';

interface DMCenterPageProps {
  user: any;
}

const DMCenterPage: React.FC<DMCenterPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const [dmCenterData, setDmCenterData] = useState<any>({
    aiSettings: {
      dmStyle: 'balanced',
      difficulty: 6,
      descriptionLength: 'detailed',
      improvisationLevel: 7,
      npcComplexity: 'detailed',
      conflictFrequency: 5,
      continuityStrictness: 'moderate',
      worldReactivity: 8
    },
    dmPersona: {
      tone: 'friendly',
      humor_level: 'medium',
      descriptiveness: 'moderate',
      challenge_level: 'moderate',
      narrative_focus: 'balanced',
      improvisation_style: 'moderate'
    },
    aiTraining: {
      learningEnabled: true,
      feedbackCollection: true,
      personalityAdaptation: true,
      memoryRetention: 30,
      contextWindow: 10,
      longTermMemory: true,
      emotionalMemory: true,
      crossCampaignLearning: false
    }
  });
  const [currentCampaign, setCurrentCampaign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user's campaigns
        const userCampaigns = await firebaseService.getUserCampaigns(user.uid);
        if (userCampaigns && userCampaigns.length > 0) {
          setCurrentCampaign(userCampaigns[0]); // Set first campaign as current
        }
        
        // Load DM Center data from localStorage or use defaults
        const savedDmData = localStorage.getItem(`mythseeker_dmcenter_${user.uid}`);
        if (savedDmData) {
          setDmCenterData(JSON.parse(savedDmData));
        }
      } catch (error) {
        console.error('Error loading DM data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user.uid]);

  const handleUpdateDMCenter = (newData: any) => {
    setDmCenterData(newData);
    // Save to localStorage
    localStorage.setItem(`mythseeker_dmcenter_${user.uid}`, JSON.stringify(newData));
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-300/30 border-t-blue-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-blue-200">Loading DM Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <DMCenter 
        dmCenterData={dmCenterData}
        onUpdateDMCenter={handleUpdateDMCenter}
        currentCampaign={currentCampaign}
      />
    </div>
  );
};

export default DMCenterPage; 