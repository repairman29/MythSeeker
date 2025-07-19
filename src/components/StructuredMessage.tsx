/**
 * Structured Message Component
 * 
 * Transforms blob-text AI messages into beautifully formatted, structured content
 * with proper sections, visual hierarchy, and readable layout
 */

import React, { useMemo } from 'react';
import { 
  User, 
  Bot, 
  Sword, 
  Eye, 
  MapPin, 
  Users, 
  Zap, 
  Shield,
  Heart,
  Star,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Target,
  Scroll
} from 'lucide-react';

interface StructuredMessageProps {
  message: {
    id: string;
    type: 'player' | 'dm' | 'system' | 'ai';
    content: string;
    sender?: string;
    timestamp: number | Date;
    metadata?: any;
    choices?: string[];
  };
  character?: {
    name: string;
    avatar?: string;
  };
  isPlayer?: boolean;
  onChoiceSelect?: (choice: string) => void;
  onInputSelect?: (text: string) => void;
}

interface ParsedContent {
  title?: string;
  description?: string;
  sections: {
    type: 'narrative' | 'dialogue' | 'action' | 'status' | 'choice' | 'dice' | 'location' | 'info';
    title?: string;
    content: string;
    icon?: React.ReactNode;
    priority?: 'high' | 'medium' | 'low';
  }[];
  summary?: string;
}

export const StructuredMessage: React.FC<StructuredMessageProps> = ({
  message,
  character,
  isPlayer = false,
  onChoiceSelect,
  onInputSelect
}) => {
  // Parse message content into structured sections
  const parsedContent = useMemo((): ParsedContent => {
    const content = message.content;
    const sections: ParsedContent['sections'] = [];
    
    // Split content by common delimiters and patterns
    const lines = content.split('\n').filter(line => line.trim());
    
    let currentSection: ParsedContent['sections'][0] | null = null;
    let title: string | undefined;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Detect section headers and content types
      const lowerLine = line.toLowerCase();
      
      // Extract title (usually first significant line)
      if (i === 0 && !title && line.length > 10 && !line.startsWith('*')) {
        title = line.replace(/^[*#]+\s*/, '');
        continue;
      }
      
      // Detect section types based on content patterns
      let sectionType: ParsedContent['sections'][0]['type'] = 'narrative';
      let sectionTitle: string | undefined;
      let icon: React.ReactNode;
      let priority: 'high' | 'medium' | 'low' = 'medium';
      
      // Location/Setting descriptions
      if (lowerLine.includes('you find yourself') || 
          lowerLine.includes('you are in') || 
          lowerLine.includes('the area') ||
          lowerLine.includes('around you') ||
          lowerLine.includes('location:') ||
          lowerLine.includes('setting:')) {
        sectionType = 'location';
        sectionTitle = 'Location';
        icon = <MapPin size={16} className="text-blue-400" />;
      }
      
      // Dialogue (quoted text or NPC speech)
      else if (line.includes('"') || 
               lowerLine.includes('says') || 
               lowerLine.includes('tells you') ||
               lowerLine.includes('replies') ||
               lowerLine.includes('whispers') ||
               lowerLine.includes('shouts')) {
        sectionType = 'dialogue';
        sectionTitle = 'Dialogue';
        icon = <Users size={16} className="text-green-400" />;
      }
      
      // Action/Combat
      else if (lowerLine.includes('roll') || 
               lowerLine.includes('attack') || 
               lowerLine.includes('damage') ||
               lowerLine.includes('initiative') ||
               lowerLine.includes('combat') ||
               lowerLine.includes('fight') ||
               line.includes('🎲')) {
        sectionType = 'action';
        sectionTitle = 'Action';
        icon = <Sword size={16} className="text-red-400" />;
        priority = 'high';
      }
      
      // Status updates/HP/Stats
      else if (lowerLine.includes('health') || 
               lowerLine.includes('hp') || 
               lowerLine.includes('status') ||
               lowerLine.includes('condition') ||
               lowerLine.includes('level') ||
               lowerLine.includes('experience')) {
        sectionType = 'status';
        sectionTitle = 'Status';
        icon = <Heart size={16} className="text-pink-400" />;
        priority = 'high';
      }
      
      // Choices/Options
      else if (lowerLine.includes('you can') || 
               lowerLine.includes('options') || 
               lowerLine.includes('choose') ||
               lowerLine.includes('decide') ||
               line.startsWith('1.') ||
               line.startsWith('2.') ||
               line.startsWith('3.') ||
               line.startsWith('-') ||
               line.startsWith('*')) {
        sectionType = 'choice';
        sectionTitle = 'Options';
        icon = <Target size={16} className="text-yellow-400" />;
        priority = 'high';
      }
      
      // Dice rolls
      else if (line.includes('d20') || 
               line.includes('d6') || 
               line.includes('d8') ||
               line.includes('d10') ||
               line.includes('d12') ||
               line.includes('dice')) {
        sectionType = 'dice';
        sectionTitle = 'Dice Roll';
        icon = <Star size={16} className="text-purple-400" />;
        priority = 'high';
      }
      
      // Information/Lore
      else if (lowerLine.includes('you notice') || 
               lowerLine.includes('you see') || 
               lowerLine.includes('you observe') ||
               lowerLine.includes('you learn') ||
               lowerLine.includes('information') ||
               lowerLine.includes('knowledge')) {
        sectionType = 'info';
        sectionTitle = 'Information';
        icon = <Eye size={16} className="text-cyan-400" />;
      }
      
      // Group similar content together
      if (currentSection && currentSection.type === sectionType) {
        currentSection.content += '\n' + line;
      } else {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          type: sectionType,
          title: sectionTitle,
          content: line,
          icon,
          priority
        };
      }
    }
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    // Sort sections by priority
    sections.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium'];
    });
    
    return {
      title,
      sections,
      summary: sections.length > 3 ? `${sections.length} updates` : undefined
    };
  }, [message.content]);

  // Get message styling
  const getMessageStyle = () => {
    if (isPlayer) {
      return 'bg-blue-600/20 border-blue-400/30 ml-8';
    }
    
    switch (message.type) {
      case 'dm':
        return 'bg-purple-600/20 border-purple-400/30 mr-8';
      case 'ai':
        return 'bg-green-600/20 border-green-400/30 mr-8';
      case 'system':
        return 'bg-yellow-600/20 border-yellow-400/30';
      default:
        return 'bg-gray-600/20 border-gray-400/30';
    }
  };

  // Get avatar component
  const getAvatar = () => {
    if (isPlayer) {
      return (
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
          {character?.name?.charAt(0) || 'P'}
        </div>
      );
    }
    
    switch (message.type) {
      case 'dm':
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg shadow-lg">
            🎭
          </div>
        );
      case 'ai':
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white shadow-lg">
            <Bot size={20} />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white shadow-lg">
            <User size={20} />
          </div>
        );
    }
  };

  // Get section background color
  const getSectionBg = (type: string) => {
    switch (type) {
      case 'action': return 'bg-red-500/10 border-red-400/20';
      case 'dialogue': return 'bg-green-500/10 border-green-400/20';
      case 'location': return 'bg-blue-500/10 border-blue-400/20';
      case 'status': return 'bg-pink-500/10 border-pink-400/20';
      case 'choice': return 'bg-yellow-500/10 border-yellow-400/20';
      case 'dice': return 'bg-purple-500/10 border-purple-400/20';
      case 'info': return 'bg-cyan-500/10 border-cyan-400/20';
      default: return 'bg-white/5 border-white/10';
    }
  };

  return (
    <div className={`mb-6 p-4 rounded-lg border transition-all hover:bg-white/5 ${getMessageStyle()}`}>
      {/* Message Header */}
      <div className="flex items-start space-x-3 mb-4">
        {getAvatar()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-white">
                {message.sender || 
                 (isPlayer ? character?.name || 'You' : 
                  message.type === 'dm' ? 'Dungeon Master' : 
                  message.type === 'ai' ? 'AI Companion' : 'System')}
              </span>
              {message.metadata?.isAI && (
                <span className="text-xs bg-green-700/50 px-2 py-1 rounded text-green-200">
                  {message.metadata.characterClass || 'AI'}
                </span>
              )}
              {parsedContent.summary && (
                <span className="text-xs bg-white/20 px-2 py-1 rounded text-gray-300">
                  {parsedContent.summary}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
          
          {/* Main Title */}
          {parsedContent.title && (
            <h3 className="text-lg font-medium text-white mb-3 leading-relaxed">
              {parsedContent.title}
            </h3>
          )}
        </div>
      </div>

      {/* Structured Content Sections */}
      <div className="space-y-3">
        {parsedContent.sections.map((section, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${getSectionBg(section.type)}`}
          >
            {section.title && (
              <div className="flex items-center space-x-2 mb-2">
                {section.icon}
                <span className="text-sm font-medium text-white">
                  {section.title}
                </span>
              </div>
            )}
            <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
              {section.content}
            </div>
          </div>
        ))}
      </div>

      {/* Action Choices */}
      {message.choices && message.choices.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center space-x-2 mb-2">
            <Target size={16} className="text-yellow-400" />
            <span className="text-sm font-medium text-yellow-200">Choose your action:</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {message.choices.map((choice, index) => {
              const getChoiceIcon = (text: string) => {
                const lower = text.toLowerCase();
                if (lower.includes('attack') || lower.includes('fight')) return <Sword size={16} />;
                if (lower.includes('talk') || lower.includes('speak')) return <Users size={16} />;
                if (lower.includes('look') || lower.includes('examine')) return <Eye size={16} />;
                if (lower.includes('move') || lower.includes('go')) return <MapPin size={16} />;
                return <Zap size={16} />;
              };

              return (
                <button
                  key={index}
                  onClick={() => {
                    onChoiceSelect?.(choice);
                    onInputSelect?.(choice);
                  }}
                  className="group flex items-center space-x-3 p-3 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 hover:border-white/40 transition-all text-left"
                >
                  <span className="text-blue-300 group-hover:text-blue-200 transition-colors">
                    {getChoiceIcon(choice)}
                  </span>
                  <span className="text-white group-hover:text-blue-100 transition-colors font-medium">
                    {choice}
                  </span>
                  <span className="ml-auto text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                    {index + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StructuredMessage; 