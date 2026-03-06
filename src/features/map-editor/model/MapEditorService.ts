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
  type InputEvent,
  type InputEventMap,
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
import {
  STOP_COMPONENTS,
  type StopPositionComponent,
  type StopDataComponent,
  DEFAULT_SPAWN_RATES,
} from '@/entities/stop/model/StopComponents';
import { BUS_COMPONENTS, BusState } from '@/entities/Bus/model/BusComponents';
import type { BusTypeId } from '@/entities/Bus/model/BusTypes';
import { clearMovementCache } from '@/entities/Bus/model/BusMovementSystem';
import { stopEditorService } from '@/features/stop-editor';
import { playerProgressService } from '@/features/player-progress/model/PlayerProgressService';

export enum EditorMode {
  IDLE = 'idle', // Выделение и редактирование остановок
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

  private boundHandleMouseClick?: (event: InputEvent<InputEventMap[InputEventType.MOUSE_UP]>) => void;
  private boundHandleMouseDoubleClick?: (event: InputEvent<InputEventMap[InputEventType.MOUSE_DOUBLE_CLICK]>) => void;
  private boundHandleKeyDown?: (event: InputEvent<InputEventMap[InputEventType.KEY_DOWN]>) => void;

  private mode: EditorMode = EditorMode.IDLE; // По умолчанию режим выделения
  private draftRoute: DraftRoute | null = null;
  private routeLoopMode: boolean = false; // Режим зацикливания маршрута (по умолчанию выкл)

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

    // Используем MOUSE_UP для мгновенной реакции (MOUSE_CLICK имеет задержку 250мс)
    this.unsubscribeClick = inputService.subscribe(
      InputEventType.MOUSE_UP,
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
  }

  public setMode(mode: EditorMode): void {
    // При переключении режима закрываем редактор остановок
    if (stopEditorService.getIsOpen()) {
      stopEditorService.close();
    }

    // Если сменили режим и был черновик маршрута - сбрасываем его
    if (mode !== EditorMode.DRAWING_ROUTE && this.draftRoute) {
      this.cancelDraftRoute();
    }

    this.mode = mode;
  }

  public getMode(): EditorMode {
    return this.mode;
  }

  private handleMouseClick(event: InputEvent<InputEventMap[InputEventType.MOUSE_UP]>): void {
    if (this.mode === EditorMode.IDLE) {
      // В режиме выделения ЛКМ по остановке открывает редактор
      if (event.payload.button !== MouseButton.LEFT) return;
      const { worldX, worldY } = event.payload;

      const clickedStopId = this.findStopAtPosition(worldX, worldY);
      if (clickedStopId) {
        stopEditorService.open(clickedStopId);
      }
      return;
    }

    if (this.mode === EditorMode.PLACING_STOP) {
      if (event.payload.button !== MouseButton.LEFT) return;
      const { worldX, worldY } = event.payload;
      this.createStop(worldX, worldY);
      return;
    }

    if (this.mode === EditorMode.DRAWING_ROUTE) {
      if (event.payload.button !== MouseButton.LEFT) return;
      const { worldX, worldY } = event.payload;
      this.addStopToDraftRoute(worldX, worldY);
    }
  }

  private handleMouseDoubleClick(_event: InputEvent<InputEventMap[InputEventType.MOUSE_DOUBLE_CLICK]>): void {
    if (this.mode === EditorMode.DRAWING_ROUTE) {
      this.finishDraftRoute();
    }
  }

  private handleKeyDown(event: InputEvent<InputEventMap[InputEventType.KEY_DOWN]>): void {
    if (this.mode === EditorMode.DRAWING_ROUTE) {
      // Escape - отмена
      if (event.payload.key === 'Escape') {
        this.cancelDraftRoute();
      }
      // Enter - завершение
      if (event.payload.key === 'Enter') {
        this.finishDraftRoute();
      }
      // L - переключение режима зацикливания
      if (
        event.payload.key === 'l' ||
        event.payload.key === 'L' ||
        event.payload.key === 'к' ||
        event.payload.key === 'К'
      ) {
        this.routeLoopMode = !this.routeLoopMode;
        console.log(`[MapEditor] Route loop mode: ${this.routeLoopMode ? 'ON ♻️' : 'OFF'}`);
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
      spawnRates: { ...DEFAULT_SPAWN_RATES },
      overloadTimer: 0, // Инициализация таймера перегрузки
      complaintCount: 0, // Инициализация счётчика жалоб
    });

    // Очищаем кэш движения при создании остановки
    clearMovementCache();

    gameEventBusService.publish(GameEventType.STOP_CREATED, { stopId, name: stopName });

    // Автосохранение карты (только остановки и маршруты, без автобусов)
    // mapSaveService.saveCurrentMap(); // Автосохранение работает по таймеру
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
      loop: this.routeLoopMode, // Используем текущий режим зацикливания
    });

    // Очищаем кэш движения при создании маршрута
    clearMovementCache();

    gameEventBusService.publish(GameEventType.ROUTE_CREATED, { routeId, name: routeName });

    console.log(
      `[MapEditor] Route created: ${routeName}, loop=${this.routeLoopMode ? 'YES ♻️' : 'NO'}`
    );

    // Автосохранение карты (только остановки и маршруты, без автобусов)
    // mapSaveService.saveCurrentMap(); // Автосохранение работает по таймеру

    this.cancelDraftRoute(); // Сброс черновика
  }

  private cancelDraftRoute(): void {
    this.draftRoute = null;
  }

  /**
   * Создать автобус конкретного типа на маршрут
   * Используется при спавне из RouteEditor
   *
   * @param busTypeId - ID типа автобуса
   * @param routeId - ID маршрута
   * @param level - Уровень прокачки типа (0 = без улучшений)
   * @returns ID созданного автобуса
   */
  public spawnBusByType(busTypeId: string, routeId: string, level: number = 0): string | null {
    // Импортируем типы автобусов
    import('@/entities/Bus/model/BusTypes').then(({
      BUS_TYPES_CONFIG,
      getIncomeMultiplier,
    }) => {
      const busType = BUS_TYPES_CONFIG.find((t) => t.id === busTypeId);
      
      if (!busType) {
        console.error('[MapEditor] Unknown bus type:', busTypeId);
        return null;
      }

      const entityId = entityManagerService.createEntity();
      if (entityId === -1) return null;

      const busId = `bus_${Date.now()}_${busTypeId}`;

      // Находим первую остановку маршрута
      const startPos = this.getFirstStopPosition(routeId);
      const startX = startPos ? startPos.x : 0;
      const startY = startPos ? startPos.y : 0;

      // Расчёт характеристик с учётом прокачки
      // level = 0 → без бонусов, level = 1 → +5%, level = 5 → +25%
      const speedBonus = level * 0.05; // +5% за каждый уровень прокачки
      const maxSpeed = busType.baseSpeed * (1 + speedBonus);

      const incomeMultiplier = getIncomeMultiplier(busTypeId as BusTypeId, level);

      entityManagerService.addComponent(entityId, BUS_COMPONENTS.POSITION, {
        x: startX,
        y: startY,
        rotation: 0,
      });

      entityManagerService.addComponent(entityId, BUS_COMPONENTS.VELOCITY, {
        speed: 0,
        maxSpeed: maxSpeed,
        acceleration: 50,
        isMoving: false,
      });

      entityManagerService.addComponent(entityId, BUS_COMPONENTS.DATA, {
        id: busId,
        routeId: routeId,
        currentStopIndex: 0,
        state: BusState.IDLE,
        capacity: busType.baseCapacity,
        passengers: 0,
        color: busType.color,
        waitTimer: 0,
        waitTimeRequired: 3.0,
        busTypeId: busTypeId,
        level: level,
        incomeMultiplier: incomeMultiplier,
      });

      gameEventBusService.publish(GameEventType.BUS_CREATED, { busId, entityId });
      console.log(
        `[MapEditor] Spawned ${busType.name} (Lvl ${level}) on route ${routeId} | Capacity: ${busType.baseCapacity}, Speed: ${maxSpeed.toFixed(0)}, Income: x${incomeMultiplier.toFixed(2)}`
      );

      return busId;
    });

    return null;
  }

  /**
   * Удалить автобус с маршрута (вернуть в гараж)
   * 
   * @param busEntityId - ID сущности автобуса
   * @param busTypeId - Тип автобуса (для поиска в прогрессе)
   * @returns true если успешно
   */
  public removeBusFromRoute(busEntityId: number, busTypeId: string): boolean {
    // Помечаем автобус как неактивный в прогрессе
    const purchasedBuses = playerProgressService.getPurchasedBuses();
    const busIndex = purchasedBuses.findIndex(
      (b) => b.busTypeId === busTypeId && b.isActive
    );

    if (busIndex !== -1) {
      playerProgressService.setBusActive(`bus_${busIndex}`, false);
    }

    // Удаляем сущность
    entityManagerService.destroyEntity(busEntityId);

    console.log(`[MapEditor] Bus ${busTypeId} removed from route (returned to garage)`);
    return true;
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
        return entityManagerService.getComponent<StopPositionComponent>(
          id,
          STOP_COMPONENTS.POSITION
        );
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
    this.unsubscribeKeyDown?.();
    this.isInitialized = false;
  }
}

export const mapEditorService = new MapEditorService();
