import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import { Message as MessageType } from '@/types';
import { useUserStore } from '@/store/userStore';
import { usePeerStore } from '@/store/peerStore';
import { Avatar } from '@/components/ui';
import clsx from 'clsx';

interface MessageProps {
  message: MessageType;
}

export const Message = ({ message }: MessageProps) => {
  const currentUser = useUserStore((state) => state.currentUser);
  const getPeer = usePeerStore((state) => state.getPeer);

  const isSent = message.from === currentUser?.peerId;
  const isGroupMessage = message.to === 'all';

  // Get sender info
  const sender = isSent ? currentUser : getPeer(message.from);

  const getStatusIcon = () => {
    if (!isSent) return null;

    switch (message.status) {
      case 'sent':
        return <Check size={14} className="text-gray-400" />;
      case 'delivered':
      case 'read':
        return <CheckCheck size={14} className="text-blue-500" />;
      case 'failed':
        return <span className="text-xs text-red-500">Failed</span>;
      default:
        return null;
    }
  };

  return (
    <div className={clsx('flex gap-2 mb-4', isSent ? 'justify-end' : 'justify-start')}>
      {/* Avatar for received messages */}
      {!isSent && sender && (
        <Avatar
          src={sender.avatar}
          name={sender.name}
          size="sm"
        />
      )}

      {/* Message bubble */}
      <div className={clsx('flex flex-col', isSent ? 'items-end' : 'items-start')}>
        {/* Sender name (for group messages) */}
        {!isSent && isGroupMessage && sender && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
            {sender.name}
          </span>
        )}

        {/* Message content */}
        <div
          className={clsx(
            'message-bubble',
            isSent ? 'message-sent' : 'message-received'
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {/* Timestamp and status */}
        <div className="flex items-center gap-1 mt-1 px-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {format(message.timestamp, 'HH:mm')}
          </span>
          {getStatusIcon()}
        </div>
      </div>

      {/* Spacer for sent messages to align with avatar on the other side */}
      {isSent && <div className="w-8" />}
    </div>
  );
};
