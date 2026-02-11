import { useEffect, useCallback } from 'react';
import { RTCManager, OfferWithCandidates, AnswerWithCandidates } from '@/services/webrtc/RTCManager';
import { ProtocolMessage, PeerInfo } from '@/types';
import { useSettingsStore } from '@/store/settingsStore';
import { usePeerStore } from '@/store/peerStore';

// Persist RTCManager on window so it survives Vite HMR module re-evaluation.
// Without this, HMR creates a new RTCManager while live WebRTC connections
// remain on the old orphaned instance, causing messages to never be received.
const WIN_KEY = '__shadowtalk_rtc__';

function getRTCManager(stunServers?: string[], turnServers?: RTCIceServer[]): RTCManager {
  const w = window as any;
  if (!w[WIN_KEY]) {
    w[WIN_KEY] = new RTCManager(stunServers, turnServers);
  }
  return w[WIN_KEY] as RTCManager;
}

export const useWebRTC = () => {
  const stunServers = useSettingsStore((state) => state.stunServers);
  const turnServers = useSettingsStore((state) => state.turnServers);
  const addPeer = usePeerStore((state) => state.addPeer);
  const removePeer = usePeerStore((state) => state.removePeer);

  // Setup connection callbacks on every render of the first component that uses this hook.
  // We always re-assign so that after HMR the callbacks point to current store references.
  useEffect(() => {
    const manager = getRTCManager(stunServers, turnServers);

    manager.onConnectionStateChange = (peerId, state) => {
      console.log(`[WebRTC] Connection state for ${peerId}:`, state);

      if (state === 'connected') {
        console.log(`[WebRTC] Peer ${peerId} connected`);
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        console.log(`[WebRTC] Peer ${peerId} disconnected`);
        usePeerStore.getState().removePeer(peerId);
      }
    };

    manager.onDataChannelClose = (peerId) => {
      console.log(`[WebRTC] Data channel closed for ${peerId}`);
      usePeerStore.getState().removePeer(peerId);
    };
  }, [stunServers, addPeer, removePeer]);

  const createOffer = useCallback(
    async (peerId: string): Promise<OfferWithCandidates> => {
      const manager = getRTCManager();
      return manager.createOffer(peerId);
    },
    []
  );

  const acceptOffer = useCallback(
    async (
      peerId: string,
      offer: RTCSessionDescriptionInit,
      remoteCandidates: RTCIceCandidateInit[]
    ): Promise<AnswerWithCandidates> => {
      const manager = getRTCManager();
      return manager.acceptOffer(peerId, offer, remoteCandidates);
    },
    []
  );

  const acceptAnswer = useCallback(
    async (
      peerId: string,
      answer: RTCSessionDescriptionInit,
      remoteCandidates: RTCIceCandidateInit[]
    ): Promise<void> => {
      const manager = getRTCManager();
      return manager.acceptAnswer(peerId, answer, remoteCandidates);
    },
    []
  );

  const addIceCandidate = useCallback(
    async (peerId: string, candidate: RTCIceCandidateInit): Promise<void> => {
      const manager = getRTCManager();
      return manager.addIceCandidate(peerId, candidate);
    },
    []
  );

  const sendMessage = useCallback(
    (peerId: string, message: ProtocolMessage): void => {
      const manager = getRTCManager();
      manager.sendMessage(peerId, message);
    },
    []
  );

  const broadcastMessage = useCallback((message: ProtocolMessage): void => {
    const manager = getRTCManager();
    manager.broadcastMessage(message);
  }, []);

  const closePeer = useCallback(
    (peerId: string): void => {
      const manager = getRTCManager();
      manager.closePeer(peerId);
      removePeer(peerId);
    },
    [removePeer]
  );

  const getConnectedPeers = useCallback((): string[] => {
    const manager = getRTCManager();
    return manager.getConnectedPeers();
  }, []);

  const setMessageHandler = useCallback(
    (handler: (peerId: string, message: ProtocolMessage) => void) => {
      const manager = getRTCManager();
      console.log('[WebRTC] Setting message handler on RTCManager');
      manager.onMessage = (peerId, message) => {
        console.log(`[WebRTC] onMessage fired from ${peerId}:`, message.type);
        handler(peerId, message);
      };
    },
    []
  );

  const setIceCandidateHandler = useCallback(
    (handler: (peerId: string, candidate: RTCIceCandidate) => void) => {
      const manager = getRTCManager();
      manager.onIceCandidate = handler;
    },
    []
  );

  const registerPeer = useCallback(
    (peerInfo: PeerInfo) => {
      addPeer(peerInfo);
    },
    [addPeer]
  );

  return {
    createOffer,
    acceptOffer,
    acceptAnswer,
    addIceCandidate,
    sendMessage,
    broadcastMessage,
    closePeer,
    getConnectedPeers,
    setMessageHandler,
    setIceCandidateHandler,
    registerPeer,
    rtcManager: getRTCManager(),
  };
};
