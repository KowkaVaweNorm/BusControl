/**
 * RouteEditorService
 *
 * Сервис для управления виджетом редактирования маршрута.
 * Открывается при клике на маршрут.
 *
 * @module features/route-editor/model
 */

import { gameEventBusService, GameEventType } from '@/shared/lib/game-core/GameEventBusService';

// Моковые данные автобусов (из Garage)
export interface MockBus {
  id: string;
  name: string;
  typeId: string;
  typeName: string;
  level: number;
  maxLevel: number;
  capacity: number;
  speed: number;
  cost: number;
  upgradeCost: number;
}

// События RouteEditor
export enum RouteEditorEventType {
  OPENED = 'route_editor:opened',
  CLOSED = 'route_editor:closed',
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
  total: number; // Всего у игрока
  onRoute: number; // На маршруте
}

// Моковый список автобусов (игрок имеет: 5 Лиаз, 2 Паз, 1 Камаз)
export const MOCK_BUSES: MockBus[] = [
  {
    id: 'bus_1',
    name: 'ЛиАЗ-5296',
    typeId: 'liaz',
    typeName: 'ЛиАЗ',
    level: 2,
    maxLevel: 5,
    capacity: 85,
    speed: 60,
    cost: 15000,
    upgradeCost: 5000,
  },
  {
    id: 'bus_2',
    name: 'ЛиАЗ-5296',
    typeId: 'liaz',
    typeName: 'ЛиАЗ',
    level: 1,
    maxLevel: 5,
    capacity: 85,
    speed: 60,
    cost: 15000,
    upgradeCost: 5000,
  },
  {
    id: 'bus_3',
    name: 'ЛиАЗ-5296',
    typeId: 'liaz',
    typeName: 'ЛиАЗ',
    level: 3,
    maxLevel: 5,
    capacity: 85,
    speed: 60,
    cost: 15000,
    upgradeCost: 5000,
  },
  {
    id: 'bus_4',
    name: 'ЛиАЗ-5296',
    typeId: 'liaz',
    typeName: 'ЛиАЗ',
    level: 1,
    maxLevel: 5,
    capacity: 85,
    speed: 60,
    cost: 15000,
    upgradeCost: 5000,
  },
  {
    id: 'bus_5',
    name: 'ЛиАЗ-5296',
    typeId: 'liaz',
    typeName: 'ЛиАЗ',
    level: 2,
    maxLevel: 5,
    capacity: 85,
    speed: 60,
    cost: 15000,
    upgradeCost: 5000,
  },
  {
    id: 'bus_6',
    name: 'ПАЗ-3204',
    typeId: 'paz',
    typeName: 'ПАЗ',
    level: 1,
    maxLevel: 3,
    capacity: 50,
    speed: 70,
    cost: 10000,
    upgradeCost: 3000,
  },
  {
    id: 'bus_7',
    name: 'ПАЗ-3204',
    typeId: 'paz',
    typeName: 'ПАЗ',
    level: 2,
    maxLevel: 3,
    capacity: 50,
    speed: 70,
    cost: 10000,
    upgradeCost: 3000,
  },
  {
    id: 'bus_8',
    name: 'КАМАЗ-6282',
    typeId: 'kamaz',
    typeName: 'КАМАЗ',
    level: 1,
    maxLevel: 4,
    capacity: 80,
    speed: 75,
    cost: 18000,
    upgradeCost: 6000,
  },
];

export interface RouteEditorData {
  routeId: string;
  routeName: string;
  busGroups: BusGroup[];
}

class RouteEditorServiceClass {
  private isOpen: boolean = false;
  private selectedRoute: RouteEditorData | null = null;
  
  // Храним сколько автобусов каждого типа на этом маршруте
  private busesOnThisRoute: Map<string, number> = new Map();

  /**
   * Открыть редактор маршрута
   */
  public open(routeId: string, routeName: string): void {
    // Группируем автобусы по типам
    const groups = this.groupBusesByType(MOCK_BUSES);
    
    // Инициализируем количество автобусов на маршруте (пока 0 для нового)
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
    gameEventBusService.publish(GameEventType.ROUTE_EDITOR_OPENED as any, {
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

    // Публикуем событие закрытия
    gameEventBusService.publish(GameEventType.STOP_EDITOR_CLOSED as any, {});

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
   * Добавить автобус типа на маршрут
   */
  public addBusToRoute(typeId: string): void {
    if (!this.selectedRoute) return;

    const group = this.selectedRoute.busGroups.find((g) => g.typeId === typeId);
    if (group && group.onRoute < group.total) {
      group.onRoute++;
      console.log(`[RouteEditor] Added bus ${group.typeName} to route (now: ${group.onRoute}/${group.total})`);
    }
  }

  /**
   * Удалить автобус типа с маршрута
   */
  public removeBusFromRoute(typeId: string): void {
    if (!this.selectedRoute) return;

    const group = this.selectedRoute.busGroups.find((g) => g.typeId === typeId);
    if (group && group.onRoute > 0) {
      group.onRoute--;
      console.log(`[RouteEditor] Removed bus ${group.typeName} from route (now: ${group.onRoute}/${group.total})`);
    }
  }

  /**
   * Получить общее количество автобусов на маршруте
   */
  public getTotalBusesOnRoute(): number {
    if (!this.selectedRoute) return 0;
    return this.selectedRoute.busGroups.reduce((sum, g) => sum + g.onRoute, 0);
  }

  /**
   * Сгруппировать автобусы по типам
   */
  private groupBusesByType(buses: MockBus[]): BusGroup[] {
    const groups = new Map<string, BusGroup>();

    for (const bus of buses) {
      if (!groups.has(bus.typeId)) {
        groups.set(bus.typeId, {
          typeId: bus.typeId,
          typeName: bus.typeName,
          name: bus.name,
          level: bus.level,
          maxLevel: bus.maxLevel,
          capacity: bus.capacity,
          speed: bus.speed,
          total: 0,
          onRoute: 0,
        });
      }
      const group = groups.get(bus.typeId)!;
      group.total++;
    }

    return Array.from(groups.values());
  }
}

export const routeEditorService = new RouteEditorServiceClass();
