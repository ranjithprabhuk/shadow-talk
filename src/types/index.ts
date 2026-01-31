// Export all types from a central location
export * from './user.types';
export * from './message.types';
export * from './peer.types';
export * from './settings.types';
export * from './protocol.types';

// Re-export commonly used types for convenience
export type {
  User,
  UserProfile,
} from './user.types';

export type {
  Message,
  FileData,
  MessageStatus,
  MessageType,
} from './message.types';

export type {
  PeerConnection,
  PeerInfo,
  ConnectionStatus,
  ConnectionQuality,
} from './peer.types';

export type {
  Settings,
  Theme,
  FontSize,
  ChatDensity,
} from './settings.types';

export type {
  ProtocolMessage,
  ProtocolMessageType,
} from './protocol.types';
