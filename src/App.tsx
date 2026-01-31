import { useUserStore } from './store/userStore';
import { GuestLogin } from './components/auth/GuestLogin';
import { MainLayout } from './components/layout/MainLayout';
import { ChatArea } from './components/chat/ChatArea';

function App() {
  const currentUser = useUserStore((state) => state.currentUser);

  // Show login screen if no user is logged in
  if (!currentUser) {
    return <GuestLogin />;
  }

  // Show main app if user is logged in
  return (
    <MainLayout>
      <ChatArea />
    </MainLayout>
  );
}

export default App
