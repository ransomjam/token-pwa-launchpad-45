import { WifiOff, RotateCcw } from 'lucide-react';

const Offline = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <main className="min-h-dvh bg-bg text-fg antialiased flex items-center justify-center">
      <div className="max-w-md mx-auto p-4 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-muted" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-xl font-bold">You are offline</h1>
          <p className="text-muted">
            Recent orders and receipts will still be available when cached.
          </p>
        </div>
        
        <button 
          onClick={handleRetry}
          className="btn-outline w-full"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Try Again
        </button>
      </div>
    </main>
  );
};

export default Offline;