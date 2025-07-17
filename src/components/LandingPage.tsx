import React from 'react';
import { Sparkles, Users, Globe, Swords, BookOpen, ScrollText } from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center justify-center font-inter">
      {/* Hero Section */}
      <section className="relative w-full py-20 px-4 text-center overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-blue-900/30 opacity-70 animate-pulse-slow"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-black"></div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tighter drop-shadow-lg animate-fade-in-up">
            MythSeeker: Your Epic Adventures Await
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed animate-fade-in-up delay-200">
            Unleash limitless stories with an AI Dungeon Master, dynamic worlds, and seamless multiplayer.
          </p>
          <button
            onClick={onOpenAuth}
            className="px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xl font-bold rounded-full shadow-lg hover:from-purple-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-300 animate-bounce-in"
          >
            Start Your Adventure Now
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 px-4 bg-gray-950/70 backdrop-blur-sm border-t border-b border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-purple-300 drop-shadow-md animate-fade-in">
            Why Choose MythSeeker?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* Feature Card 1 */}
            <div className="bg-gray-800/50 p-8 rounded-xl shadow-xl border border-gray-700/50 transform hover:scale-[1.02] transition-transform duration-300 animate-fade-in delay-300">
              <div className="text-purple-400 mb-4 flex justify-center">
                <Sparkles size={48} />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-center">AI Dungeon Master</h3>
              <p className="text-gray-300 text-center">
                Experience dynamic, adaptive storytelling tailored to your choices. No two campaigns are ever the same!
              </p>
            </div>
            {/* Feature Card 2 */}
            <div className="bg-gray-800/50 p-8 rounded-xl shadow-xl border border-gray-700/50 transform hover:scale-[1.02] transition-transform duration-300 animate-fade-in delay-400">
              <div className="text-blue-400 mb-4 flex justify-center">
                <Users size={48} />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-center">Seamless Multiplayer</h3>
              <p className="text-gray-300 text-center">
                Play with friends in real-time. Share your epic quests and overcome challenges together.
              </p>
            </div>
            {/* Feature Card 3 */}
            <div className="bg-gray-800/50 p-8 rounded-xl shadow-xl border border-gray-700/50 transform hover:scale-[1.02] transition-transform duration-300 animate-fade-in delay-500">
              <div className="text-green-400 mb-4 flex justify-center">
                <Globe size={48} />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-center">Living Worlds</h3>
              <p className="text-gray-300 text-center">
                Explore vast, evolving worlds where your actions have lasting consequences.
              </p>
            </div>
            {/* Feature Card 4 */}
            <div className="bg-gray-800/50 p-8 rounded-xl shadow-xl border border-gray-700/50 transform hover:scale-[1.02] transition-transform duration-300 animate-fade-in delay-600">
              <div className="text-red-400 mb-4 flex justify-center">
                <Swords size={48} />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-center">Engaging Combat</h3>
              <p className="text-gray-300 text-center">
                Dive into tactical turn-based combat with dynamic environments and challenging foes.
              </p>
            </div>
            {/* Feature Card 5 */}
            <div className="bg-gray-800/50 p-8 rounded-xl shadow-xl border border-gray-700/50 transform hover:scale-[1.02] transition-transform duration-300 animate-fade-in delay-700">
              <div className="text-yellow-400 mb-4 flex justify-center">
                <BookOpen size={48} />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-center">Rich Lore & Quests</h3>
              <p className="text-gray-300 text-center">
                Uncover deep lore and embark on procedurally generated quests that keep you on the edge of your seat.
              </p>
            </div>
            {/* Feature Card 6 */}
            <div className="bg-gray-800/50 p-8 rounded-xl shadow-xl border border-gray-700/50 transform hover:scale-[1.02] transition-transform duration-300 animate-fade-in delay-800">
              <div className="text-cyan-400 mb-4 flex justify-center">
                <ScrollText size={48} />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-center">Campaign Log</h3>
              <p className="text-gray-300 text-center">
                Keep track of your adventures, character progress, and world events with an intuitive campaign log.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="w-full py-20 px-4 text-center bg-gray-900">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6 text-indigo-300 drop-shadow-md animate-fade-in">
            Ready to Forge Your Legend?
          </h2>
          <p className="text-xl text-gray-300 mb-10 animate-fade-in delay-200">
            Join thousands of adventurers already exploring endless possibilities in MythSeeker.
          </p>
          <button
            onClick={onOpenAuth}
            className="px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-2xl font-bold rounded-full shadow-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 animate-bounce-in delay-300"
          >
            Play Free Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 px-4 bg-black text-gray-500 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} MythSeeker. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Contact Us</a>
        </div>
      </footer>

      {/* Keyframe Animations (Tailwind JIT will pick these up) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes bounceIn {
              0%, 20%, 40%, 60%, 80%, 100% {
                transition-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
              }
              0% {
                opacity: 0;
                transform: scale3d(0.3, 0.3, 0.3);
              }
              20% {
                transform: scale3d(1.1, 1.1, 1.1);
              }
              40% {
                transform: scale3d(0.9, 0.9, 0.9);
              }
              60% {
                opacity: 1;
                transform: scale3d(1.03, 1.03, 1.03);
              }
              80% {
                transform: scale3d(0.97, 0.97, 0.97);
              }
              100% {
                opacity: 1;
                transform: scale3d(1, 1, 1);
              }
            }
            @keyframes pulseSlow {
              0%, 100% { opacity: 0.7; }
              50% { opacity: 0.9; }
            }
            .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
            .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
            .animate-fade-in-up.delay-200 { animation-delay: 0.2s; }
            .animate-bounce-in { animation: bounceIn 1s; }
            .animate-bounce-in.delay-300 { animation-delay: 0.3s; }
            .animate-pulse-slow { animation: pulseSlow 4s infinite alternate; }
          `
        }}
      />
    </div>
  );
};

export default LandingPage; 