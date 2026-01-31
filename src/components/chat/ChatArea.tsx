import { useState, useEffect } from 'react';
import { MessageSquare, Link2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { InviteModal } from '@/components/connection/InviteModal';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useWebRTC } from '@/hooks/useWebRTC';
import { usePeerStore } from '@/store/peerStore';
import { useChatStore } from '@/store/chatStore';
import { useUserStore } from '@/store/userStore';
import { ProtocolMessage } from '@/types';
import { toast } from 'sonner';

export const ChatArea = () => {
  const [showInviteModal, setShowInviteModal] = useState(false);

  const currentUser = useUserStore((state) => state.currentUser);
  const peers = usePeerStore((state) => state.getAllPeers());
  const groupMessages = useChatStore((state) => state.groupMessages);
  const addGroupMessage = useChatStore((state) => state.addGroupMessage);
  const updateGroupMessageStatus = useChatStore((state) => state.updateGroupMessageStatus);

  const { broadcastMessage, setMessageHandler } = useWebRTC();

  const isConnected = peers.length > 0;

  // Set up message handler
  useEffect(() => {
    setMessageHandler((_peerId, message: ProtocolMessage) => {
      if (message.type === 'MESSAGE') {
        // Add received message to store
        addGroupMessage(message.payload);
      } else if (message.type === 'DELIVERY_RECEIPT') {
        // Update message status
        updateGroupMessageStatus(message.payload.messageId, 'delivered');
      }
    });
  }, [setMessageHandler, addGroupMessage, updateGroupMessageStatus]);

  const handleSendMessage = (content: string) => {
    if (!currentUser) return;

    const message: ProtocolMessage = {
      type: 'MESSAGE',
      payload: {
        id: crypto.randomUUID(),
        type: 'text',
        from: currentUser.peerId,
        to: 'all',
        content,
        timestamp: Date.now(),
        status: 'sending',
      },
      timestamp: Date.now(),
      messageId: crypto.randomUUID(),
    };

    // Add to local store
    addGroupMessage(message.payload);

    // Send to all peers
    try {
      broadcastMessage(message);

      // Update status to sent
      updateGroupMessageStatus(message.payload.id, 'sent');

      // Send delivery receipt
      setTimeout(() => {
        updateGroupMessageStatus(message.payload.id, 'delivered');
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      updateGroupMessageStatus(message.payload.id, 'failed');
      toast.error('Failed to send message');
    }
  };

  // Show welcome screen if not connected
  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <MessageSquare size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Welcome to ShadowTalk
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
          A fully decentralized, peer-to-peer chat application using WebRTC.
          Connect with other peers to start chatting!
        </p>

        {/* Connect Button */}
        <Button
          onClick={() => setShowInviteModal(true)}
          variant="primary"
          size="lg"
        >
          <Link2 size={20} />
          Connect with Peer
        </Button>

        <div className="mt-8 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800 max-w-md">
          <p className="text-sm text-primary-900 dark:text-primary-100">
            <strong>✨ WebRTC Ready:</strong> Click "Connect with Peer" to generate an invite code or join a room.
          </p>
        </div>

        {/* Invite Modal */}
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
        />
      </div>
    );
  }

  // Show chat interface if connected
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Chat header with connect button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-primary-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Group Chat
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({peers.length} {peers.length === 1 ? 'peer' : 'peers'} online)
          </span>
        </div>
        <Button
          onClick={() => setShowInviteModal(true)}
          variant="ghost"
          size="sm"
        >
          <Link2 size={16} />
          Add Peer
        </Button>
      </div>

      {/* Messages */}
      <MessageList messages={groupMessages} />

      {/* Message Input */}
      <MessageInput onSendMessage={handleSendMessage} />

      {/* Invite Modal */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
};
