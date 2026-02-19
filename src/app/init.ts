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
import { initEconomyListener, cleanupEconomyListener } from '../features/economy/model/EconomyListener';
import { stopRenderSystem } from '../entities/stop/model/StopRenderSystem';
import { routeRenderSystem } from '@/entities/Route/model/RouteRenderSystem';
import { busMovementSystem } from '@/entities/Bus/model/BusMovementSystem';
import { busLogicSystem } from '@/entities/Bus/model/BusLogicSystem';
import { busRenderSystem } from '@/entities/Bus/model/BusRenderSystem';
import { npcSpawnerSystem } from '@/entities/NPC/model/NPCSpawnerSystem';
import { npcInteractionSystem } from '@/entities/NPC/model/NPCInteractionSystem';
import { npcRenderSystem } from '@/entities/NPC/model/NPCRenderSystem';

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

    // 2. Инициализация экономики (слушатели событий)
    initEconomyListener();

    // 3. Инициализация Рендерера
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

    // 5. Регистрация систем (с проверкой на повторную регистрацию)
    entityManagerService.registerSystem(stopRenderSystem);
    entityManagerService.registerSystem(routeRenderSystem);

    // Регистрируем системы автобуса
    entityManagerService.registerSystem(busMovementSystem); // Движение
    entityManagerService.registerSystem(busLogicSystem);    // Логика состояний
    entityManagerService.registerSystem(busRenderSystem);   // Отрисовка

    // Регистрируем NPC системы
    entityManagerService.registerSystem(npcSpawnerSystem);        // Спавн пассажиров
    entityManagerService.registerSystem(npcInteractionSystem);    // Посадка/высадка
    entityManagerService.registerSystem(npcRenderSystem);         // Отрисовка

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
        cleanupEconomyListener();
        entityManagerService.cleanup(); // Очищаем ECS
        gameEventBusService.cleanup();  // Очищаем шину событий
        canvasRendererService.cleanup(); // Очищаем рендерер
      },
    };
  } catch (error) {
    console.error('[App] Failed to initialize game:', error);
    throw error;
  }
}
