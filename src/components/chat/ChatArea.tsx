import { useState } from 'react';
import { MessageSquare, Link2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { InviteModal } from '@/components/connection/InviteModal';

export const ChatArea = () => {
  const [showInviteModal, setShowInviteModal] = useState(false);

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
          <strong>✨ Phase 4 Complete:</strong> WebRTC connection ready! Click "Connect with Peer" to generate an invite code or join a room.
        </p>
      </div>

      {/* Invite Modal */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
};
