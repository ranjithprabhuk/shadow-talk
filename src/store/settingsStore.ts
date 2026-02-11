import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings } from '@/types';

interface SettingsState extends Settings {
  setTheme: (theme: Settings['theme']) => void;
  setFontSize: (fontSize: Settings['fontSize']) => void;
  setChatDensity: (density: Settings['chatDensity']) => void;
  setNotificationSound: (sound: string) => void;
  setNotificationEnabled: (enabled: boolean) => void;
  setBrowserNotificationEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  setShowAge: (show: boolean) => void;
  setShowGender: (show: boolean) => void;
  setAutoAcceptPrivateChats: (accept: boolean) => void;
  blockPeer: (peerId: string) => void;
  unblockPeer: (peerId: string) => void;
  updateStunServers: (servers: string[]) => void;
  resetSettings: () => void;
}

const defaultSettings: Settings = {
  theme: 'auto',
  fontSize: 'medium',
  chatDensity: 'comfortable',
  notificationSound: 'default',
  notificationEnabled: true,
  browserNotificationEnabled: true,
  volume: 0.5,
  showAge: true,
  showGender: true,
  autoAcceptPrivateChats: false,
  blockedPeers: [],
  stunServers: [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
  ],
  turnServers: [
    {
      urls: 'turn:a.relay.metered.ca:80',
      username: 'e8dd65b92a0ddd3da91b33de',
      credential: '2D7JvfXbwbhPMz3R',
    },
    {
      urls: 'turn:a.relay.metered.ca:80?transport=tcp',
      username: 'e8dd65b92a0ddd3da91b33de',
      credential: '2D7JvfXbwbhPMz3R',
    },
    {
      urls: 'turn:a.relay.metered.ca:443',
      username: 'e8dd65b92a0ddd3da91b33de',
      credential: '2D7JvfXbwbhPMz3R',
    },
    {
      urls: 'turns:a.relay.metered.ca:443?transport=tcp',
      username: 'e8dd65b92a0ddd3da91b33de',
      credential: '2D7JvfXbwbhPMz3R',
    },
  ],
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          // Auto theme - check system preference
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },

      setFontSize: (fontSize) => set({ fontSize }),
      setChatDensity: (chatDensity) => set({ chatDensity }),
      setNotificationSound: (notificationSound) => set({ notificationSound }),
      setNotificationEnabled: (notificationEnabled) => set({ notificationEnabled }),
      setBrowserNotificationEnabled: (browserNotificationEnabled) =>
        set({ browserNotificationEnabled }),
      setVolume: (volume) => set({ volume }),
      setShowAge: (showAge) => set({ showAge }),
      setShowGender: (showGender) => set({ showGender }),
      setAutoAcceptPrivateChats: (autoAcceptPrivateChats) =>
        set({ autoAcceptPrivateChats }),

      blockPeer: (peerId) =>
        set((state) => ({
          blockedPeers: [...state.blockedPeers, peerId],
        })),

      unblockPeer: (peerId) =>
        set((state) => ({
          blockedPeers: state.blockedPeers.filter((id) => id !== peerId),
        })),

      updateStunServers: (stunServers) => set({ stunServers }),

      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'shadowtalk-settings',
      // Merge persisted state with defaults so new fields (like turnServers) are available
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<SettingsState>),
        // Always ensure turnServers exists (missing from old persisted data)
        turnServers: (persisted as any)?.turnServers ?? defaultSettings.turnServers,
      }),
    }
  )
);

// Initialize theme on app load
if (typeof window !== 'undefined') {
  const settings = useSettingsStore.getState();
  settings.setTheme(settings.theme);
}
