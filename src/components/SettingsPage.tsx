import React, { useState, useEffect } from 'react';

interface SettingsPageProps {
  user: any;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user }) => {
  const [settings, setSettings] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = JSON.parse(localStorage.getItem('mythseeker_settings') || '{}');
        const defaultSettings = {
          soundEffects: true,
          music: false,
          notifications: true,
          theme: 'dark',
          fontSize: 'medium',
          autoSave: true,
          showTutorials: true,
          diceRoller: {
            soundEnabled: true,
            hapticEnabled: true,
            shakeToRoll: true,
            showHistory: true
          },
          game: {
            autoRoll: false,
            showDamageNumbers: true,
            showHealthBars: true,
            confirmActions: true
          }
        };
        setSettings({ ...defaultSettings, ...savedSettings });
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const updateSetting = (category: string, key: string, value: any) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    };
    setSettings(newSettings);
    localStorage.setItem('mythseeker_settings', JSON.stringify(newSettings));
  };

  const updateMainSetting = (key: string, value: any) => {
    const newSettings = {
      ...settings,
      [key]: value
    };
    setSettings(newSettings);
    localStorage.setItem('mythseeker_settings', JSON.stringify(newSettings));
  };

  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      localStorage.removeItem('mythseeker_settings');
      window.location.reload();
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mythseeker-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          setSettings(importedSettings);
          localStorage.setItem('mythseeker_settings', JSON.stringify(importedSettings));
          alert('Settings imported successfully!');
        } catch (error) {
          alert('Error importing settings. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-300/30 border-t-blue-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-blue-200">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-blue-200">App preferences and configuration</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={exportSettings}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Export
            </button>
            <label className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer">
              Import
              <input 
                type="file" 
                accept=".json" 
                onChange={importSettings} 
                className="hidden" 
              />
            </label>
            <button 
              onClick={resetSettings}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Audio Settings */}
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Audio Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-blue-200">Sound Effects</span>
                  <p className="text-slate-400 text-sm">Enable sound effects and audio feedback</p>
                </div>
                <button 
                  onClick={() => updateMainSetting('soundEffects', !settings.soundEffects)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.soundEffects ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    settings.soundEffects ? 'right-1' : 'left-1'
                  }`}></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-blue-200">Music</span>
                  <p className="text-slate-400 text-sm">Enable background music</p>
                </div>
                <button 
                  onClick={() => updateMainSetting('music', !settings.music)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.music ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    settings.music ? 'right-1' : 'left-1'
                  }`}></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-blue-200">Notifications</span>
                  <p className="text-slate-400 text-sm">Show toast notifications</p>
                </div>
                <button 
                  onClick={() => updateMainSetting('notifications', !settings.notifications)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.notifications ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    settings.notifications ? 'right-1' : 'left-1'
                  }`}></div>
                </button>
              </div>
            </div>
          </div>
          
          {/* Display Settings */}
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Display Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-blue-200">Theme</span>
                  <p className="text-slate-400 text-sm">Choose your preferred theme</p>
                </div>
                <select 
                  value={settings.theme}
                  onChange={(e) => updateMainSetting('theme', e.target.value)}
                  className="bg-slate-700 text-white px-3 py-2 rounded border border-slate-600"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-blue-200">Font Size</span>
                  <p className="text-slate-400 text-sm">Adjust text size for readability</p>
                </div>
                <select 
                  value={settings.fontSize}
                  onChange={(e) => updateMainSetting('fontSize', e.target.value)}
                  className="bg-slate-700 text-white px-3 py-2 rounded border border-slate-600"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>
          </div>

          {/* Game Settings */}
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Game Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-blue-200">Auto Save</span>
                  <p className="text-slate-400 text-sm">Automatically save game progress</p>
                </div>
                <button 
                  onClick={() => updateMainSetting('autoSave', !settings.autoSave)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.autoSave ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    settings.autoSave ? 'right-1' : 'left-1'
                  }`}></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-blue-200">Show Tutorials</span>
                  <p className="text-slate-400 text-sm">Display helpful tutorial tips</p>
                </div>
                <button 
                  onClick={() => updateMainSetting('showTutorials', !settings.showTutorials)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.showTutorials ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    settings.showTutorials ? 'right-1' : 'left-1'
                  }`}></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-blue-200">Show Damage Numbers</span>
                  <p className="text-slate-400 text-sm">Display damage numbers in combat</p>
                </div>
                <button 
                  onClick={() => updateSetting('game', 'showDamageNumbers', !settings.game?.showDamageNumbers)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.game?.showDamageNumbers ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    settings.game?.showDamageNumbers ? 'right-1' : 'left-1'
                  }`}></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-blue-200">Confirm Actions</span>
                  <p className="text-slate-400 text-sm">Ask for confirmation before important actions</p>
                </div>
                <button 
                  onClick={() => updateSetting('game', 'confirmActions', !settings.game?.confirmActions)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.game?.confirmActions ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    settings.game?.confirmActions ? 'right-1' : 'left-1'
                  }`}></div>
                </button>
              </div>
            </div>
          </div>

          {/* Dice Roller Settings */}
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Dice Roller Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-blue-200">Sound Effects</span>
                  <p className="text-slate-400 text-sm">Play sounds when rolling dice</p>
                </div>
                <button 
                  onClick={() => updateSetting('diceRoller', 'soundEnabled', !settings.diceRoller?.soundEnabled)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.diceRoller?.soundEnabled ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    settings.diceRoller?.soundEnabled ? 'right-1' : 'left-1'
                  }`}></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-blue-200">Haptic Feedback</span>
                  <p className="text-slate-400 text-sm">Vibrate device when rolling dice</p>
                </div>
                <button 
                  onClick={() => updateSetting('diceRoller', 'hapticEnabled', !settings.diceRoller?.hapticEnabled)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.diceRoller?.hapticEnabled ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    settings.diceRoller?.hapticEnabled ? 'right-1' : 'left-1'
                  }`}></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-blue-200">Shake to Roll</span>
                  <p className="text-slate-400 text-sm">Roll dice by shaking your device</p>
                </div>
                <button 
                  onClick={() => updateSetting('diceRoller', 'shakeToRoll', !settings.diceRoller?.shakeToRoll)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.diceRoller?.shakeToRoll ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    settings.diceRoller?.shakeToRoll ? 'right-1' : 'left-1'
                  }`}></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-blue-200">Show History</span>
                  <p className="text-slate-400 text-sm">Display roll history in drawer</p>
                </div>
                <button 
                  onClick={() => updateSetting('diceRoller', 'showHistory', !settings.diceRoller?.showHistory)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.diceRoller?.showHistory ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    settings.diceRoller?.showHistory ? 'right-1' : 'left-1'
                  }`}></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 