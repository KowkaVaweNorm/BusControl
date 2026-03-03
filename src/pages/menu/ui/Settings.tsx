import { useEffect, useState } from 'react';
import { gameSettingsStore } from '@/app/store/GameSettingsStore';
import type { GameSettings } from '@/shared/types/game-settings';
import cls from './Settings.module.scss';

interface SettingsProps {
  onBack: () => void;
}

/**
 * Заглушка страницы настроек
 * TODO: Заменить на полноценный дизайн
 */
export const Settings = ({ onBack }: SettingsProps) => {
  const [settings, setSettings] = useState<GameSettings>(gameSettingsStore.getSettings());

  useEffect(() => {
    setSettings(gameSettingsStore.getSettings());
  }, []);

  const handleSettingChange = (key: keyof GameSettings, value: number | string | boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    gameSettingsStore.updateSettings(newSettings);
  };

  const handleResetProgress = () => {
    if (confirm('Вы уверены? Весь прогресс будет сброшен!')) {
      gameSettingsStore.resetProgress();
      alert('Прогресс сброшен');
    }
  };

  return (
    <div className={cls.page}>
      <h1>⚙️ Настройки</h1>

      {/* Звук */}
      <div className={cls['settings-group']}>
        <div className={cls['group-title']}>🔊 Звук</div>
        
        <div className={cls['setting-row']}>
          <label>Музыка</label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.musicVolume * 100}
            onChange={(e) => handleSettingChange('musicVolume', Number(e.target.value) / 100)}
          />
        </div>

        <div className={cls['setting-row']}>
          <label>Эффекты</label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.sfxVolume * 100}
            onChange={(e) => handleSettingChange('sfxVolume', Number(e.target.value) / 100)}
          />
        </div>
      </div>

      {/* Язык */}
      <div className={cls['settings-group']}>
        <div className={cls['group-title']}>🌐 Язык</div>
        
        <div className={cls['setting-row']}>
          <label>Язык интерфейса</label>
          <select
            value={settings.language}
            onChange={(e) => handleSettingChange('language', e.target.value)}
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* Опасная зона */}
      <div className={`${cls['settings-group']} ${cls['danger-zone']}`}>
        <div className={cls['group-title']}>⚠️ Данные</div>
        
        <button className={cls['reset-button']} onClick={handleResetProgress}>
          🗑️ Сбросить прогресс
        </button>
      </div>

      <button className={cls['back-button']} onClick={onBack}>
        ← Назад в меню
      </button>
    </div>
  );
};
