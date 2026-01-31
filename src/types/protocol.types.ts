import { Message } from './message.types';
import { PeerInfo } from './peer.types';
import { FileMetadata, FileChunk } from './message.types';

// Protocol message types for P2P communication
export type ProtocolMessageType =
  | 'USER_INFO'
  | 'MESSAGE'
  | 'DELIVERY_RECEIPT'
  | 'READ_RECEIPT'
  | 'TYPING_START'
  | 'TYPING_STOP'
  | 'PEER_LIST'
  | 'PEER_OFFER'
  | 'NEW_PEER'
  | 'PEER_LEFT'
  | 'FILE_OFFER'
  | 'FILE_ACCEPT'
  | 'FILE_REJECT'
  | 'FILE_CHUNK'
  | 'FILE_COMPLETE'
  | 'CALL_OFFER'
  | 'CALL_ANSWER'
  | 'CALL_REJECT'
  | 'CALL_END'
  | 'PING'
  | 'PONG';

export interface ProtocolMessage {
  type: ProtocolMessageType;
  payload: any;
  timestamp: number;
  messageId?: string;
}

// User Info Exchange
export interface UserInfoMessage {
  type: 'USER_INFO';
  payload: PeerInfo;
  timestamp: number;
}

// Chat Messages
export interface ChatMessage {
  type: 'MESSAGE';
  payload: Message;
  timestamp: number;
  messageId: string;
}

export interface DeliveryReceipt {
  type: 'DELIVERY_RECEIPT';
  payload: {
    messageId: string;
  };
  timestamp: number;
}

export interface ReadReceipt {
  type: 'READ_RECEIPT';
  payload: {
    messageId: string;
  };
  timestamp: number;
}

// Typing Indicators
export interface TypingStart {
  type: 'TYPING_START';
  payload: {
    peerId: string;
    chatType: 'group' | 'private';
    targetPeerId?: string; // for private chats
  };
  timestamp: number;
}

export interface TypingStop {
  type: 'TYPING_STOP';
  payload: {
    peerId: string;
    chatType: 'group' | 'private';
    targetPeerId?: string;
  };
  timestamp: number;
}

// Mesh Networking
export interface PeerListMessage {
  type: 'PEER_LIST';
  payload: {
    peers: PeerInfo[];
  };
  timestamp: number;
}

export interface PeerOfferMessage {
  type: 'PEER_OFFER';
  payload: {
    fromPeerId: string;
    toPeerId: string;
    offer: RTCSessionDescriptionInit;
    userInfo: PeerInfo;
  };
  timestamp: number;
}

export interface NewPeerMessage {
  type: 'NEW_PEER';
  payload: {
    peer: PeerInfo;
  };
  timestamp: number;
}

export interface PeerLeftMessage {
  type: 'PEER_LEFT';
  payload: {
    peerId: string;
  };
  timestamp: number;
}

// File Transfer
export interface FileOfferMessage {
  type: 'FILE_OFFER';
  payload: FileMetadata;
  timestamp: number;
}

export interface FileAcceptMessage {
  type: 'FILE_ACCEPT';
  payload: {
    fileId: string;
  };
  timestamp: number;
}

export interface FileRejectMessage {
  type: 'FILE_REJECT';
  payload: {
    fileId: string;
  };
  timestamp: number;
}

export interface FileChunkMessage {
  type: 'FILE_CHUNK';
  payload: FileChunk;
  timestamp: number;
}

export interface FileCompleteMessage {
  type: 'FILE_COMPLETE';
  payload: {
    fileId: string;
  };
  timestamp: number;
}

// Voice/Video Calls
export interface CallOfferMessage {
  type: 'CALL_OFFER';
  payload: {
    callId: string;
    fromPeerId: string;
    toPeerId: string;
    callType: 'audio' | 'video';
  };
  timestamp: number;
}

export interface CallAnswerMessage {
  type: 'CALL_ANSWER';
  payload: {
    callId: string;
    accepted: boolean;
  };
  timestamp: number;
}

export interface CallRejectMessage {
  type: 'CALL_REJECT';
  payload: {
    callId: string;
  };
  timestamp: number;
}

export interface CallEndMessage {
  type: 'CALL_END';
  payload: {
    callId: string;
  };
  timestamp: number;
}

// Connection Health
export interface PingMessage {
  type: 'PING';
  payload: {
    timestamp: number;
  };
  timestamp: number;
}

export interface PongMessage {
  type: 'PONG';
  payload: {
    pingTimestamp: number;
  };
  timestamp: number;
}
