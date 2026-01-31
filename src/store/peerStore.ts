import { create } from 'zustand';
import { PeerInfo } from '@/types';

interface PeerState {
  peers: Map<string, PeerInfo>;
  addPeer: (peer: PeerInfo) => void;
  removePeer: (peerId: string) => void;
  updatePeer: (peerId: string, updates: Partial<PeerInfo>) => void;
  getPeer: (peerId: string) => PeerInfo | undefined;
  getAllPeers: () => PeerInfo[];
  clearPeers: () => void;
}

export const usePeerStore = create<PeerState>((set, get) => ({
  peers: new Map(),

  addPeer: (peer) =>
    set((state) => {
      const newPeers = new Map(state.peers);
      newPeers.set(peer.peerId, peer);
      return { peers: newPeers };
    }),

  removePeer: (peerId) =>
    set((state) => {
      const newPeers = new Map(state.peers);
      newPeers.delete(peerId);
      return { peers: newPeers };
    }),

  updatePeer: (peerId, updates) =>
    set((state) => {
      const newPeers = new Map(state.peers);
      const existingPeer = newPeers.get(peerId);
      if (existingPeer) {
        newPeers.set(peerId, { ...existingPeer, ...updates });
      }
      return { peers: newPeers };
    }),

  getPeer: (peerId) => get().peers.get(peerId),

  getAllPeers: () => Array.from(get().peers.values()),

  clearPeers: () => set({ peers: new Map() }),
}));
