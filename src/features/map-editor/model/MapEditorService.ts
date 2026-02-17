/**
 * MapEditorService
 *
 * Обрабатывает логику размещения объектов и построения маршрутов.
 * Режимы:
 * 1. PlaceStop: ЛКМ создает остановку.
 * 2. DrawRoute: Клик по остановке добавляет её в текущий строящийся маршрут.
 *
 * @module features/map-editor/model
 */

import {
  inputService,
  InputEventType,
  MouseButton,
} from '../../../shared/lib/game-core/InputService';
import {
  entityManagerService,
  type EntityId,
} from '../../../shared/lib/game-core/EntityManagerService';
import {
  STOP_COMPONENTS,
  type StopPositionComponent,
  type StopDataComponent,
} from '../../../entities/stop/model/StopComponents';
import {
  gameEventBusService,
  GameEventType,
} from '../../../shared/lib/game-core/GameEventBusService';
import { ROUTE_COMPONENTS } from '@/entities/Route/model/RouteComponents';

export enum EditorMode {
  IDLE = 'idle',
  PLACING_STOP = 'placing_stop',
  DRAWING_ROUTE = 'drawing_route',
}

export interface MapEditorConfig {
  defaultStopRadius: number;
  defaultRouteColor: string;
}

interface DraftRoute {
  stopIds: string[];
  tempEntityId?: EntityId; // Можно использовать для предпросмотра, но пока просто храним данные
}

export class MapEditorService {
  private isInitialized = false;
  private unsubscribeClick?: () => void;
  private unsubscribeDoubleClick?: () => void;
  private unsubscribeKeyDown?: () => void;

  private boundHandleMouseClick?: (event: any) => void;
  private boundHandleMouseDoubleClick?: (event: any) => void;
  private boundHandleKeyDown?: (event: any) => void;

  private mode: EditorMode = EditorMode.PLACING_STOP; // По умолчанию ставим остановки
  private draftRoute: DraftRoute | null = null;

  private config: MapEditorConfig;

  constructor(config?: Partial<MapEditorConfig>) {
    this.config = {
      defaultStopRadius: config?.defaultStopRadius ?? 40,
      defaultRouteColor: config?.defaultRouteColor ?? '#00aaff',
    };

    // Заранее создаём привязанные обработчики
    this.boundHandleMouseClick = this.handleMouseClick.bind(this);
    this.boundHandleMouseDoubleClick = this.handleMouseDoubleClick.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
  }

  public initialize(): void {
    if (this.isInitialized) return;

    this.unsubscribeClick = inputService.subscribe(
      InputEventType.MOUSE_CLICK,
      this.boundHandleMouseClick!
    );

    this.unsubscribeDoubleClick = inputService.subscribe(
      InputEventType.MOUSE_DOUBLE_CLICK,
      this.boundHandleMouseDoubleClick!
    );

    // Слушаем клавишу Enter или Escape для завершения/отмены маршрута
    this.unsubscribeKeyDown = inputService.subscribe(
      InputEventType.KEY_DOWN,
      this.boundHandleKeyDown!
    );

    this.isInitialized = true;
    console.log('[MapEditorService] Initialized');
  }

  public setMode(mode: EditorMode): void {
    console.log(`[MapEditorService] Switching mode to: ${mode}`);

    // Если сменили режим и был черновик маршрута - сбрасываем его
    if (mode !== EditorMode.DRAWING_ROUTE && this.draftRoute) {
      this.cancelDraftRoute();
    }

    this.mode = mode;
  }

  public getMode(): EditorMode {
    return this.mode;
  }

  private handleMouseClick(event: any): void {
    if (this.mode === EditorMode.PLACING_STOP) {
      if (event.payload.button !== MouseButton.LEFT) return;
      const { worldX, worldY } = event.payload;
      this.createStop(worldX, worldY);
    } else if (this.mode === EditorMode.DRAWING_ROUTE) {
      if (event.payload.button !== MouseButton.LEFT) return;
      const { worldX, worldY } = event.payload;
      this.addStopToDraftRoute(worldX, worldY);
    }
  }

  private handleMouseDoubleClick(event: any): void {
    if (this.mode === EditorMode.DRAWING_ROUTE) {
      this.finishDraftRoute();
    }
  }

  private handleKeyDown(event: any): void {
    if (this.mode === EditorMode.DRAWING_ROUTE) {
      // Escape - отмена
      if (event.payload.key === 'Escape') {
        this.cancelDraftRoute();
      }
      // Enter - завершение
      if (event.payload.key === 'Enter') {
        this.finishDraftRoute();
      }
    }

    // Быстрое переключение режимов цифрами (для удобства)
    if (event.payload.key === '1') this.setMode(EditorMode.PLACING_STOP);
    if (event.payload.key === '2') this.setMode(EditorMode.DRAWING_ROUTE);
  }

  // --- Логика Остановок ---

  private createStop(x: number, y: number): void {
    const entityId = entityManagerService.createEntity();
    if (entityId === -1) return;

    const stopCount = entityManagerService.getEntitiesWithComponents(STOP_COMPONENTS.DATA).length;
    const stopName = `Stop ${stopCount + 1}`;
    const stopId = `stop_${Date.now()}`;

    entityManagerService.addComponent(entityId, STOP_COMPONENTS.POSITION, { x, y });
    entityManagerService.addComponent(entityId, STOP_COMPONENTS.DATA, {
      id: stopId,
      name: stopName,
      radius: this.config.defaultStopRadius,
      color: '#00ff00',
      waitingPassengers: 0,
    });

    gameEventBusService.publish(GameEventType.STOP_CREATED, { stopId, name: stopName });
    console.log(`[MapEditor] Stop created: ${stopName}`);
  }

  // --- Логика Маршрутов ---

  private addStopToDraftRoute(x: number, y: number): void {
    // 1. Проверяем, кликнули ли мы в существующую остановку
    const clickedStopId = this.findStopAtPosition(x, y);

    if (!clickedStopId) {
      console.warn(
        '[MapEditor] Clicked on empty space while drawing route. Click on a green stop!'
      );
      // Можно добавить визуальный фидбек "ошибки"
      return;
    }

    // 2. Инициализируем черновик, если это первая точка
    if (!this.draftRoute) {
      this.draftRoute = { stopIds: [] };
      console.log('[MapEditor] Started new route draft');
    }

    // 3. Добавляем ID остановки (проверка на дубликаты подряд опциональна)
    if (this.draftRoute.stopIds[this.draftRoute.stopIds.length - 1] !== clickedStopId) {
      this.draftRoute.stopIds.push(clickedStopId);
      console.log(
        `[MapEditor] Added stop ${clickedStopId} to route. Total points: ${this.draftRoute.stopIds.length}`
      );

      // Здесь можно добавить временную отрисовку линии "призрака" от последней точки до курсора
      // Но для MVP оставим так: линия появится только после завершения.
    } else {
      console.log('[MapEditor] Same stop clicked twice, ignoring');
    }
  }

  private finishDraftRoute(): void {
    if (!this.draftRoute || this.draftRoute.stopIds.length < 2) {
      console.warn('[MapEditor] Cannot finish route: need at least 2 stops.');
      if (this.draftRoute) this.cancelDraftRoute();
      return;
    }

    const routeId = `route_${Date.now()}`;
    const routeName = `Route ${Math.floor(Math.random() * 100)}`;

    const entityId = entityManagerService.createEntity();
    if (entityId === -1) return;

    entityManagerService.addComponent(entityId, ROUTE_COMPONENTS.DATA, {
      id: routeId,
      name: routeName,
      stopIds: [...this.draftRoute.stopIds],
      color: this.config.defaultRouteColor,
      isActive: true,
      loop: false, // Пока без зацикливания
    });

    gameEventBusService.publish(GameEventType.ROUTE_CREATED, { routeId, name: routeName });
    console.log(
      `[MapEditor] Route created: ${routeName} with ${this.draftRoute.stopIds.length} stops.`
    );

    this.cancelDraftRoute(); // Сброс черновика
  }

  private cancelDraftRoute(): void {
    this.draftRoute = null;
    console.log('[MapEditor] Route draft cancelled/reset');
  }

  /**
   * Поиск ID остановки по координатам клика
   * Проверяет попадание в радиус остановки
   */
  private findStopAtPosition(x: number, y: number): string | null {
    const stops = entityManagerService.getEntitiesWithComponents(
      STOP_COMPONENTS.POSITION,
      STOP_COMPONENTS.DATA
    );

    for (const entityId of stops) {
      const pos = entityManagerService.getComponent<StopPositionComponent>(
        entityId,
        STOP_COMPONENTS.POSITION
      );
      const data = entityManagerService.getComponent<StopDataComponent>(
        entityId,
        STOP_COMPONENTS.DATA
      );

      if (pos && data) {
        const dx = x - pos.x;
        const dy = y - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= data.radius) {
          return data.id;
        }
      }
    }
    return null;
  }

  public cleanup(): void {
    this.unsubscribeClick?.();
    this.unsubscribeDoubleClick?.();
    this.unsubscribeKeyDown?.();
    this.isInitialized = false;
  }
}

export const mapEditorService = new MapEditorService();
