import { useEffect, useState } from 'react';
import { mapSaveService } from '@/features/map-save';
import type { PresetMap } from '@/features/map-save/model/types';
import cls from './MapSelect.module.scss';

interface MapSelectProps {
  onSelect: () => void;
  onBack: () => void;
}

/**
 * Заглушка выбора карты
 * TODO: Заменить на полноценный дизайн
 */
export const MapSelect = ({ onSelect, onBack }: MapSelectProps) => {
  const [presets, setPresets] = useState<PresetMap[]>([]);

  useEffect(() => {
    // Загрузка списка пресетов
    setPresets(mapSaveService.getPresetList());
  }, []);

  const handleSelectMap = (mapId: string) => {
    // Загружаем пресет и запускаем игру
    const success = mapSaveService.loadPreset(mapId);
    if (success) {
      onSelect();
    }
  };

  const getDifficultyClass = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return cls.easy;
      case 'medium': return cls.medium;
      case 'hard': return cls.hard;
      default: return cls.easy;
    }
  };

  const getDifficultyText = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return 'Лёгкий';
      case 'medium': return 'Средний';
      case 'hard': return 'Сложный';
      default: return difficulty;
    }
  };

  return (
    <div className={cls.page}>
      <h1>🗺️ Выбор карты</h1>
      
      <div className={cls['maps-list']}>
        {presets.map((preset) => (
          <div
            key={preset.id}
            className={cls['map-card']}
            onClick={() => handleSelectMap(preset.id)}
          >
            <div className={cls.name}>{preset.name}</div>
            <div className={cls.description}>{preset.description}</div>
            <span className={`${cls.difficulty} ${getDifficultyClass(preset.difficulty)}`}>
              {getDifficultyText(preset.difficulty)}
            </span>
          </div>
        ))}
      </div>

      <button className={cls['back-button']} onClick={onBack}>
        ← Назад в меню
      </button>
    </div>
  );
};
