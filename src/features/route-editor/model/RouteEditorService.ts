/**
 * RouteEditorService
 *
 * Сервис для управления виджетом редактирования маршрута.
 * Открывается при клике на маршрут.
 *
 * @module features/route-editor/model
 */

import { gameEventBusService, GameEventType } from '@/shared/lib/game-core/GameEventBusService';
import { playerProgressService } from '@/features/player-progress/model/PlayerProgressService';
import {
  BUS_TYPES_CONFIG,
  getIncomeMultiplier,
  getMaxUpgradeLevel,
} from '@/entities/Bus/model/BusTypes';
import type { SavedBus } from '@/pages/garage/model/types';

// События RouteEditor
export enum RouteEditorEventType {
  OPENED = 'route_editor:opened',
  CLOSED = 'route_editor:closed',
  BUS_ADDED = 'route_editor:bus_added',
  BUS_REMOVED = 'route_editor:bus_removed',
}

export interface RouteEditorOpenedEvent {
  routeId: string;
  routeName: string;
}

// Автобусы одного типа с количеством
export interface BusGroup {
  typeId: string;
  typeName: string;
  name: string; // Название первого автобуса для отображения
  level: number;
  maxLevel: number;
  capacity: number;
  speed: number;
  incomeMultiplier: number;
  total: number; // Всего у игрока
  onRoute: number; // На маршруте
}

export interface RouteEditorData {
  routeId: string;
  routeName: string;
  busGroups: BusGroup[];
}

class RouteEditorServiceClass {
  private isOpen: boolean = false;
  private selectedRoute: RouteEditorData | null = null;
  private currentRouteId: string | null = null;

  // Храним сколько автобусов каждого типа на этом маршруте
  private busesOnThisRoute: Map<string, number> = new Map();

  /**
   * Открыть редактор маршрута
   */
  public open(routeId: string, routeName: string): void {
    this.currentRouteId = routeId;

    // Получаем купленные автобусы из прогресса
    const purchasedBuses = playerProgressService.getPurchasedBuses();

    // Группируем автобусы по типам
    const groups = this.groupBusesByType(purchasedBuses);

    // Инициализируем количество автобусов на маршруте
    if (!this.busesOnThisRoute.has(routeId)) {
      this.busesOnThisRoute.set(routeId, 0);
    }

    this.selectedRoute = {
      routeId,
      routeName,
      busGroups: groups,
    };
    this.isOpen = true;

    // Публикуем событие открытия
    gameEventBusService.publish(GameEventType.ROUTE_EDITOR_OPENED, {
      routeId,
      routeName,
    });

    console.log(`[RouteEditor] Opened: ${routeName} (${routeId})`);
  }

  /**
   * Закрыть редактор маршрута
   */
  public close(): void {
    this.isOpen = false;
    this.selectedRoute = null;
    this.currentRouteId = null;

    // Публикуем событие закрытия
    gameEventBusService.publish(GameEventType.ROUTE_EDITOR_CLOSED, undefined);

    console.log('[RouteEditor] Closed');
  }

  /**
   * Получить данные открытого маршрута
   */
  public getRouteData(): RouteEditorData | null {
    return this.selectedRoute;
  }

  /**
   * Проверить открыт ли редактор
   */
  public getIsOpen(): boolean {
    return this.isOpen;
  }

  /**
   * Добавить автобус типа на маршрут (спавн сущности)
   */
  public addBusToRoute(typeId: string): void {
    if (!this.selectedRoute || !this.currentRouteId) return;

    const group = this.selectedRoute.busGroups.find((g) => g.typeId === typeId);
    if (!group || group.onRoute >= group.total) {
      console.warn('[RouteEditor] No available buses of this type');
      return;
    }

    // Увеличиваем счётчик на маршруте
    group.onRoute++;

    // Спавним автобуса через MapEditorService
    this.spawnBusOnRoute(typeId, this.currentRouteId);

    console.log(
      `[RouteEditor] Added bus ${group.typeName} to route (now: ${group.onRoute}/${group.total})`
    );
  }

  /**
   * Удалить автобус типа с маршрута
   */
  public removeBusFromRoute(typeId: string): void {
    if (!this.selectedRoute || !this.currentRouteId) return;

    const group = this.selectedRoute.busGroups.find((g) => g.typeId === typeId);
    if (!group || group.onRoute <= 0) {
      console.warn('[RouteEditor] No buses of this type on route');
      return;
    }

    // Уменьшаем счётчик на маршруте
    group.onRoute--;

    // Находим активный автобус этого типа и удаляем его
    this.removeBusFromRouteByType(typeId);

    console.log(
      `[RouteEditor] Removed bus ${group.typeName} from route (now: ${group.onRoute}/${group.total})`
    );
  }

  /**
   * Удалить конкретный автобус с маршрута (вернуть в гараж)
   */
  private removeBusFromRouteByType(busTypeId: string): void {
    // Импортируем динамически чтобы избежать циклических зависимостей
    import('@/shared/lib/game-core/EntityManagerService').then(({ entityManagerService }) => {
      import('@/entities/Bus/model/BusComponents').then(({ BUS_COMPONENTS }) => {
        // Находим все автобусы на карте
        const busEntities = entityManagerService.getEntitiesWithComponents(BUS_COMPONENTS.DATA);
        
        // Ищем первый активный автобус этого типа
        for (const entityId of busEntities) {
          const busData = entityManagerService.getComponent<any>(entityId, BUS_COMPONENTS.DATA);
          if (busData && busData.busTypeId === busTypeId) {
            // Удаляем через MapEditorService
            import('@/features/map-editor/model/MapEditorService').then(({ mapEditorService }) => {
              mapEditorService.removeBusFromRoute(entityId, busTypeId);
            });
            return;
          }
        }
        
        console.warn('[RouteEditor] No active bus found to remove');
      });
    });
  }

  /**
   * Получить общее количество автобусов на маршруте
   */
  public getTotalBusesOnRoute(): number {
    if (!this.selectedRoute) return 0;
    return this.selectedRoute.busGroups.reduce((sum, g) => sum + g.onRoute, 0);
  }

  /**
   * Спавн автобуса на маршрут (создание сущности)
   */
  private spawnBusOnRoute(busTypeId: string, routeId: string): void {
    // Получаем данные автобуса из прогресса
    const purchasedBuses = playerProgressService.getPurchasedBuses();
    
    // Находим первый неактивный автобус этого типа
    let targetBusIndex = -1;
    let busLevel = 1;
    
    for (let i = 0; i < purchasedBuses.length; i++) {
      if (purchasedBuses[i].busTypeId === busTypeId && !purchasedBuses[i].isActive) {
        targetBusIndex = i;
        busLevel = purchasedBuses[i].level;
        break;
      }
    }

    if (targetBusIndex === -1) {
      console.error('[RouteEditor] No inactive bus found of type:', busTypeId);
      return;
    }

    // Импортируем mapEditorService для спавна
    import('@/features/map-editor/model/MapEditorService').then(({ mapEditorService }) => {
      // Спавним автобуса с учётом уровня
      const result = mapEditorService.spawnBusByType(busTypeId, routeId, busLevel);
      
      if (result) {
        // Помечаем автобус как активный
        playerProgressService.setBusActive(`bus_${targetBusIndex}`, true);
        console.log(`[RouteEditor] Bus ${busTypeId} (Lvl ${busLevel}) spawned on route ${routeId}`);
      }
    });
  }

  /**
   * Сгруппировать автобусы по типам
   */
  private groupBusesByType(buses: SavedBus[]): BusGroup[] {
    const groups = new Map<string, BusGroup>();

    for (const bus of buses) {
      const config = BUS_TYPES_CONFIG.find((c) => c.id === bus.busTypeId);
      if (!config) continue;

      if (!groups.has(bus.busTypeId)) {
        groups.set(bus.busTypeId, {
          typeId: bus.busTypeId,
          typeName: config.name,
          name: config.name,
          level: bus.level,
          maxLevel: getMaxUpgradeLevel(),
          capacity: config.baseCapacity,
          speed: config.baseSpeed,
          incomeMultiplier: getIncomeMultiplier(bus.busTypeId, bus.level),
          total: 0,
          onRoute: 0,
        });
      }
      const group = groups.get(bus.busTypeId)!;
      group.total++;
    }

    return Array.from(groups.values());
  }
}

export const routeEditorService = new RouteEditorServiceClass();
