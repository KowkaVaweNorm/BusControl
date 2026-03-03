import { useEffect, useRef } from 'react';
import { initGame } from '../../../app/init';
import { canvasRendererService } from '@/shared/lib/game-core/CanvasRendererService';
import cls from './GameCanvas.module.scss';

// Глобальная переменная для хранения ID выбранной карты
let SELECTED_MAP_ID: string | null = null;

/**
 * Установить ID карты для загрузки при инициализации игры
 */
export function setSelectedMapId(mapId: string): void {
  SELECTED_MAP_ID = mapId;
}

export const GameCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const containerId = containerRef.current.id;

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
