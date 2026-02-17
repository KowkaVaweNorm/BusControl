/**
 * EntityManagerService
 *
 * Реализует паттерн ECS (Entity-Component-System) для управления
 * игровыми объектами. Сущности — это просто ID, компоненты — данные,
 * системы — логика. Это позволяет легко добавлять новые типы объектов
 * без изменения существующего кода.
 *
 * @module shared/lib/game-core
 */

// ============================================
// Базовые типы ECS
// ============================================

/**
 * ID сущности (просто число)
 */
export type EntityId = number;

/**
 * Базовый интерфейс для всех компонентов
 * Компоненты должны быть простыми объектами данных (POJO)
 */
export interface Component {
  [key: string]: unknown;
}

/**
 * Тип компонента (строковый идентификатор)
 */
export type ComponentType = string;

/**
 * Контекст системы, передается в update
 */
export interface SystemContext {
  deltaTime: number;
  entityManager: EntityManagerService;
}

/**
 * Интерфейс системы
 */
export interface System {
  /** Уникальное имя системы */
  name: string;
  /** Список требуемых компонентов для работы системы */
  requiredComponents: ComponentType[];
  /** Метод обновления (вызывается каждый тик логики) */
  update: (context: SystemContext, entities: EntityId[]) => void;
  /** Опциональный метод инициализации */
  initialize?: () => void;
  /** Опциональный метод очистки */
  destroy?: () => void;
}

/**
 * Конфигурация менеджера сущностей
 */
export interface EntityManagerConfig {
  /** Начальный размер пула ID (оптимизация) */
  initialPoolSize: number;
  /** Максимальное количество сущностей */
  maxEntities: number;
}

// ============================================
// Менеджер сущностей
// ============================================

export class EntityManagerService {
  private nextEntityId: EntityId = 0;
  private entities: Set<EntityId> = new Set();
  private components: Map<EntityId, Map<ComponentType, Component>> = new Map();
  private systems: Map<string, System> = new Map();
  private isInitialized: boolean = false;

  private readonly config: EntityManagerConfig;

  constructor(config?: Partial<EntityManagerConfig>) {
    this.config = {
      initialPoolSize: config?.initialPoolSize ?? 1000,
      maxEntities: config?.maxEntities ?? 10000,
    };
  }

  /**
   * Инициализация менеджера
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.warn('[EntityManagerService] Already initialized');
      return;
    }

    // Предварительное выделение памяти для компонентов
    this.nextEntityId = 0;
    this.entities.clear();
    this.components.clear();

    this.isInitialized = true;
    console.log('[EntityManagerService] Initialized');
  }

  /**
   * Создание новой сущности
   * @returns ID новой сущности
   */
  public createEntity(): EntityId {
    if (this.entities.size >= this.config.maxEntities) {
      console.error('[EntityManagerService] Max entities limit reached');
      return -1;
    }

    const entityId = this.nextEntityId++;
    this.entities.add(entityId);
    this.components.set(entityId, new Map());

    return entityId;
  }

  /**
   * Удаление сущности и всех её компонентов
   */
  public destroyEntity(entityId: EntityId): void {
    if (!this.entities.has(entityId)) {
      console.warn('[EntityManagerService] Entity not found:', entityId);
      return;
    }

    this.entities.delete(entityId);
    this.components.delete(entityId);
  }

  /**
   * Проверка существования сущности
   */
  public hasEntity(entityId: EntityId): boolean {
    return this.entities.has(entityId);
  }

  /**
   * Добавление компонента сущности
   */
  public addComponent<T extends Component>(
    entityId: EntityId,
    componentType: ComponentType,
    componentData: T
  ): void {
    if (!this.entities.has(entityId)) {
      console.error('[EntityManagerService] Cannot add component: Entity not found:', entityId);
      return;
    }

    const entityComponents = this.components.get(entityId);
    if (entityComponents) {
      entityComponents.set(componentType, componentData);
    }
  }

  /**
   * Получение компонента сущности
   */
  public getComponent<T extends Component>(
    entityId: EntityId,
    componentType: ComponentType
  ): T | null {
    const entityComponents = this.components.get(entityId);
    if (!entityComponents) {
      return null;
    }

    return (entityComponents.get(componentType) as T) ?? null;
  }

  /**
   * Проверка наличия компонента у сущности
   */
  public hasComponent(entityId: EntityId, componentType: ComponentType): boolean {
    const entityComponents = this.components.get(entityId);
    if (!entityComponents) {
      return false;
    }

    return entityComponents.has(componentType);
  }

  /**
   * Удаление компонента сущности
   */
  public removeComponent(entityId: EntityId, componentType: ComponentType): void {
    const entityComponents = this.components.get(entityId);
    if (entityComponents) {
      entityComponents.delete(componentType);
    }
  }

  /**
   * Обновление компонента (слияние с существующим)
   */
  public updateComponent<T extends Component>(
    entityId: EntityId,
    componentType: ComponentType,
    updates: Partial<T>
  ): void {
    const existingComponent = this.getComponent<T>(entityId, componentType);
    if (existingComponent) {
      Object.assign(existingComponent, updates);
    } else {
      console.warn('[EntityManagerService] Cannot update component: Not found:', componentType);
    }
  }

  /**
   * Получение всех сущностей с указанными компонентами
   * (используется системами для фильтрации)
   */
  public getEntitiesWithComponents(...componentTypes: ComponentType[]): EntityId[] {
    const result: EntityId[] = [];

    for (const entityId of this.entities) {
      const entityComponents = this.components.get(entityId);
      if (!entityComponents) {
        continue;
      }

      const hasAllComponents = componentTypes.every((type) => entityComponents.has(type));
      if (hasAllComponents) {
        result.push(entityId);
      }
    }

    return result;
  }

  /**
   * Получение всех сущностей
   */
  public getAllEntities(): EntityId[] {
    return Array.from(this.entities);
  }

  /**
   * Получение количества сущностей
   */
  public getEntityCount(): number {
    return this.entities.size;
  }

  // ============================================
  // Управление системами
  // ============================================

  /**
   * Регистрация системы
   */
  public registerSystem(system: System): void {
    if (this.systems.has(system.name)) {
      console.warn('[EntityManagerService] System already registered:', system.name);
      return;
    }

    this.systems.set(system.name, system);

    if (system.initialize) {
      try {
        system.initialize();
      } catch (error) {
        console.error('[EntityManagerService] System initialize error:', system.name, error);
      }
    }

    console.log('[EntityManagerService] System registered:', system.name);
  }

  /**
   * Удаление системы
   */
  public unregisterSystem(systemName: string): void {
    const system = this.systems.get(systemName);
    if (system) {
      if (system.destroy) {
        try {
          system.destroy();
        } catch (error) {
          console.error('[EntityManagerService] System destroy error:', systemName, error);
        }
      }
      this.systems.delete(systemName);
      console.log('[EntityManagerService] System unregistered:', systemName);
    }
  }

  /**
   * Обновление всех систем (вызывается из GameLoop)
   */
  public updateSystems(deltaTime: number): void {
    if (!this.isInitialized) {
      return;
    }

    const context: SystemContext = {
      deltaTime,
      entityManager: this,
    };

    for (const system of this.systems.values()) {
      try {
        const entities = this.getEntitiesWithComponents(...system.requiredComponents);
        system.update(context, entities);
      } catch (error) {
        console.error('[EntityManagerService] System update error:', system.name, error);
      }
    }
  }

  /**
   * Очистка всех сущностей и систем
   */
  public cleanup(): void {
    // Уничтожение всех систем
    for (const system of this.systems.values()) {
      if (system.destroy) {
        try {
          system.destroy();
        } catch (error) {
          console.error('[EntityManagerService] System cleanup error:', system.name, error);
        }
      }
    }

    this.systems.clear();
    this.entities.clear();
    this.components.clear();
    this.nextEntityId = 0;
    this.isInitialized = false;

    console.log('[EntityManagerService] Cleaned up');
  }

  /**
   * Геттеры состояния
   */
  public getIsInitialized(): boolean {
    return this.isInitialized;
  }

  public getSystem(systemName: string): System | undefined {
    return this.systems.get(systemName);
  }

  public getConfig(): EntityManagerConfig {
    return { ...this.config };
  }

  /**
   * Очистка всех систем (важно для React Strict Mode!)
   */
  public clearSystems(): void {
    this.systems.forEach((system) => {
      if (system.destroy) {
        try {
          system.destroy();
        } catch (error) {
          console.error('[EntityManagerService] System destroy error:', system.name, error);
        }
      }
    });
    this.systems.clear();
    console.log('[EntityManagerService] Systems cleared');
  }
}

// Экспорт единственного экземпляра для использования в приложении
export const entityManagerService = new EntityManagerService();
