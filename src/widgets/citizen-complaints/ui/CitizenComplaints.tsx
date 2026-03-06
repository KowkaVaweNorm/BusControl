import { useEffect, useState } from 'react';
import { gameStateStore } from '@/app/store/GameStateStore';
import { gameEventBusService, GameEventType } from '@/shared/lib/game-core/GameEventBusService';
import cls from './CitizenComplaints.module.scss';

interface RecentComplaint {
  id: number;
  stopName: string;
  timestamp: number;
}

// Хранилище последних жалоб (вне компонента для доступа извне)
let recentComplaintsStore: RecentComplaint[] = [];
const recentComplaintsListeners: Set<() => void> = new Set();

/**
 * Очистить последние жалобы (для рестарта уровня)
 */
export function clearRecentComplaints(): void {
  recentComplaintsStore = [];
  recentComplaintsListeners.forEach((listener) => listener());
  console.log('[CitizenComplaints] Recent complaints cleared');
}

export const CitizenComplaints = () => {
  const [totalComplaints, setTotalComplaints] = useState(0);
  const [recentComplaints, setRecentComplaints] = useState<RecentComplaint[]>([]);

  useEffect(() => {
    // Берём актуальное состояние при монтировании
    const state = gameStateStore.getState();
    setTotalComplaints(state.totalComplaints);

    // Подписка на изменения стора
    const unsubscribeStore = gameStateStore.subscribe((newState) => {
      setTotalComplaints(newState.totalComplaints);
    });

    // Подписка на события о жалобах
    const unsubscribeEvents = gameEventBusService.subscribe(
      GameEventType.COMPLAINT_ADDED,
      (event) => {
        const { stopName } = event.payload;
        const newComplaint: RecentComplaint = {
          id: Date.now(),
          stopName,
          timestamp: Date.now(),
        };

        recentComplaintsStore = [newComplaint, ...recentComplaintsStore].slice(0, 5);
        setRecentComplaints([...recentComplaintsStore]);
      }
    );

    // Подписка на очистку жалоб (для рестарта)
    const clearListener = () => {
      setRecentComplaints([]);
    };
    recentComplaintsListeners.add(clearListener);

    return () => {
      unsubscribeStore();
      unsubscribeEvents();
      recentComplaintsListeners.delete(clearListener);
    };
  }, []);

  return (
    <div className={cls.panel}>
      <div className={cls.title}>
        <span>⚠️</span>
        <span>Жалобы горожан</span>
      </div>
      <div className={cls.total}>
        Всего: <span className={cls.count}>{totalComplaints}</span>
      </div>
      {recentComplaints.length > 0 ? (
        <div className={cls.recent}>
          <div className={cls.subtitle}>Последние:</div>
          {recentComplaints.map((complaint) => (
            <div key={complaint.id} className={cls.complaint}>
              📍 {complaint.stopName}
            </div>
          ))}
        </div>
      ) : (
        <div className={cls.empty}>Жалоб нет ✅</div>
      )}
    </div>
  );
};
