export interface Settings {
  // Appearance
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  chatDensity: 'comfortable' | 'compact';

  // Notifications
  notificationSound: string;
  notificationEnabled: boolean;
  browserNotificationEnabled: boolean;
  volume: number;

  // Privacy
  showAge: boolean;
  showGender: boolean;
  autoAcceptPrivateChats: boolean;
  blockedPeers: string[]; // Array of peer IDs

  // Connection
  stunServers: string[];
  turnServers?: RTCIceServer[];
}

export interface NotificationSettings {
  notificationSound: string;
  notificationEnabled: boolean;
  browserNotificationEnabled: boolean;
  volume: number;
}

export interface PrivacySettings {
  showAge: boolean;
  showGender: boolean;
  autoAcceptPrivateChats: boolean;
  blockedPeers: string[];
}

export interface AppearanceSettings {
  theme: Settings['theme'];
  fontSize: Settings['fontSize'];
  chatDensity: Settings['chatDensity'];
}

export interface ConnectionSettings {
  stunServers: string[];
  turnServers?: RTCIceServer[];
}

export type Theme = Settings['theme'];
export type FontSize = Settings['fontSize'];
export type ChatDensity = Settings['chatDensity'];
