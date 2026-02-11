import { useState } from 'react';
import { Copy, Check, Link2 } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { SignalingService } from '@/services/signaling/SignalingService';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteModal = ({ isOpen, onClose }: InviteModalProps) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [inviteCode, setInviteCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [pendingPeerId, setPendingPeerId] = useState<string | null>(null); // Store peer ID for answer

  const currentUser = useUserStore((state) => state.currentUser);
  const { createOffer, acceptOffer, acceptAnswer, registerPeer } = useWebRTC();

  /**
   * Generate invite code
   */
  const handleGenerateInvite = async () => {
    if (!currentUser) {
      toast.error('User not found');
      return;
    }

    setIsGenerating(true);

    try {
      // Generate unique peer ID for this connection
      const peerId = `peer-${Date.now()}-${crypto.randomUUID()}`;

      // Create WebRTC offer (includes ICE candidates)
      const { offer, candidates } = await createOffer(peerId);

      // Encode offer with user info and ICE candidates
      const encoded = SignalingService.encodeOffer(peerId, offer, candidates, {
        peerId: currentUser.peerId,
        name: currentUser.name,
        gender: currentUser.gender,
        age: currentUser.age,
        avatar: currentUser.avatar,
        showAge: currentUser.showAge,
        showGender: currentUser.showGender,
        connectionQuality: 'excellent',
      });

      setInviteCode(encoded);
      setPendingPeerId(peerId); // Store for later when accepting answer
      toast.success('Invite code generated!');
    } catch (error) {
      console.error('Failed to generate invite:', error);
      toast.error('Failed to generate invite code');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Copy invite code to clipboard
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  /**
   * Join using invite code
   */
  const handleJoin = async () => {
    if (!currentUser || !joinCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    setIsJoining(true);

    try {
      // Clean and decode the invite code
      const cleaned = SignalingService.cleanFormatted(joinCode.trim());
      const decoded = SignalingService.decode(cleaned);

      if (decoded.type !== 'offer') {
        toast.error('Invalid invite code (expected offer)');
        return;
      }

      const { peerId, offer, candidates: remoteCandidates, userInfo } = decoded.data;

      // Accept the offer and create answer (pass remote ICE candidates)
      const { answer, candidates: localCandidates } = await acceptOffer(peerId, offer, remoteCandidates || []);

      // Register the peer
      registerPeer(userInfo);

      // Encode answer with our user info and ICE candidates
      const answerEncoded = SignalingService.encodeAnswer(
        currentUser.peerId,
        answer,
        localCandidates,
        {
          peerId: currentUser.peerId,
          name: currentUser.name,
          gender: currentUser.gender,
          age: currentUser.age,
          avatar: currentUser.avatar,
          showAge: currentUser.showAge,
          showGender: currentUser.showGender,
          connectionQuality: 'excellent',
        }
      );

      // Copy answer to clipboard for user to send back
      await navigator.clipboard.writeText(answerEncoded);

      toast.success('Answer copied! Send it back to complete connection.', {
        duration: 5000,
      });

      // Clear join code
      setJoinCode('');
      onClose();
    } catch (error) {
      console.error('Failed to join:', error);
      toast.error('Failed to join. Please check the invite code.');
    } finally {
      setIsJoining(false);
    }
  };

  /**
   * Accept answer (when user receives answer back)
   */
  const handleAcceptAnswer = async () => {
    if (!joinCode.trim()) {
      toast.error('Please enter the answer code');
      return;
    }

    if (!pendingPeerId) {
      toast.error('No pending connection. Please generate an invite first.');
      return;
    }

    setIsJoining(true);

    try {
      // Clean and decode the answer
      const cleaned = SignalingService.cleanFormatted(joinCode.trim());
      const decoded = SignalingService.decode(cleaned);

      if (decoded.type !== 'answer') {
        toast.error('Invalid code (expected answer)');
        return;
      }

      const { answer, candidates: remoteCandidates, userInfo } = decoded.data;

      // Accept the answer using the pending peer ID (from our original offer)
      await acceptAnswer(pendingPeerId, answer, remoteCandidates || []);

      // Register the peer
      registerPeer(userInfo);

      toast.success(`Connected to ${userInfo.name}!`);

      // Clear codes and close
      setJoinCode('');
      setInviteCode('');
      setPendingPeerId(null);
      onClose();
    } catch (error) {
      console.error('Failed to accept answer:', error);
      toast.error('Failed to complete connection');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'create'
                ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Create Invite
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'join'
                ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Join Room
          </button>
        </div>

        {/* Create Invite Tab */}
        {activeTab === 'create' && (
          <div className="space-y-4">
            {!inviteCode ? (
              <div className="text-center py-8">
                <Link2 size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Generate Invite Code</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create an invite code to share with others
                </p>
                <Button
                  onClick={handleGenerateInvite}
                  disabled={isGenerating}
                  variant="primary"
                >
                  {isGenerating ? 'Generating...' : 'Generate Invite'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Code Display */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Invite Code (copy and share)
                  </label>
                  <div className="relative">
                    <textarea
                      value={SignalingService.formatForDisplay(inviteCode)}
                      readOnly
                      className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-xs resize-none"
                      rows={4}
                    />
                    <button
                      onClick={handleCopy}
                      className="absolute top-2 right-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <Check size={20} className="text-green-500" />
                      ) : (
                        <Copy size={20} className="text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Next Steps:
                  </h4>
                  <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                    <li>Share this code with the other person</li>
                    <li>They will send you an answer code</li>
                    <li>Paste their answer in the "Join Room" tab</li>
                  </ol>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setInviteCode('');
                      setActiveTab('join');
                    }}
                    variant="primary"
                    fullWidth
                  >
                    I received an answer
                  </Button>
                  <Button
                    onClick={() => setInviteCode('')}
                    variant="secondary"
                    fullWidth
                  >
                    Generate New
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Join Room Tab */}
        {activeTab === 'join' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Paste Invite Code or Answer
              </label>
              <textarea
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Paste the code here..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={6}
              />
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Instructions:
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Paste an <strong>invite code</strong> to accept and generate answer</li>
                <li>Or paste an <strong>answer code</strong> to complete connection</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleJoin}
                disabled={isJoining || !joinCode.trim()}
                variant="primary"
                fullWidth
              >
                {isJoining ? 'Processing...' : 'Accept Invite'}
              </Button>
              <Button
                onClick={handleAcceptAnswer}
                disabled={isJoining || !joinCode.trim()}
                variant="secondary"
                fullWidth
              >
                Complete Connection
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
