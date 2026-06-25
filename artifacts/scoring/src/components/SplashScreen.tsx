import React, { useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    // Auto-dismiss after 2.5 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-purple-700 flex flex-col items-center justify-center max-w-md mx-auto border-x border-purple-800">
      {/* Status Bar */}
      <div className="fixed top-0 left-0 right-0 max-w-md mx-auto">
        <div className="flex justify-between items-center px-6 py-2 text-white text-xs">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 border border-white rounded-sm flex items-center justify-center">
              <div className="w-2 h-1.5 bg-white rounded-sm"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center animate-fade-in">
        {/* Wordmark */}
        <div className="mb-4">
          <h1 className="text-6xl font-bold tracking-tight">
            <span className="text-white">V</span>
            <span className="text-purple-200">Scor</span>
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-white/90 text-lg font-medium tracking-wide">
          Every match matters
        </p>

        {/* Optional: Loading indicator */}
        <div className="mt-12">
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
