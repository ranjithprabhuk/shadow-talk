import { PeerConnection, PeerInfo, ProtocolMessage } from '@/types';

export class RTCManager {
  private peers: Map<string, PeerConnection> = new Map();
  private configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  };

  // Callbacks for events
  public onIceCandidate?: (peerId: string, candidate: RTCIceCandidate) => void;
  public onMessage?: (peerId: string, message: ProtocolMessage) => void;
  public onConnectionStateChange?: (peerId: string, state: RTCPeerConnectionState) => void;
  public onDataChannelOpen?: (peerId: string) => void;
  public onDataChannelClose?: (peerId: string) => void;
  public onRemoteTrack?: (peerId: string, stream: MediaStream) => void;

  constructor(stunServers?: string[]) {
    if (stunServers && stunServers.length > 0) {
      this.configuration.iceServers = stunServers.map((url) => ({ urls: url }));
    }
  }

  /**
   * Create an offer to establish a connection with a peer
   */
  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    const pc = new RTCPeerConnection(this.configuration);

    // Create data channel (as offerer)
    const dataChannel = pc.createDataChannel('shadowtalk', {
      ordered: true,
    });

    this.setupDataChannel(peerId, dataChannel);
    this.setupPeerConnection(peerId, pc);

    // Store peer connection
    this.peers.set(peerId, {
      peerId,
      connection: pc,
      dataChannel,
      mediaStream: null,
      status: 'connecting',
    });

    // Create and set local description
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    return offer;
  }

  /**
   * Accept an offer and create an answer
   */
  async acceptOffer(
    peerId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    const pc = new RTCPeerConnection(this.configuration);

    this.setupPeerConnection(peerId, pc);

    // Handle incoming data channel
    pc.ondatachannel = (event) => {
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

    // Set remote description and create answer
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    return answer;
  }

  /**
   * Accept an answer to complete the connection
   */
  async acceptAnswer(
    peerId: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error(`Peer ${peerId} not found`);
    }

    await peer.connection.setRemoteDescription(answer);
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
      throw new Error(`Data channel not open for peer ${peerId}`);
    }

    try {
      const data = JSON.stringify(message);
      peer.dataChannel.send(data);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Broadcast a message to all connected peers
   */
  broadcastMessage(message: ProtocolMessage): void {
    const errors: string[] = [];

    this.peers.forEach((peer, peerId) => {
      try {
        if (peer.dataChannel?.readyState === 'open') {
          this.sendMessage(peerId, message);
        }
      } catch (error) {
        errors.push(peerId);
        console.error(`Failed to send message to ${peerId}:`, error);
      }
    });

    if (errors.length > 0) {
      console.warn(`Failed to broadcast to ${errors.length} peer(s):`, errors);
    }
  }

  /**
   * Add a media stream (for voice/video calls)
   */
  async addMediaStream(peerId: string, stream: MediaStream): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error(`Peer ${peerId} not found`);
    }

    // Add all tracks from the stream
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

    // Stop all local tracks
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

    // Close data channel
    if (peer.dataChannel) {
      peer.dataChannel.close();
    }

    // Stop media streams
    this.removeMediaStream(peerId);

    // Close peer connection
    peer.connection.close();

    // Remove from map
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
      console.log(`Data channel opened with ${peerId}`);
      this.updatePeerStatus(peerId, 'connected');
      this.onDataChannelOpen?.(peerId);
    };

    channel.onclose = () => {
      console.log(`Data channel closed with ${peerId}`);
      this.onDataChannelClose?.(peerId);
    };

    channel.onerror = (error) => {
      console.error(`Data channel error with ${peerId}:`, error);
    };

    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ProtocolMessage;
        this.onMessage?.(peerId, message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
  }

  /**
   * Setup peer connection event handlers
   */
  private setupPeerConnection(peerId: string, pc: RTCPeerConnection): void {
    // ICE candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidate?.(peerId, event.candidate);
      }
    };

    // Connection state change handler
    pc.onconnectionstatechange = () => {
      console.log(`Connection state: ${pc.connectionState} for peer ${peerId}`);
      this.updatePeerStatus(peerId, pc.connectionState);
      this.onConnectionStateChange?.(peerId, pc.connectionState);

      // Clean up if connection failed or closed
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeer(peerId);
      }
    };

    // ICE connection state change handler
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state: ${pc.iceConnectionState} for peer ${peerId}`);

      if (pc.iceConnectionState === 'failed') {
        // Try ICE restart
        console.log(`ICE failed for ${peerId}, attempting restart`);
        pc.restartIce();
      }
    };

    // Remote track handler (for media streams)
    pc.ontrack = (event) => {
      console.log(`Received remote track from ${peerId}`);
      if (event.streams && event.streams[0]) {
        this.onRemoteTrack?.(peerId, event.streams[0]);
      }
    };
  }

  /**
   * Update peer connection status
   */
  private updatePeerStatus(
    peerId: string,
    state: RTCPeerConnectionState | 'connected'
  ): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.status = state as PeerConnection['status'];
    }
  }

  /**
   * Update STUN servers configuration
   */
  updateStunServers(servers: string[]): void {
    this.configuration.iceServers = servers.map((url) => ({ urls: url }));
  }
}
