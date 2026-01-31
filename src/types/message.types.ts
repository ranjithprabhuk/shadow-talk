export interface Message {
  id: string;
  type: 'text' | 'file' | 'voice' | 'system';
  from: string; // peerId
  to: 'all' | string; // 'all' or specific peerId
  content: string;
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  fileData?: FileData;
}

export interface FileData {
  name: string;
  size: number;
  type: string;
  url?: string;
  progress?: number;
  chunkSize?: number;
  totalChunks?: number;
  receivedChunks?: number;
}

export interface FileMetadata {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  chunkSize: number;
  totalChunks: number;
}

export interface FileChunk {
  fileId: string;
  chunkNumber: number;
  data: string; // base64 encoded
  checksum: string;
}

export type MessageStatus = Message['status'];
export type MessageType = Message['type'];
