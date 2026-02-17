/**
 * Инициализация игрового ядра
 *
 * Этот модуль собирает и запускает все низкоуровневые сервисы.
 * Вызывается один раз при старте приложения.
 *
 * @module app/init
 */

import { gameLoopService } from '../shared/lib/game-core/GameLoopService';
import {
  canvasRendererService,
  configureCanvasRenderer,
} from '../shared/lib/game-core/CanvasRendererService';
import { inputService } from '../shared/lib/game-core/InputService';
import { entityManagerService } from '../shared/lib/game-core/EntityManagerService';
import { gameEventBusService } from '../shared/lib/game-core/GameEventBusService';
import { cameraController } from '../shared/lib/game-core/CameraController';
import { mapEditorService } from '../features/map-editor/model/MapEditorService';
import { stopRenderSystem } from '../entities/stop/model/StopRenderSystem';
import { routeRenderSystem } from '@/entities/Route/model/RouteRenderSystem';

// Конфигурация игры (можно вынести в отдельный конфиг позже)
const GAME_CONFIG = {
  layers: ['background', 'roads', 'entities', 'ui'],
  backgroundColor: '#1a1a2e',
};

export interface InitResult {
  cleanup: () => void;
}

/**
 * Основная функция инициализации
 * @param containerId ID HTML элемента, куда будет встроен Canvas
 */
export function initGame(containerId: string): InitResult {
  console.log('[App] Initializing Game Core...');

  try {
    // 1. Инициализация шины событий
    gameEventBusService.initialize();

    // 2. Инициализация Рендерера
    configureCanvasRenderer({
      width: window.innerWidth,
      height: window.innerHeight,
      layers: GAME_CONFIG.layers,
      backgroundColor: GAME_CONFIG.backgroundColor,
    });
    canvasRendererService.initialize(containerId);

    // 3. Инициализация Ввода
    inputService.initialize(containerId);

    // 4. Инициализация ECS Менеджера
    entityManagerService.initialize();

    // 5. Регистрация систем
    entityManagerService.registerSystem(stopRenderSystem);
    entityManagerService.registerSystem(routeRenderSystem);

    // 6. Запуск контроллера камеры
    cameraController.initialize();

    // 7. Запуск редактора карт
    mapEditorService.initialize();

    // 8. Очистка старых подписчиков GameLoop
    gameLoopService.clearSubscribers();

    // 9. Запуск игрового цикла
    gameLoopService.subscribeToLogic((deltaTime) => {
      entityManagerService.updateSystems(deltaTime);
    });

    gameLoopService.subscribeToRender(() => {
      canvasRendererService.clearAll();
      entityManagerService.updateSystems(0);
    });

    gameLoopService.start();

    console.log('[App] Game Core Initialized Successfully');

    // Функция очистки (для useEffect return)
    return {
      cleanup: () => {
        console.log('[App] Cleaning up Game Core...');
        gameLoopService.stop();
        cameraController.cleanup();
        mapEditorService.cleanup();
        inputService.cleanup();
        // entityManagerService.cleanup() НЕ вызываем — сохраняем сущности и системы
        // gameEventBusService.cleanup() НЕ вызываем — сохраняем подписчиков
        // Рендерер не чистим полностью, чтобы не удалять DOM, просто останавливаем
      },
    };
  } catch (error) {
    console.error('[App] Failed to initialize game:', error);
    throw error;
  }
}
