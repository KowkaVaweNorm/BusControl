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
  gameEventBusService,
  GameEventType,
} from '../../../shared/lib/game-core/GameEventBusService';
import { ROUTE_COMPONENTS, type RouteDataComponent } from '@/entities/Route/model/RouteComponents';
import { STOP_COMPONENTS, type StopPositionComponent, type StopDataComponent } from '@/entities/stop/model/StopComponents';
import { BUS_COMPONENTS, BusState } from '@/entities/Bus/model/BusComponents';
import { clearMovementCache } from '@/entities/Bus/model/BusMovementSystem';

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
  private unsubscribeRightClick?: () => void;

  private boundHandleMouseClick?: (event: any) => void;
  private boundHandleMouseDoubleClick?: (event: any) => void;
  private boundHandleKeyDown?: (event: any) => void;
  private boundHandleMouseRightClick?: (event: any) => void;

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
    this.boundHandleMouseRightClick = this.handleMouseRightClick.bind(this);
  }

  public initialize(): void {
    if (this.isInitialized) return;

    // Используем MOUSE_UP для мгновенной реакции (MOUSE_CLICK имеет задержку 250мс)
    this.unsubscribeClick = inputService.subscribe(
      InputEventType.MOUSE_UP,
      this.boundHandleMouseClick!
    );

    this.unsubscribeDoubleClick = inputService.subscribe(
      InputEventType.MOUSE_DOUBLE_CLICK,
      this.boundHandleMouseDoubleClick!
    );

    // Слушаем ПКМ для создания автобуса на маршруте
    this.unsubscribeRightClick = inputService.subscribe(
      InputEventType.MOUSE_DOWN,
      this.boundHandleMouseRightClick!
    );

    // Слушаем клавишу Enter или Escape для завершения/отмены маршрута
    this.unsubscribeKeyDown = inputService.subscribe(
      InputEventType.KEY_DOWN,
      this.boundHandleKeyDown!
    );

    this.isInitialized = true;
  }

  public setMode(mode: EditorMode): void {
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

  private handleMouseDoubleClick(_event: any): void {
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

    // Очищаем кэш движения при создании остановки
    clearMovementCache();

    gameEventBusService.publish(GameEventType.STOP_CREATED, { stopId, name: stopName });
  }

  // --- Логика Маршрутов ---

  private addStopToDraftRoute(x: number, y: number): void {
    // 1. Проверяем, кликнули ли мы в существующую остановку
    const clickedStopId = this.findStopAtPosition(x, y);

    if (!clickedStopId) {
      // Можно добавить визуальный фидбек "ошибки"
      return;
    }

    // 2. Инициализируем черновик, если это первая точка
    if (!this.draftRoute) {
      this.draftRoute = { stopIds: [] };
    }

    // 3. Добавляем ID остановки (проверка на дубликаты подряд опциональна)
    if (this.draftRoute.stopIds[this.draftRoute.stopIds.length - 1] !== clickedStopId) {
      this.draftRoute.stopIds.push(clickedStopId);
    }
  }

  private finishDraftRoute(): void {
    if (!this.draftRoute || this.draftRoute.stopIds.length < 2) {
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

    // Очищаем кэш движения при создании маршрута
    clearMovementCache();

    gameEventBusService.publish(GameEventType.ROUTE_CREATED, { routeId, name: routeName });

    this.cancelDraftRoute(); // Сброс черновика
  }

  private cancelDraftRoute(): void {
    this.draftRoute = null;
  }

  // --- Обработка ПКМ для создания автобуса ---

  private handleMouseRightClick(_event: any): void {
    // Реагируем только на ПКМ
    if (_event.payload.button !== MouseButton.RIGHT) return;
    
    const { worldX, worldY } = _event.payload;
    
    // Проверяем, попали ли в маршрут
    const clickedRouteId = this.findRouteAtPosition(worldX, worldY);
    
    if (clickedRouteId) {
      this.createBusOnRoute(clickedRouteId);
    } else {
      console.log('[MapEditor] Right click on empty space (no route)');
    }
  }

  private createBusOnRoute(routeId: string): void {
    const entityId = entityManagerService.createEntity();
    if (entityId === -1) return;

    const busId = `bus_${Date.now()}`;
    
    // Находим первую остановку маршрута, чтобы поставить туда автобус
    const startPos = this.getFirstStopPosition(routeId);
    
    const startX = startPos ? startPos.x : 0;
    const startY = startPos ? startPos.y : 0;

    entityManagerService.addComponent(entityId, BUS_COMPONENTS.POSITION, {
      x: startX,
      y: startY,
      rotation: 0,
    });

    entityManagerService.addComponent(entityId, BUS_COMPONENTS.VELOCITY, {
      speed: 0,
      maxSpeed: 150, // Пикселей в секунду
      acceleration: 50,
      isMoving: false,
    });

    entityManagerService.addComponent(entityId, BUS_COMPONENTS.DATA, {
      id: busId,
      routeId: routeId,
      currentStopIndex: 0, // Стартуем с первой остановки
      state: BusState.IDLE, // Сразу начнет движение благодаря LogicSystem
      capacity: 20,
      passengers: 0,
      color: '#ffcc00', // Желтый автобус
      waitTimer: 0,
      waitTimeRequired: 3.0, // Ждать 3 секунды на остановке
    });

    gameEventBusService.publish(GameEventType.BUS_CREATED, { busId, entityId });
    console.log(`[MapEditor] Bus created on route ${routeId}`);
  }

  /**
   * Поиск маршрута по клику
   * Проверяет расстояние до линий маршрута (с порогом 20px)
   */
  private findRouteAtPosition(x: number, y: number): string | null {
    const routes = entityManagerService.getEntitiesWithComponents(ROUTE_COMPONENTS.DATA);
    const threshold = 20; // Радиус клика вокруг линии

    for (const id of routes) {
      const rData = entityManagerService.getComponent<RouteDataComponent>(id, ROUTE_COMPONENTS.DATA);
      if (!rData) continue;

      // Проходим по сегментам маршрута
      for (let i = 0; i < rData.stopIds.length - 1; i++) {
        const p1 = this.getStopPosById(rData.stopIds[i]);
        const p2 = this.getStopPosById(rData.stopIds[i + 1]);
        
        if (p1 && p2) {
          if (this.pointToSegmentDistance(x, y, p1.x, p1.y, p2.x, p2.y) < threshold) {
            return rData.id;
          }
        }
      }
    }
    return null;
  }

  /**
   * Математика: расстояние от точки до отрезка
   */
  private pointToSegmentDistance(
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): number {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1; yy = y1;
    } else if (param > 1) {
      xx = x2; yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Поиск координат остановки по ID
   */
  private getStopPosById(stopId: string): { x: number; y: number } | null {
    const stops = entityManagerService.getEntitiesWithComponents(
      STOP_COMPONENTS.POSITION,
      STOP_COMPONENTS.DATA
    );
    for (const id of stops) {
      const d = entityManagerService.getComponent<StopDataComponent>(id, STOP_COMPONENTS.DATA);
      if (d && d.id === stopId) {
        return entityManagerService.getComponent<StopPositionComponent>(id, STOP_COMPONENTS.POSITION);
      }
    }
    return null;
  }

  /**
   * Поиск позиции первой остановки маршрута
   */
  private getFirstStopPosition(routeId: string): { x: number; y: number } | null {
    const routes = entityManagerService.getEntitiesWithComponents(ROUTE_COMPONENTS.DATA);
    for (const id of routes) {
      const r = entityManagerService.getComponent<RouteDataComponent>(id, ROUTE_COMPONENTS.DATA);
      if (r && r.id === routeId && r.stopIds.length > 0) {
        return this.getStopPosById(r.stopIds[0]);
      }
    }
    return null;
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
    this.unsubscribeRightClick?.();
    this.unsubscribeKeyDown?.();
    this.isInitialized = false;
  }
}

export const mapEditorService = new MapEditorService();
