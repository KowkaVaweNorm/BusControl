/**
 * MapSaveService
 * 
 * Сервис сохранения и загрузки карт.
 * Работает с localStorage и пресетными картами.
 * 
 * @module features/map-save/model
 */

import { entityManagerService } from '@/shared/lib/game-core/EntityManagerService';
import { gameEventBusService, GameEventType } from '@/shared/lib/game-core/GameEventBusService';
import { STOP_COMPONENTS, type StopDataComponent, type StopPositionComponent, DEFAULT_SPAWN_RATES } from '@/entities/stop/model/StopComponents';
import { ROUTE_COMPONENTS, type RouteDataComponent } from '@/entities/Route/model/RouteComponents';
import { BUS_COMPONENTS, type BusDataComponent } from '@/entities/Bus/model/BusComponents';
import { NPC_COMPONENTS } from '@/entities/NPC/model/NPCComponents';
import { cameraController } from '@/shared/lib/game-core/CameraController';
import {
  SAVE_VERSION,
  STORAGE_KEY,
  type MapSaveData,
  type SavedStop,
  type SavedRoute,
  type SavedBus,
  type PresetMap,
  type SaveMetadata,
} from './types';

// Импорт пресетных карт
import { presetMaps } from './preset-maps';

export class MapSaveService {
  private currentSaveData: MapSaveData | null = null;
  private autoSaveTimerId: ReturnType<typeof setInterval> | null = null;
  private readonly AUTO_SAVE_INTERVAL = 60000; // 1 минута (60000 мс)

  /**
   * Запустить автосохранение
   */
  public startAutoSave(): void {
    if (this.autoSaveTimerId) {
      this.stopAutoSave();
    }

    this.autoSaveTimerId = setInterval(() => {
      this.autoSave();
    }, this.AUTO_SAVE_INTERVAL);

    console.log(`[MapSaveService] Auto-save started (every ${this.AUTO_SAVE_INTERVAL / 1000} seconds)`);
  }

  /**
   * Остановить автосохранение
   */
  public stopAutoSave(): void {
    if (this.autoSaveTimerId) {
      clearInterval(this.autoSaveTimerId);
      this.autoSaveTimerId = null;
      console.log('[MapSaveService] Auto-save stopped');
    }
  }

  /**
   * Автосохранение (тихое, без логов)
   */
  private autoSave(): void {
    const stops = this.collectStops();
    const routes = this.collectRoutes();

    // Автосохранение сохраняет только остановки и маршруты (без автобусов)
    // Игрок может добавить автобусы вручную после загрузки
    const saveData: MapSaveData = {
      version: SAVE_VERSION,
      mapName: this.currentSaveData?.mapName || 'My Map',
      createdAt: this.currentSaveData?.createdAt || Date.now(),
      modifiedAt: Date.now(),
      stops,
      routes,
      buses: [], // Не сохраняем автобусы при автосохранении
      camera: this.collectCamera(),
      options: {
        autoSaveEnabled: true,
        autoSaveInterval: this.AUTO_SAVE_INTERVAL / 1000,
        preserveBuses: false,
      },
    };

    this.currentSaveData = saveData;
    this.saveToLocalStorage(saveData);
  }

  /**
   * Сохранить текущую карту в памяти и localStorage
   */
  public saveCurrentMap(mapName: string = 'My Map', includeBuses: boolean = false): MapSaveData {
    const stops = this.collectStops();
    const routes = this.collectRoutes();
    const buses = includeBuses ? this.collectBuses() : [];

    const saveData: MapSaveData = {
      version: SAVE_VERSION,
      mapName,
      createdAt: this.currentSaveData?.createdAt || Date.now(),
      modifiedAt: Date.now(),
      stops,
      routes,
      buses,
      camera: this.collectCamera(),
      options: {
        autoSaveEnabled: false,
        autoSaveInterval: this.AUTO_SAVE_INTERVAL / 1000,
        preserveBuses: includeBuses,
      },
    };

    this.currentSaveData = saveData;
    this.saveToLocalStorage(saveData);

    console.log(`[MapSaveService] Map saved: ${mapName} (stops: ${stops.length}, routes: ${routes.length}, buses: ${buses.length})`);
    return saveData;
  }

  /**
   * Загрузить карту из данных сохранения
   */
  public loadMap(saveData: MapSaveData): void {
    // Проверка версии
    if (saveData.version !== SAVE_VERSION) {
      console.warn(`[MapSaveService] Version mismatch: expected ${SAVE_VERSION}, got ${saveData.version}`);
      // В будущем здесь будет миграция данных
    }

    // Очистка текущих сущностей
    this.clearAllEntities();

    // Создание остановок
    for (const stopData of saveData.stops) {
      this.createStopFromSave(stopData);
    }

    // Создание маршрутов
    for (const routeData of saveData.routes) {
      this.createRouteFromSave(routeData);
    }

    // Создание автобусов
    for (const busData of saveData.buses) {
      this.createBusFromSave(busData);
    }

    // Восстановление камеры
    if (saveData.camera) {
      this.restoreCamera(saveData.camera);
    }

    this.currentSaveData = saveData;
    console.log(`[MapSaveService] Map loaded: ${saveData.mapName}`);
  }

  /**
   * Сохранить в localStorage
   */
  public saveToLocalStorage(data: MapSaveData): void {
    try {
      const jsonString = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, jsonString);
      console.log('[MapSaveService] Saved to localStorage');
    } catch (error) {
      console.error('[MapSaveService] Failed to save to localStorage:', error);
    }
  }

  /**
   * Загрузить из localStorage
   */
  public loadFromLocalStorage(): MapSaveData | null {
    try {
      const jsonString = localStorage.getItem(STORAGE_KEY);
      if (!jsonString) {
        return null;
      }

      const data = JSON.parse(jsonString) as MapSaveData;
      console.log('[MapSaveService] Loaded from localStorage');
      return data;
    } catch (error) {
      console.error('[MapSaveService] Failed to load from localStorage:', error);
      return null;
    }
  }

  /**
   * Очистить localStorage
   */
  public clearLocalStorage(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.currentSaveData = null;
    console.log('[MapSaveService] localStorage cleared');
  }

  /**
   * Загрузить пресетную карту
   */
  public loadPreset(presetId: string): boolean {
    const preset = presetMaps.find(p => p.id === presetId);
    if (!preset) {
      console.error(`[MapSaveService] Preset not found: ${presetId}`);
      return false;
    }

    const saveData: MapSaveData = {
      version: SAVE_VERSION,
      mapName: preset.name,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      stops: preset.data.stops,
      routes: preset.data.routes,
      buses: preset.data.buses || [],
      camera: preset.data.camera,
    };

    this.loadMap(saveData);
    console.log(`[MapSaveService] Preset loaded: ${preset.name}`);
    return true;
  }

  /**
   * Получить список пресетов
   */
  public getPresetList(): PresetMap[] {
    return presetMaps;
  }

  /**
   * Получить метаданные текущего сохранения
   */
  public getSaveMetadata(): SaveMetadata | null {
    const data = this.currentSaveData || this.loadFromLocalStorage();
    if (!data) return null;

    return {
      mapName: data.mapName,
      modifiedAt: data.modifiedAt,
      stopsCount: data.stops.length,
      routesCount: data.routes.length,
      busesCount: data.buses.length,
    };
  }

  /**
   * Экспорт в JSON строку
   */
  public exportToJson(data?: MapSaveData): string {
    const exportData = data || this.currentSaveData || this.loadFromLocalStorage();
    if (!exportData) {
      throw new Error('[MapSaveService] No data to export');
    }
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Импорт из JSON строки
   */
  public importFromJson(jsonString: string): MapSaveData {
    try {
      const data = JSON.parse(jsonString) as MapSaveData;
      
      // Валидация
      if (!data.version || !data.stops || !data.routes) {
        throw new Error('Invalid save data format');
      }

      this.loadMap(data);
      return data;
    } catch (error) {
      console.error('[MapSaveService] Failed to import JSON:', error);
      throw error;
    }
  }

  /**
   * Проверка наличия сохранения в localStorage
   */
  public hasSave(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  // ============================================
  // Приватные методы для сбора данных
  // ============================================

  /**
   * Собрать данные об остановках
   */
  private collectStops(): SavedStop[] {
    const stops: SavedStop[] = [];
    const stopEntities = entityManagerService.getEntitiesWithComponents(
      STOP_COMPONENTS.DATA,
      STOP_COMPONENTS.POSITION
    );

    for (const entityId of stopEntities) {
      const data = entityManagerService.getComponent<StopDataComponent>(entityId, STOP_COMPONENTS.DATA);
      const pos = entityManagerService.getComponent<StopPositionComponent>(entityId, STOP_COMPONENTS.POSITION);

      if (data && pos) {
        stops.push({
          id: data.id,
          name: data.name,
          x: pos.x,
          y: pos.y,
          spawnRates: {
            morning: data.spawnRates.morning,
            day: data.spawnRates.day,
            evening: data.spawnRates.evening,
            night: data.spawnRates.night,
          },
        });
      }
    }

    return stops;
  }

  /**
   * Собрать данные о маршрутах
   */
  private collectRoutes(): SavedRoute[] {
    const routes: SavedRoute[] = [];
    const routeEntities = entityManagerService.getEntitiesWithComponents(ROUTE_COMPONENTS.DATA);

    for (const entityId of routeEntities) {
      const data = entityManagerService.getComponent<RouteDataComponent>(entityId, ROUTE_COMPONENTS.DATA);

      if (data) {
        routes.push({
          id: data.id,
          name: data.name,
          stopIds: [...data.stopIds],
          color: data.color,
          loop: data.loop,
        });
      }
    }

    return routes;
  }

  /**
   * Собрать данные об автобусах
   */
  private collectBuses(): SavedBus[] {
    const buses: SavedBus[] = [];
    const busEntities = entityManagerService.getEntitiesWithComponents(BUS_COMPONENTS.DATA);

    for (const entityId of busEntities) {
      const data = entityManagerService.getComponent<BusDataComponent>(entityId, BUS_COMPONENTS.DATA);

      if (data && data.routeId) {
        buses.push({
          id: data.id,
          routeId: data.routeId,
          currentStopIndex: data.currentStopIndex,
          passengers: data.passengers,
        });
      }
    }

    return buses;
  }

  /**
   * Собрать данные о камере
   */
  private collectCamera(): { x: number; y: number; scale: number } | undefined {
    const viewport = cameraController.getViewport();
    return {
      x: viewport.x,
      y: viewport.y,
      scale: viewport.scale,
    };
  }

  /**
   * Восстановить камеру
   */
  private restoreCamera(camera: { x: number; y: number; scale: number }): void {
    cameraController.setViewport(camera.x, camera.y, camera.scale);
  }

  /**
   * Очистить все сущности
   */
  private clearAllEntities(): void {
    // Получаем все сущности с компонентами остановок, маршрутов, автобусов и NPC
    const stopEntities = entityManagerService.getEntitiesWithComponents(STOP_COMPONENTS.DATA);
    const routeEntities = entityManagerService.getEntitiesWithComponents(ROUTE_COMPONENTS.DATA);
    const busEntities = entityManagerService.getEntitiesWithComponents(BUS_COMPONENTS.DATA);
    const npcEntities = entityManagerService.getEntitiesWithComponents(NPC_COMPONENTS.DATA);

    // Удаляем все сущности
    for (const entityId of [...stopEntities, ...routeEntities, ...busEntities, ...npcEntities]) {
      if (entityManagerService.hasEntity(entityId)) {
        entityManagerService.destroyEntity(entityId);
      }
    }

    console.log('[MapSaveService] All entities cleared (including NPCs)');
  }

  /**
   * Создать остановку из данных сохранения
   */
  private createStopFromSave(stopData: SavedStop): void {
    const entityId = entityManagerService.createEntity();
    if (entityId === -1) return;

    entityManagerService.addComponent(entityId, STOP_COMPONENTS.POSITION, {
      x: stopData.x,
      y: stopData.y,
    });

    entityManagerService.addComponent(entityId, STOP_COMPONENTS.DATA, {
      id: stopData.id,
      name: stopData.name,
      radius: 40,
      color: '#00ff00',
      waitingPassengers: 0,
      spawnRates: stopData.spawnRates ? {
        morning: stopData.spawnRates.morning,
        day: stopData.spawnRates.day,
        evening: stopData.spawnRates.evening,
        night: stopData.spawnRates.night,
      } : { ...DEFAULT_SPAWN_RATES },
    });

    // Отправляем событие для обновления счётчика в GameStateStore
    gameEventBusService.publish(GameEventType.STOP_CREATED, { stopId: stopData.id, name: stopData.name });
  }

  /**
   * Создать маршрут из данных сохранения
   */
  private createRouteFromSave(routeData: SavedRoute): void {
    const entityId = entityManagerService.createEntity();
    if (entityId === -1) return;

    entityManagerService.addComponent(entityId, ROUTE_COMPONENTS.DATA, {
      id: routeData.id,
      name: routeData.name,
      stopIds: [...routeData.stopIds],
      color: routeData.color,
      isActive: true,
      loop: routeData.loop,
    });
  }

  /**
   * Создать автобус из данных сохранения
   */
  private createBusFromSave(busData: SavedBus): void {
    // Для упрощения создаём автобус на первой остановке маршрута
    // В будущем можно восстановить точную позицию
    const entityId = entityManagerService.createEntity();
    if (entityId === -1) return;

    entityManagerService.addComponent(entityId, BUS_COMPONENTS.POSITION, {
      x: 0, // Будет установлено системой при загрузке
      y: 0,
      rotation: 0,
    });

    entityManagerService.addComponent(entityId, BUS_COMPONENTS.VELOCITY, {
      speed: 0,
      maxSpeed: 150,
      acceleration: 50,
      isMoving: false,
    });

    entityManagerService.addComponent(entityId, BUS_COMPONENTS.DATA, {
      id: busData.id,
      routeId: busData.routeId,
      currentStopIndex: busData.currentStopIndex,
      state: 'idle' as any,
      capacity: 20,
      passengers: busData.passengers,
      color: '#ffcc00',
      waitTimer: 0,
      waitTimeRequired: 3.0,
    });

    // Отправляем событие для обновления счётчика в GameStateStore
    gameEventBusService.publish(GameEventType.BUS_CREATED, { busId: busData.id, entityId });
  }
}

// Экспорт единственного экземпляра
export const mapSaveService = new MapSaveService();
