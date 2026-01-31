import { Toaster } from 'sonner';
import { useUserStore } from './store/userStore';
import { GuestLogin } from './components/auth/GuestLogin';
import { MainLayout } from './components/layout/MainLayout';
import { ChatArea } from './components/chat/ChatArea';

function App() {
  const currentUser = useUserStore((state) => state.currentUser);

  return (
    <>
      {/* Toast Notifications */}
      <Toaster position="top-right" richColors />

      {/* Main App */}
      {!currentUser ? (
        <GuestLogin />
      ) : (
        <MainLayout>
          <ChatArea />
        </MainLayout>
      )}
    </>
  );
}

export default App
