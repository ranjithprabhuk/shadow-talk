export interface PeerConnection {
  peerId: string;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  mediaStream: MediaStream | null;
  status: 'connecting' | 'connected' | 'disconnected' | 'failed';
}

export interface PeerInfo {
  peerId: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  age: number;
  avatar?: string;
  showAge: boolean;
  showGender: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface SignalingData {
  type: 'offer' | 'answer' | 'ice-candidate';
  peerId: string;
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
  userInfo?: PeerInfo;
}

export interface ConnectionOffer {
  peerId: string;
  offer: RTCSessionDescriptionInit;
  userInfo: PeerInfo;
  timestamp: number;
}

export interface ConnectionAnswer {
  peerId: string;
  answer: RTCSessionDescriptionInit;
  userInfo: PeerInfo;
  timestamp: number;
}

export type ConnectionStatus = PeerConnection['status'];
export type ConnectionQuality = PeerInfo['connectionQuality'];
