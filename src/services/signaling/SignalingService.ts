import { ConnectionOffer, ConnectionAnswer, PeerInfo } from '@/types';

export interface EncodedOffer {
  type: 'offer';
  data: ConnectionOffer;
}

export interface EncodedAnswer {
  type: 'answer';
  data: ConnectionAnswer;
}

export type EncodedSignal = EncodedOffer | EncodedAnswer;

export class SignalingService {
  /**
   * Encode an offer for sharing (QR code or copy-paste)
   */
  static encodeOffer(
    peerId: string,
    offer: RTCSessionDescriptionInit,
    userInfo: PeerInfo
  ): string {
    const payload: EncodedOffer = {
      type: 'offer',
      data: {
        peerId,
        offer,
        userInfo,
        timestamp: Date.now(),
      },
    };

    // Convert to JSON and encode as base64
    const json = JSON.stringify(payload);
    return btoa(json);
  }

  /**
   * Encode an answer for sharing
   */
  static encodeAnswer(
    peerId: string,
    answer: RTCSessionDescriptionInit,
    userInfo: PeerInfo
  ): string {
    const payload: EncodedAnswer = {
      type: 'answer',
      data: {
        peerId,
        answer,
        userInfo,
        timestamp: Date.now(),
      },
    };

    const json = JSON.stringify(payload);
    return btoa(json);
  }

  /**
   * Decode connection data (offer or answer)
   */
  static decode(encoded: string): EncodedSignal {
    try {
      // Decode from base64
      const json = atob(encoded);
      const parsed = JSON.parse(json) as EncodedSignal;

      // Validate structure
      if (!parsed.type || !parsed.data) {
        throw new Error('Invalid signal format');
      }

      if (parsed.type === 'offer') {
        const offer = parsed as EncodedOffer;
        if (!offer.data.peerId || !offer.data.offer || !offer.data.userInfo) {
          throw new Error('Invalid offer format');
        }
      } else if (parsed.type === 'answer') {
        const answer = parsed as EncodedAnswer;
        if (!answer.data.peerId || !answer.data.answer || !answer.data.userInfo) {
          throw new Error('Invalid answer format');
        }
      } else {
        throw new Error('Unknown signal type');
      }

      return parsed;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to decode signal: ${error.message}`);
      }
      throw new Error('Failed to decode signal');
    }
  }

  /**
   * Validate if a string is a valid encoded signal
   */
  static isValidSignal(encoded: string): boolean {
    try {
      this.decode(encoded);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a shareable URL with encoded signal
   */
  static createShareableUrl(encoded: string): string {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?connect=${encodeURIComponent(encoded)}`;
  }

  /**
   * Extract encoded signal from URL
   */
  static extractFromUrl(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get('connect');
  }

  /**
   * Generate ICE candidates collection
   * This collects ICE candidates for a specified duration
   */
  static async collectIceCandidates(
    peerConnection: RTCPeerConnection,
    timeout: number = 3000
  ): Promise<RTCIceCandidate[]> {
    return new Promise((resolve) => {
      const candidates: RTCIceCandidate[] = [];

      const handleCandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
          candidates.push(event.candidate);
        }
      };

      peerConnection.addEventListener('icecandidate', handleCandidate);

      // Wait for ICE gathering to complete or timeout
      const timeoutId = setTimeout(() => {
        peerConnection.removeEventListener('icecandidate', handleCandidate);
        resolve(candidates);
      }, timeout);

      // If ICE gathering completes before timeout
      peerConnection.addEventListener('icegatheringstatechange', () => {
        if (peerConnection.iceGatheringState === 'complete') {
          clearTimeout(timeoutId);
          peerConnection.removeEventListener('icecandidate', handleCandidate);
          resolve(candidates);
        }
      });
    });
  }

  /**
   * Format encoded data for display (add newlines for better readability)
   */
  static formatForDisplay(encoded: string): string {
    // Split into chunks of 64 characters for readability
    const chunks: string[] = [];
    for (let i = 0; i < encoded.length; i += 64) {
      chunks.push(encoded.slice(i, i + 64));
    }
    return chunks.join('\n');
  }

  /**
   * Clean formatted data back to single line
   */
  static cleanFormatted(formatted: string): string {
    return formatted.replace(/\s+/g, '');
  }
}
