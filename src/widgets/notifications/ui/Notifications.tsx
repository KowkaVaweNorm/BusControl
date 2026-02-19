import { useEffect, useState } from 'react';
import { gameEventBusService, GameEventType } from '@/shared/lib/game-core/GameEventBusService';
import cls from './Notifications.module.scss';

interface Notification {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning';
}

export const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Подписка на события уведомлений
    const unsubscribe = gameEventBusService.subscribe(
      GameEventType.UI_NOTIFICATION,
      (event) => {
        const { message, type } = event.payload;
        
        const id = Date.now();
        setNotifications((prev) => [...prev, { id, message, type }]);

        // Удаляем уведомление через 3 секунды
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 3000);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className={cls.container}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${cls.notification} ${cls[notification.type]}`}
        >
          {notification.type === 'success' && '✅ '}
          {notification.type === 'warning' && '⚠️ '}
          {notification.type === 'info' && 'ℹ️ '}
          {notification.message}
        </div>
      ))}
    </div>
  );
};
