import React from 'react';

interface HelpPageProps {
  user: any;
}

const HelpPage: React.FC<HelpPageProps> = ({ user }) => {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Help & Support</h1>
          <p className="text-blue-200">Support & documentation</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Getting Started</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                <span className="text-white">Quick Start Guide</span>
              </button>
              <button className="w-full text-left p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                <span className="text-white">Character Creation</span>
              </button>
              <button className="w-full text-left p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                <span className="text-white">First Campaign</span>
              </button>
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                <span className="text-white">FAQ</span>
              </button>
              <button className="w-full text-left p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                <span className="text-white">Contact Support</span>
              </button>
              <button className="w-full text-left p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                <span className="text-white">Bug Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage; 