/**
 * Message Parser Utility
 * 
 * Parses unstructured AI text into organized, readable sections
 */

export interface MessageSection {
  type: 'narrative' | 'dialogue' | 'action' | 'status' | 'choice' | 'dice' | 'location' | 'info' | 'combat';
  title?: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  metadata?: {
    speaker?: string;
    location?: string;
    actionType?: string;
    rollType?: string;
  };
}

export interface ParsedMessage {
  title?: string;
  sections: MessageSection[];
  summary?: string;
  keywords: string[];
}

export class MessageParser {
  private static readonly SECTION_PATTERNS = {
    // Location/Setting indicators
    location: [
      /you find yourself (in|at|on|within)/i,
      /you are (in|at|on|within)/i,
      /the area around you/i,
      /you enter/i,
      /the room/i,
      /the chamber/i,
      /the forest/i,
      /the dungeon/i,
      /location:/i,
      /setting:/i
    ],
    
    // Dialogue patterns
    dialogue: [
      /"[^"]*"/,
      /says?:/i,
      /tells? you/i,
      /replies?/i,
      /whispers?/i,
      /shouts?/i,
      /asks?/i,
      /declares?/i,
      /'[^']*'/
    ],
    
    // Action/Combat patterns
    action: [
      /roll/i,
      /attack/i,
      /damage/i,
      /initiative/i,
      /combat/i,
      /fight/i,
      /battle/i,
      /🎲/,
      /\bd\d+/i,
      /you attempt/i,
      /you try/i,
      /make a.*check/i
    ],
    
    // Status/Health patterns
    status: [
      /health/i,
      /hp/i,
      /hit points/i,
      /status/i,
      /condition/i,
      /level/i,
      /experience/i,
      /you gain/i,
      /you lose/i,
      /takes.*damage/i,
      /heals?/i
    ],
    
    // Choice/Option patterns
    choice: [
      /you can/i,
      /options?:/i,
      /choose/i,
      /decide/i,
      /what (do|will) you/i,
      /^[1-9]\./,
      /^[-*•]/,
      /would you like/i
    ],
    
    // Information/Observation patterns
    info: [
      /you notice/i,
      /you see/i,
      /you observe/i,
      /you learn/i,
      /you discover/i,
      /you find/i,
      /you hear/i,
      /you smell/i,
      /information/i,
      /knowledge/i,
      /it appears/i,
      /it seems/i
    ]
  };

  static parse(content: string): ParsedMessage {
    const lines = content.split('\n').filter(line => line.trim());
    const sections: MessageSection[] = [];
    const keywords: string[] = [];
    
    let title: string | undefined;
    let currentSection: MessageSection | null = null;
    
    // Extract title (first substantial line)
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length > 10 && !this.isListItem(firstLine)) {
        title = firstLine.replace(/^[*#]+\s*/, '');
        lines.shift();
      }
    }
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      const sectionType = this.detectSectionType(trimmedLine);
      const priority = this.getPriority(sectionType, trimmedLine);
      
      // Extract keywords
      keywords.push(...this.extractKeywords(trimmedLine));
      
      // Group similar consecutive sections
      if (currentSection && currentSection.type === sectionType) {
        currentSection.content += '\n' + trimmedLine;
      } else {
        // Save previous section
        if (currentSection) {
          sections.push(currentSection);
        }
        
        // Create new section
        currentSection = {
          type: sectionType,
          title: this.getSectionTitle(sectionType),
          content: trimmedLine,
          priority,
          metadata: this.extractMetadata(sectionType, trimmedLine)
        };
      }
    }
    
    // Add final section
    if (currentSection) {
      sections.push(currentSection);
    }
    
    // Sort sections by priority and type importance
    sections.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const typeOrder = { action: 0, status: 1, dialogue: 2, location: 3, info: 4, choice: 5, narrative: 6 };
      
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return (typeOrder[a.type] || 10) - (typeOrder[b.type] || 10);
    });
    
    return {
      title,
      sections,
      summary: sections.length > 3 ? `${sections.length} updates` : undefined,
      keywords: [...new Set(keywords)].slice(0, 10) // Unique keywords, limit 10
    };
  }
  
  private static detectSectionType(line: string): MessageSection['type'] {
    const lowerLine = line.toLowerCase();
    
    // Check each pattern type
    for (const [type, patterns] of Object.entries(this.SECTION_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(line)) {
          return type as MessageSection['type'];
        }
      }
    }
    
    // Special cases
    if (this.isListItem(line)) {
      return 'choice';
    }
    
    if (line.includes('"') || line.includes("'")) {
      return 'dialogue';
    }
    
    // Default to narrative
    return 'narrative';
  }
  
  private static getPriority(type: MessageSection['type'], line: string): 'high' | 'medium' | 'low' {
    const lowerLine = line.toLowerCase();
    
    // High priority indicators
    if (type === 'action' || type === 'status') return 'high';
    if (lowerLine.includes('critical') || lowerLine.includes('important')) return 'high';
    if (lowerLine.includes('urgent') || lowerLine.includes('danger')) return 'high';
    if (type === 'choice') return 'high';
    
    // Low priority indicators
    if (type === 'info' && !lowerLine.includes('notice')) return 'low';
    if (lowerLine.includes('distant') || lowerLine.includes('faint')) return 'low';
    
    return 'medium';
  }
  
  private static getSectionTitle(type: MessageSection['type']): string {
    const titles: Record<MessageSection['type'], string> = {
      narrative: 'Story',
      dialogue: 'Dialogue',
      action: 'Action',
      status: 'Status',
      choice: 'Options',
      dice: 'Dice Roll',
      location: 'Location',
      info: 'Information',
      combat: 'Combat'
    };
    
    return titles[type] || 'Update';
  }
  
  private static extractMetadata(type: MessageSection['type'], line: string): MessageSection['metadata'] {
    const metadata: MessageSection['metadata'] = {};
    
    if (type === 'dialogue') {
      // Extract speaker if mentioned
      const speakerMatch = line.match(/(\w+)\s+(says?|tells?|replies?|whispers?|shouts?)/i);
      if (speakerMatch) {
        metadata.speaker = speakerMatch[1];
      }
    }
    
    if (type === 'action') {
      // Extract roll type
      const rollMatch = line.match(/(\w+)\s+check|roll.*(\w+)/i);
      if (rollMatch) {
        metadata.rollType = rollMatch[1] || rollMatch[2];
      }
      
      // Extract action type
      if (line.toLowerCase().includes('attack')) metadata.actionType = 'attack';
      else if (line.toLowerCase().includes('defend')) metadata.actionType = 'defense';
      else if (line.toLowerCase().includes('move')) metadata.actionType = 'movement';
    }
    
    return metadata;
  }
  
  private static extractKeywords(line: string): string[] {
    const keywords: string[] = [];
    const lowerLine = line.toLowerCase();
    
    // Common important terms
    const importantTerms = [
      'combat', 'battle', 'fight', 'attack', 'damage', 'health', 'hp',
      'spell', 'magic', 'potion', 'weapon', 'armor', 'shield',
      'door', 'chest', 'key', 'treasure', 'gold', 'items',
      'npc', 'enemy', 'ally', 'friend', 'merchant', 'guard',
      'quest', 'mission', 'objective', 'goal', 'task',
      'level', 'experience', 'skill', 'ability', 'stat'
    ];
    
    for (const term of importantTerms) {
      if (lowerLine.includes(term)) {
        keywords.push(term);
      }
    }
    
    return keywords;
  }
  
  private static isListItem(line: string): boolean {
    return /^[1-9]\.|^[-*•]/.test(line.trim());
  }
}

export default MessageParser; 