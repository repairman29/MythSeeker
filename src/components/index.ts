import { lazy } from 'react';

// Lazy load all major components to reduce initial bundle size
export const CharacterSheet = lazy(() => import('./CharacterSheet'));
export const CombatSystem = lazy(() => import('./CombatSystem'));
export const QuestSystem = lazy(() => import('./QuestSystem'));
export const NPCInteraction = lazy(() => import('./NPCInteraction'));
export const Inventory = lazy(() => import('./Inventory'));
export const WorldMap = lazy(() => import('./WorldMap'));
export const CampaignLog = lazy(() => import('./CampaignLog'));
export const RightDrawer = lazy(() => import('./RightDrawer'));
export const FloatingActionButton = lazy(() => import('./FloatingActionButton'));
export const HelpSystem = lazy(() => import('./HelpSystem'));
export const SimpleHelp = lazy(() => import('./SimpleHelp'));
export const WelcomeOverlay = lazy(() => import('./WelcomeOverlay'));
export const ToastNotifications = lazy(() => import('./ToastNotifications'));
export const VirtualizedMessageList = lazy(() => import('./VirtualizedMessageList'));
export const GameInterface = lazy(() => import('./GameInterface'));
export { default as AIPartyManager, useAIPartyManager } from './AIPartyManager';

// Non-lazy components (smaller, frequently used)
export { default as Tooltip } from './Tooltip';
export { default as NavBar } from './NavBar';
export { default as TopBar } from './TopBar';
export { default as MainTabs } from './MainTabs';
export { default as Animations } from './Animations';
export * from './Transitions'; 