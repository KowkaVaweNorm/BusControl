import { useEffect, useRef } from 'react';
import { initGame } from '../../../app/init';
import { canvasRendererService } from '@/shared/lib/game-core/CanvasRendererService';
import { gameStateStore } from '@/app/store/GameStateStore';
import { gameSettingsStore } from '@/app/store/GameSettingsStore';
import { mapSaveService } from '@/features/map-save';
import cls from './GameCanvas.module.scss';

// Глобальная переменная для хранения ID выбранной карты
let SELECTED_MAP_ID: string | null = null;

/**
 * Установить ID карты для загрузки при инициализации игры
 */
export function setSelectedMapId(mapId: string): void {
  SELECTED_MAP_ID = mapId;
}

/**
 * Перезапустить текущий уровень
 */
export function restartLevel(): void {
  if (!SELECTED_MAP_ID) {
    console.error('[GameCanvas] Cannot restart: no map selected');
    return;
  }

  console.log('[GameCanvas] Restarting level:', SELECTED_MAP_ID);

  // Загрузка карты заново (очищает все сущности и спавнит заново)
  const loaded = mapSaveService.loadPreset(SELECTED_MAP_ID);
  if (loaded) {
    console.log('[GameCanvas] Level restarted successfully');
  } else {
    console.error('[GameCanvas] Failed to restart level');
  }
}

export const GameCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const containerId = containerRef.current.id;

    // Установка активного уровня
    if (SELECTED_MAP_ID) {
      gameSettingsStore.setActiveLevel(SELECTED_MAP_ID);
    }

    // Начало новой сессии (генерация sessionId для статистики)
    gameStateStore.startNewSession();

    // Инициализация игры с загрузкой выбранной карты
    const result = initGame(containerId, SELECTED_MAP_ID);
    cleanupRef.current = result.cleanup;

    // Обработка ресайза окна
    const handleResize = () => {
      canvasRendererService.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="game-canvas-container"
      className={cls.container}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      {/* Canvas элементы будут добавлены сюда через JS (appendChild) */}
    </div>
  );
};
