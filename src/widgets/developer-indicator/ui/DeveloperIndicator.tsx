import { useState } from 'react';
import { gameModeService } from '@/features/game-mode';
import cls from './DeveloperIndicator.module.scss';

export const DeveloperIndicator = () => {
  const [isDeveloper, setIsDeveloper] = useState(gameModeService.isDeveloper());

  const handleToggle = () => {
    // Выключаем режим разработчика
    gameModeService.disableDeveloper();
    setIsDeveloper(false);
  };

  return (
    <div className={`${cls.indicator} ${isDeveloper ? cls.developer : cls.viewer}`}>
      <span className={cls.icon}>{isDeveloper ? '🔧' : '👁️'}</span>
      <span className={cls.mode}>{isDeveloper ? 'DEV' : 'VIEW'}</span>

      {/* Кнопка переключения (только для DEV) */}
      {isDeveloper && (
        <button className={cls.toggleBtn} onClick={handleToggle} title="Выключить режим разработчика">
          ✕
        </button>
      )}
    </div>
  );
};
