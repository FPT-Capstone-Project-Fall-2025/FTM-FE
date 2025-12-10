import React from 'react';
import { HelpCircle } from 'lucide-react';

interface TutorialFloatingButtonProps {
    onOpenTutorial: () => void;
}

const TutorialFloatingButton: React.FC<TutorialFloatingButtonProps> = ({ onOpenTutorial }) => {
    return (
        <>
            <button
                onClick={onOpenTutorial}
                className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group animate-pulse-subtle"
                title="Hướng dẫn sử dụng"
                aria-label="Mở hướng dẫn sử dụng"
            >
                <HelpCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />

                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Hướng dẫn sử dụng
                    <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                </div>
            </button>

            <style>{`
        @keyframes pulse-subtle {
          0%, 100% {
            box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3), 0 4px 6px -2px rgba(37, 99, 235, 0.2);
          }
          50% {
            box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.4), 0 10px 10px -5px rgba(37, 99, 235, 0.3);
          }
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 3s ease-in-out infinite;
        }
      `}</style>
        </>
    );
};

export default TutorialFloatingButton;
