/**
 * StopEditorService
 *
 * Сервис управления редактором остановок.
 * Отвечает за открытие/закрытие панели редактирования,
 * сохранение изменений в остановку.
 *
 * @module features/stop-editor/model
 */

import { entityManagerService } from '@/shared/lib/game-core/EntityManagerService';
import { STOP_COMPONENTS, type StopDataComponent, type SpawnRates } from '@/entities/stop/model/StopComponents';
import { gameEventBusService } from '@/shared/lib/game-core/GameEventBusService';

export enum StopEditorEventType {
  OPENED = 'stop_editor:opened',
  CLOSED = 'stop_editor:closed',
  UPDATED = 'stop_editor:updated',
}

export interface StopEditorOpenedEvent {
  stopId: string;
}

export interface StopEditorUpdatedEvent {
  stopId: string;
  name?: string;
  spawnRates?: SpawnRates;
}

export class StopEditorService {
  private selectedStopId: string | null = null;
  private isOpen: boolean = false;

  /**
   * Открыть редактор остановки
   */
  public open(stopId: string): void {
    if (this.selectedStopId === stopId && this.isOpen) {
      return; // Уже открыт
    }

    this.selectedStopId = stopId;
    this.isOpen = true;

    gameEventBusService.publish(StopEditorEventType.OPENED as any, {
      stopId,
    } as StopEditorOpenedEvent);
  }

  /**
   * Закрыть редактор
   */
  public close(): void {
    if (!this.isOpen) return;

    const oldStopId = this.selectedStopId;
    this.selectedStopId = null;
    this.isOpen = false;

    if (oldStopId) {
      gameEventBusService.publish(StopEditorEventType.CLOSED as any, {
        stopId: oldStopId,
      });
    }
  }

  /**
   * Обновить название остановки
   */
  public updateStopName(name: string): void {
    if (!this.selectedStopId) return;

    const stopEntity = this.getStopEntity();
    if (stopEntity === null) return;

    const data = entityManagerService.getComponent<StopDataComponent>(
      stopEntity,
      STOP_COMPONENTS.DATA
    );

    if (data) {
      data.name = name;

      gameEventBusService.publish(StopEditorEventType.UPDATED as any, {
        stopId: this.selectedStopId,
        name,
      } as StopEditorUpdatedEvent);
    }
  }

  /**
   * Обновить настройки спавна
   */
  public updateSpawnRates(spawnRates: SpawnRates): void {
    if (!this.selectedStopId) return;

    const stopEntity = this.getStopEntity();
    if (stopEntity === null) return;

    const data = entityManagerService.getComponent<StopDataComponent>(
      stopEntity,
      STOP_COMPONENTS.DATA
    );

    if (data) {
      data.spawnRates = { ...spawnRates };

      gameEventBusService.publish(StopEditorEventType.UPDATED as any, {
        stopId: this.selectedStopId,
        spawnRates,
      } as StopEditorUpdatedEvent);
    }
  }

  /**
   * Получить ID выбранной остановки
   */
  public getSelectedStopId(): string | null {
    return this.selectedStopId;
  }

  /**
   * Проверить, открыт ли редактор
   */
  public getIsOpen(): boolean {
    return this.isOpen;
  }

  /**
   * Получить данные выбранной остановки
   */
  public getStopData(): StopDataComponent | null {
    if (!this.selectedStopId) {
      return null;
    }

    const stopEntity = this.getStopEntity();
    if (stopEntity === null) {
      return null;
    }

    return entityManagerService.getComponent<StopDataComponent>(
      stopEntity,
      STOP_COMPONENTS.DATA
    );
  }

  /**
   * Получить текущее количество пассажиров на остановке
   */
  public getWaitingPassengers(): number {
    const data = this.getStopData();
    if (!data) return 0;
    return data.waitingPassengers;
  }

  /**
   * Получить сущность остановки
   */
  private getStopEntity(): number | null {
    if (!this.selectedStopId) {
      return null;
    }

    const stopEntities = entityManagerService.getEntitiesWithComponents(
      STOP_COMPONENTS.DATA
    );

    for (const entityId of stopEntities) {
      const data = entityManagerService.getComponent<StopDataComponent>(
        entityId,
        STOP_COMPONENTS.DATA
      );

      if (data && data.id === this.selectedStopId) {
        return entityId;
      }
    }

    return null;
  }

  /**
   * Очистка сервиса
   */
  public cleanup(): void {
    this.selectedStopId = null;
    this.isOpen = false;
  }
}

// Экспорт единственного экземпляра
export const stopEditorService = new StopEditorService();
