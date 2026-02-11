import { PeerConnection, ProtocolMessage } from '@/types';

export interface OfferWithCandidates {
  offer: RTCSessionDescriptionInit;
  candidates: RTCIceCandidateInit[];
}

export interface AnswerWithCandidates {
  answer: RTCSessionDescriptionInit;
  candidates: RTCIceCandidateInit[];
}

// Default TURN servers for NAT traversal (Metered free relay)
const DEFAULT_TURN_CREDENTIAL = '2D7JvfXbwbhPMz3R';
const DEFAULT_TURN_USERNAME = 'e8dd65b92a0ddd3da91b33de';

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: 'turn:a.relay.metered.ca:80',
    username: DEFAULT_TURN_USERNAME,
    credential: DEFAULT_TURN_CREDENTIAL,
  },
  {
    urls: 'turn:a.relay.metered.ca:80?transport=tcp',
    username: DEFAULT_TURN_USERNAME,
    credential: DEFAULT_TURN_CREDENTIAL,
  },
  {
    urls: 'turn:a.relay.metered.ca:443',
    username: DEFAULT_TURN_USERNAME,
    credential: DEFAULT_TURN_CREDENTIAL,
  },
  {
    urls: 'turns:a.relay.metered.ca:443?transport=tcp',
    username: DEFAULT_TURN_USERNAME,
    credential: DEFAULT_TURN_CREDENTIAL,
  },
];

export class RTCManager {
  private peers: Map<string, PeerConnection> = new Map();
  private configuration: RTCConfiguration = {
    iceServers: DEFAULT_ICE_SERVERS,
  };

  // Callbacks for events
  public onIceCandidate?: (peerId: string, candidate: RTCIceCandidate) => void;
  public onMessage?: (peerId: string, message: ProtocolMessage) => void;
  public onConnectionStateChange?: (peerId: string, state: RTCPeerConnectionState) => void;
  public onDataChannelOpen?: (peerId: string) => void;
  public onDataChannelClose?: (peerId: string) => void;
  public onRemoteTrack?: (peerId: string, stream: MediaStream) => void;

  constructor(stunServers?: string[], turnServers?: RTCIceServer[]) {
    // Only override defaults if custom servers are explicitly provided
    if ((stunServers && stunServers.length > 0) || (turnServers && turnServers.length > 0)) {
      const iceServers: RTCIceServer[] = [];

      if (stunServers && stunServers.length > 0) {
        iceServers.push(...stunServers.map((url) => ({ urls: url })));
      }
      if (turnServers && turnServers.length > 0) {
        iceServers.push(...turnServers);
      }

      this.configuration.iceServers = iceServers;
    }

    console.log(`[RTCManager] Configured with ${this.configuration.iceServers!.length} ICE servers (STUN + TURN)`);
  }

  /**
   * Collect all ICE candidates until gathering completes or times out.
   * Returns the collected candidates as serializable objects.
   */
  private collectIceCandidates(pc: RTCPeerConnection, timeout = 10000): Promise<RTCIceCandidateInit[]> {
    return new Promise((resolve) => {
      const candidates: RTCIceCandidateInit[] = [];

      const done = () => {
        console.log(`[RTCManager] Collected ${candidates.length} ICE candidates`);
        resolve(candidates);
      };

      const timeoutId = setTimeout(() => {
        console.log('[RTCManager] ICE candidate collection timed out');
        pc.removeEventListener('icecandidate', handleCandidate);
        done();
      }, timeout);

      const handleCandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
          console.log(`[RTCManager] ICE candidate: ${event.candidate.candidate.substring(0, 60)}...`);
          candidates.push(event.candidate.toJSON());
        } else {
          // null candidate means gathering is complete
          console.log('[RTCManager] ICE gathering complete (null candidate)');
          clearTimeout(timeoutId);
          pc.removeEventListener('icecandidate', handleCandidate);
          done();
        }
      };

      pc.addEventListener('icecandidate', handleCandidate);
    });
  }

  /**
   * Create an offer with collected ICE candidates.
   */
  async createOffer(peerId: string): Promise<OfferWithCandidates> {
    const pc = new RTCPeerConnection(this.configuration);

    // Create data channel (as offerer)
    const dataChannel = pc.createDataChannel('shadowtalk', {
      ordered: true,
    });

    this.setupDataChannel(peerId, dataChannel);
    this.setupConnectionHandlers(peerId, pc);

    // Store peer connection
    this.peers.set(peerId, {
      peerId,
      connection: pc,
      dataChannel,
      mediaStream: null,
      status: 'connecting',
    });

    // Create offer
    const offer = await pc.createOffer();

    // Start collecting ICE candidates BEFORE setLocalDescription
    // (setLocalDescription triggers ICE gathering)
    const candidatePromise = this.collectIceCandidates(pc);

    await pc.setLocalDescription(offer);

    // Wait for all candidates to be gathered
    const candidates = await candidatePromise;

    console.log(`[RTCManager] createOffer complete: ${candidates.length} candidates`);

    return {
      offer: { type: offer.type, sdp: pc.localDescription!.sdp },
      candidates,
    };
  }

  /**
   * Accept an offer and create an answer with collected ICE candidates.
   * Also adds the remote ICE candidates from the offer.
   */
  async acceptOffer(
    peerId: string,
    offer: RTCSessionDescriptionInit,
    remoteCandidates: RTCIceCandidateInit[]
  ): Promise<AnswerWithCandidates> {
    const pc = new RTCPeerConnection(this.configuration);

    this.setupConnectionHandlers(peerId, pc);

    // Handle incoming data channel
    pc.ondatachannel = (event) => {
      console.log(`[RTCManager] Received data channel from ${peerId}`);
      this.setupDataChannel(peerId, event.channel);
      const peerConn = this.peers.get(peerId);
      if (peerConn) {
        peerConn.dataChannel = event.channel;
      }
    };

    // Store peer connection (data channel will be set when received)
    this.peers.set(peerId, {
      peerId,
      connection: pc,
      dataChannel: null,
      mediaStream: null,
      status: 'connecting',
    });

    // Set remote description
    await pc.setRemoteDescription(offer);

    // Add remote ICE candidates from the offer
    for (const candidate of remoteCandidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log(`[RTCManager] Added remote candidate from offer`);
      } catch (err) {
        console.warn('[RTCManager] Failed to add remote candidate:', err);
      }
    }

    // Create answer
    const answer = await pc.createAnswer();

    // Start collecting ICE candidates BEFORE setLocalDescription
    const candidatePromise = this.collectIceCandidates(pc);

    await pc.setLocalDescription(answer);

    // Wait for all candidates to be gathered
    const candidates = await candidatePromise;

    console.log(`[RTCManager] acceptOffer complete: ${candidates.length} candidates`);

    return {
      answer: { type: answer.type, sdp: pc.localDescription!.sdp },
      candidates,
    };
  }

  /**
   * Accept an answer to complete the connection.
   * Also adds the remote ICE candidates from the answer.
   */
  async acceptAnswer(
    peerId: string,
    answer: RTCSessionDescriptionInit,
    remoteCandidates: RTCIceCandidateInit[]
  ): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error(`Peer ${peerId} not found`);
    }

    await peer.connection.setRemoteDescription(answer);

    // Add remote ICE candidates from the answer
    for (const candidate of remoteCandidates) {
      try {
        await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log(`[RTCManager] Added remote candidate from answer`);
      } catch (err) {
        console.warn('[RTCManager] Failed to add remote candidate:', err);
      }
    }

    console.log(`[RTCManager] acceptAnswer complete, connection state: ${peer.connection.connectionState}`);
  }

  /**
   * Add an ICE candidate received from the remote peer
   */
  async addIceCandidate(
    peerId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error(`Peer ${peerId} not found`);
    }

    try {
      await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  /**
   * Send a message to a specific peer
   */
  sendMessage(peerId: string, message: ProtocolMessage): void {
    const peer = this.peers.get(peerId);

    if (!peer?.dataChannel) {
      throw new Error(`No data channel for peer ${peerId}`);
    }

    if (peer.dataChannel.readyState !== 'open') {
      throw new Error(`Data channel not open for peer ${peerId} (state: ${peer.dataChannel.readyState})`);
    }

    try {
      const data = JSON.stringify(message);
      console.log(`[RTCManager] Sending to ${peerId}, channel: ${peer.dataChannel.readyState}, conn: ${peer.connection.connectionState}`);
      peer.dataChannel.send(data);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Broadcast a message to all connected peers.
   * Returns the number of peers the message was actually sent to.
   */
  broadcastMessage(message: ProtocolMessage): number {
    let sentCount = 0;
    const errors: string[] = [];

    this.peers.forEach((peer, peerId) => {
      try {
        if (peer.dataChannel?.readyState === 'open') {
          this.sendMessage(peerId, message);
          sentCount++;
        } else {
          console.warn(
            `Skipping peer ${peerId}: channel=${peer.dataChannel ? peer.dataChannel.readyState : 'none'}`
          );
        }
      } catch (error) {
        errors.push(peerId);
        console.error(`Failed to send to ${peerId}:`, error);
      }
    });

    console.log(`[RTCManager] Broadcast to ${sentCount}/${this.peers.size} peers`);

    if (sentCount === 0 && this.peers.size > 0) {
      throw new Error('No peers with open data channels');
    }

    return sentCount;
  }

  /**
   * Add a media stream (for voice/video calls)
   */
  async addMediaStream(peerId: string, stream: MediaStream): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error(`Peer ${peerId} not found`);
    }

    stream.getTracks().forEach((track) => {
      peer.connection.addTrack(track, stream);
    });

    peer.mediaStream = stream;
  }

  /**
   * Remove media stream (end call)
   */
  removeMediaStream(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    peer.mediaStream?.getTracks().forEach((track) => {
      track.stop();
    });

    peer.mediaStream = null;
  }

  /**
   * Close connection to a peer
   */
  closePeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    if (peer.dataChannel) {
      peer.dataChannel.close();
    }

    this.removeMediaStream(peerId);
    peer.connection.close();
    this.peers.delete(peerId);
  }

  /**
   * Close all connections
   */
  closeAll(): void {
    this.peers.forEach((_, peerId) => {
      this.closePeer(peerId);
    });
  }

  /**
   * Get connection status for a peer
   */
  getPeerStatus(peerId: string): RTCPeerConnectionState | null {
    const peer = this.peers.get(peerId);
    return peer ? peer.connection.connectionState : null;
  }

  /**
   * Get all connected peer IDs
   */
  getConnectedPeers(): string[] {
    const connected: string[] = [];
    this.peers.forEach((peer, peerId) => {
      if (peer.connection.connectionState === 'connected') {
        connected.push(peerId);
      }
    });
    return connected;
  }

  /**
   * Setup data channel event handlers
   */
  private setupDataChannel(peerId: string, channel: RTCDataChannel): void {
    channel.onopen = () => {
      console.log(`[RTCManager] Data channel OPENED with ${peerId}`);
      this.updatePeerStatus(peerId, 'connected');
      this.onDataChannelOpen?.(peerId);
    };

    channel.onclose = () => {
      console.log(`[RTCManager] Data channel closed with ${peerId}`);
      this.onDataChannelClose?.(peerId);
    };

    channel.onerror = (error) => {
      console.error(`[RTCManager] Data channel error with ${peerId}:`, error);
    };

    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ProtocolMessage;
        console.log(`[RTCManager] Received ${message.type} from ${peerId}`);
        if (this.onMessage) {
          this.onMessage(peerId, message);
        } else {
          console.error('[RTCManager] onMessage NOT set! Message dropped.');
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
  }

  /**
   * Setup peer connection event handlers (renamed to avoid confusion)
   */
  private setupConnectionHandlers(peerId: string, pc: RTCPeerConnection): void {
    // ICE candidates are collected explicitly via collectIceCandidates().
    // No onicecandidate handler needed here.

    pc.onconnectionstatechange = () => {
      console.log(`[RTCManager] Connection: ${pc.connectionState} for ${peerId}`);
      this.updatePeerStatus(peerId, pc.connectionState);
      this.onConnectionStateChange?.(peerId, pc.connectionState);

      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeer(peerId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[RTCManager] ICE: ${pc.iceConnectionState} for ${peerId}`);

      if (pc.iceConnectionState === 'failed') {
        console.log(`[RTCManager] ICE failed for ${peerId}, attempting restart`);
        pc.restartIce();
      }
    };

    pc.ontrack = (event) => {
      console.log(`[RTCManager] Remote track from ${peerId}`);
      if (event.streams && event.streams[0]) {
        this.onRemoteTrack?.(peerId, event.streams[0]);
      }
    };
  }

  private updatePeerStatus(
    peerId: string,
    state: RTCPeerConnectionState | 'connected'
  ): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.status = state as PeerConnection['status'];
    }
  }

  updateStunServers(servers: string[]): void {
    this.configuration.iceServers = servers.map((url) => ({ urls: url }));
  }
}
