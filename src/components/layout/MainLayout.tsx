import { ReactNode, useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <Header onSettingsClick={() => setShowSettings(true)} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>

      {/* Settings Modal - TODO: Implement in later phase */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Settings panel coming soon...
            </p>
            <button
              onClick={() => setShowSettings(false)}
              className="btn-primary w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
