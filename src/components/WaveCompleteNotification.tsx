import { useEffect, useState, memo } from 'react';
import { Trophy, Star } from 'lucide-react';

interface WaveCompleteNotificationProps {
  wave: number;
  experienceGained: number;
}

const WaveCompleteNotificationComponent = ({ wave, experienceGained }: WaveCompleteNotificationProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
      <div className="bg-gradient-to-r from-yellow-900/95 to-orange-900/95 rounded-lg p-8 border-4 border-yellow-500 shadow-2xl animate-bounce">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-4xl font-bold text-yellow-400 mb-2">
            웨이브 {wave - 1} 클리어!
          </h2>
          <div className="flex items-center justify-center gap-2 text-2xl text-white mb-3">
            <Star className="w-6 h-6 text-blue-400" />
            <span>+{experienceGained} EXP</span>
          </div>
          <div className="text-sm text-yellow-200 mt-2">
            🗺️ 새로운 맵으로 이동합니다...
          </div>
        </div>
      </div>
    </div>
  );
};

// 메모이제이션으로 불필요한 리렌더링 방지
export const WaveCompleteNotification = memo(WaveCompleteNotificationComponent);
