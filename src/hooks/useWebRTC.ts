import { useEffect, useRef, useCallback } from 'react';
import { RTCManager } from '@/services/webrtc/RTCManager';
import { ProtocolMessage, PeerInfo } from '@/types';
import { useSettingsStore } from '@/store/settingsStore';
import { usePeerStore } from '@/store/peerStore';

export const useWebRTC = () => {
  const rtcManagerRef = useRef<RTCManager | null>(null);
  const stunServers = useSettingsStore((state) => state.stunServers);
  const addPeer = usePeerStore((state) => state.addPeer);
  const removePeer = usePeerStore((state) => state.removePeer);

  // Initialize RTCManager
  useEffect(() => {
    if (!rtcManagerRef.current) {
      rtcManagerRef.current = new RTCManager(stunServers);

      // Setup callbacks
      rtcManagerRef.current.onConnectionStateChange = (peerId, state) => {
        console.log(`Connection state changed for ${peerId}:`, state);

        if (state === 'connected') {
          // Peer connected successfully
          console.log(`Peer ${peerId} connected`);
        } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          // Peer disconnected
          console.log(`Peer ${peerId} disconnected`);
          removePeer(peerId);
        }
      };

      rtcManagerRef.current.onDataChannelClose = (peerId) => {
        console.log(`Data channel closed for ${peerId}`);
        removePeer(peerId);
      };
    }

    return () => {
      // Cleanup on unmount
      rtcManagerRef.current?.closeAll();
    };
  }, [stunServers, removePeer]);

  /**
   * Create an offer to connect to a peer
   */
  const createOffer = useCallback(
    async (peerId: string): Promise<RTCSessionDescriptionInit> => {
      if (!rtcManagerRef.current) {
        throw new Error('RTCManager not initialized');
      }
      return rtcManagerRef.current.createOffer(peerId);
    },
    []
  );

  /**
   * Accept an offer from a peer
   */
  const acceptOffer = useCallback(
    async (
      peerId: string,
      offer: RTCSessionDescriptionInit
    ): Promise<RTCSessionDescriptionInit> => {
      if (!rtcManagerRef.current) {
        throw new Error('RTCManager not initialized');
      }
      return rtcManagerRef.current.acceptOffer(peerId, offer);
    },
    []
  );

  /**
   * Accept an answer from a peer
   */
  const acceptAnswer = useCallback(
    async (peerId: string, answer: RTCSessionDescriptionInit): Promise<void> => {
      if (!rtcManagerRef.current) {
        throw new Error('RTCManager not initialized');
      }
      return rtcManagerRef.current.acceptAnswer(peerId, answer);
    },
    []
  );

  /**
   * Add ICE candidate
   */
  const addIceCandidate = useCallback(
    async (peerId: string, candidate: RTCIceCandidateInit): Promise<void> => {
      if (!rtcManagerRef.current) {
        throw new Error('RTCManager not initialized');
      }
      return rtcManagerRef.current.addIceCandidate(peerId, candidate);
    },
    []
  );

  /**
   * Send message to a peer
   */
  const sendMessage = useCallback(
    (peerId: string, message: ProtocolMessage): void => {
      if (!rtcManagerRef.current) {
        throw new Error('RTCManager not initialized');
      }
      rtcManagerRef.current.sendMessage(peerId, message);
    },
    []
  );

  /**
   * Broadcast message to all peers
   */
  const broadcastMessage = useCallback((message: ProtocolMessage): void => {
    if (!rtcManagerRef.current) {
      throw new Error('RTCManager not initialized');
    }
    rtcManagerRef.current.broadcastMessage(message);
  }, []);

  /**
   * Close connection to a peer
   */
  const closePeer = useCallback(
    (peerId: string): void => {
      if (!rtcManagerRef.current) return;
      rtcManagerRef.current.closePeer(peerId);
      removePeer(peerId);
    },
    [removePeer]
  );

  /**
   * Get connected peers
   */
  const getConnectedPeers = useCallback((): string[] => {
    if (!rtcManagerRef.current) return [];
    return rtcManagerRef.current.getConnectedPeers();
  }, []);

  /**
   * Set message handler
   */
  const setMessageHandler = useCallback(
    (handler: (peerId: string, message: ProtocolMessage) => void) => {
      if (rtcManagerRef.current) {
        rtcManagerRef.current.onMessage = handler;
      }
    },
    []
  );

  /**
   * Set ICE candidate handler
   */
  const setIceCandidateHandler = useCallback(
    (handler: (peerId: string, candidate: RTCIceCandidate) => void) => {
      if (rtcManagerRef.current) {
        rtcManagerRef.current.onIceCandidate = handler;
      }
    },
    []
  );

  /**
   * Add peer info when connection is established
   */
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
    rtcManager: rtcManagerRef.current,
  };
};
