import { useState, useEffect } from 'react';
import { routeEditorService, type BusGroup } from '@/features/route-editor';
import cls from './RouteEditor.module.scss';

export const RouteEditor = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [busGroups, setBusGroups] = useState<BusGroup[]>([]);

  useEffect(() => {
    // Подписка на открытие редактора
    const interval = setInterval(() => {
      const wasOpen = isOpen;
      const nowOpen = routeEditorService.getIsOpen();

      if (nowOpen && !wasOpen) {
        // Открыли
        setIsOpen(true);
        const data = routeEditorService.getRouteData();
        if (data) {
          setRouteName(data.routeName);
          setBusGroups(data.busGroups);
        }
      } else if (!nowOpen && wasOpen) {
        // Закрыли
        setIsOpen(false);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleClose = () => {
    routeEditorService.close();
  };

  const handleAddBus = (typeId: string) => {
    routeEditorService.addBusToRoute(typeId);
    // Обновляем списки
    const data = routeEditorService.getRouteData();
    if (data) {
      setBusGroups(data.busGroups);
    }
  };

  const handleRemoveBus = (typeId: string) => {
    routeEditorService.removeBusFromRoute(typeId);
    // Обновляем списки
    const data = routeEditorService.getRouteData();
    if (data) {
      setBusGroups(data.busGroups);
    }
  };

  if (!isOpen) return null;

  const totalBuses = busGroups.reduce((sum, g) => sum + g.onRoute, 0);

  return (
    <div className={cls.container}>
      <div className={cls.panel}>
        <div className={cls.header}>
          <h3 className={cls.title}>
            <span>🚌</span>
            Управление маршрутом
          </h3>
          <button className={cls.closeButton} onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className={cls.routeInfo}>
          <div className={cls.routeName}>{routeName}</div>
          <div className={cls.busCount}>
            🚌 {totalBuses} автобус(ов) на маршруте
          </div>
        </div>

        {/* Список типов автобусов */}
        <div className={cls.section}>
          <div className={cls.sectionTitle}>🚌 Автобусы на маршруте:</div>
          {busGroups.length > 0 ? (
            <div className={cls.busList}>
              {busGroups.map((group) => (
                <div key={group.typeId} className={cls.busGroupItem}>
                  <div className={cls.busGroupInfo}>
                    <div className={cls.busGroupHeader}>
                      <span className={cls.busName}>{group.typeName}</span>
                      <span className={cls.busCountBadge}>
                        {group.onRoute} / {group.total}
                      </span>
                    </div>
                    <div className={cls.busGroupStats}>
                      👥 {group.capacity} | ⚡ {group.speed} | 🔼 Lvl {group.level}
                    </div>
                  </div>
                  <div className={cls.busGroupControls}>
                    <button
                      className={`${cls.controlButton} ${cls.removeButton}`}
                      onClick={() => handleRemoveBus(group.typeId)}
                      disabled={group.onRoute <= 0}
                      title="Убрать 1 автобус"
                    >
                      −
                    </button>
                    <button
                      className={`${cls.controlButton} ${cls.addButton}`}
                      onClick={() => handleAddBus(group.typeId)}
                      disabled={group.onRoute >= group.total}
                      title="Добавить 1 автобус"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={cls.empty}>Нет автобусов</div>
          )}
        </div>

        <div className={cls.footer}>
          <div className={cls.footerText}>
            💡 Кнопки +/− добавляют или убирают по одному автобусу
          </div>
          <button className={cls.saveButton} onClick={handleClose}>
            💾 Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
