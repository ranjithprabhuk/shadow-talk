import { Users } from 'lucide-react';
import { usePeerStore } from '@/store/peerStore';
import { Avatar } from '@/components/ui';

export const Sidebar = () => {
  const peers = usePeerStore((state) => state.getAllPeers());

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-gray-600 dark:text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Online Users
          </h2>
          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
            {peers.length}
          </span>
        </div>
      </div>

      {/* User List */}
      <div className="p-2">
        {peers.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No users online yet
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Connect with peers to start chatting
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {peers.map((peer) => (
              <button
                key={peer.peerId}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <Avatar
                  src={peer.avatar}
                  name={peer.name}
                  size="md"
                  online
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {peer.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {peer.showGender && peer.gender !== 'Prefer not to say' && (
                      <span>{peer.gender}</span>
                    )}
                    {peer.showAge && peer.showGender && peer.gender !== 'Prefer not to say' && ', '}
                    {peer.showAge && <span>{peer.age}</span>}
                  </p>
                </div>
                {/* Connection quality indicator */}
                <div className="flex gap-0.5">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full ${
                        i < (peer.connectionQuality === 'excellent' ? 4 :
                             peer.connectionQuality === 'good' ? 3 :
                             peer.connectionQuality === 'fair' ? 2 : 1)
                          ? 'bg-green-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      style={{ height: `${(i + 1) * 3}px` }}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
