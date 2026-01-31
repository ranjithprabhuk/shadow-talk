import { MessageSquare } from 'lucide-react';

export const ChatArea = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <MessageSquare size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
        Welcome to ShadowTalk
      </h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-md">
        A fully decentralized, peer-to-peer chat application using WebRTC.
        Connect with other peers to start chatting!
      </p>
      <div className="mt-8 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
        <p className="text-sm text-primary-900 dark:text-primary-100">
          <strong>Coming soon:</strong> WebRTC connection, text messaging, voice/video calls, and file sharing!
        </p>
      </div>
    </div>
  );
};
