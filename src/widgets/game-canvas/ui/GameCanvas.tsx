import { useEffect, useRef } from 'react';
import { initGame } from '../../../app/init';
import cls from './GameCanvas.module.scss';

export const GameCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const containerId = containerRef.current.id;

    // Инициализация игры
    const result = initGame(containerId);
    cleanupRef.current = result.cleanup;

    // Обработка ресайза окна
    const handleResize = () => {
      // Можно добавить вызов resize в canvasRendererService
      // canvasRendererService.resize(window.innerWidth, window.innerHeight);
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
