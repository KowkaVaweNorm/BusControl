import { useEffect, useState } from 'react';
import { mapEditorService, EditorMode } from '@/features/map-editor/model/MapEditorService';
import cls from './Toolbar.module.scss';

export const Toolbar = () => {
  const [currentMode, setCurrentMode] = useState<EditorMode>(mapEditorService.getMode());

  useEffect(() => {
    // Таймер для обновления состояния режима (если вдруг изменилось извне)
    const interval = setInterval(() => {
      setCurrentMode(mapEditorService.getMode());
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleSetMode = (mode: EditorMode) => {
    mapEditorService.setMode(mode);
    setCurrentMode(mode);
  };

  return (
    <div className={cls.toolbar}>
      <div className={cls.section}>
        <span className={cls.title}>Режимы:</span>
        <button
          className={`${cls.button} ${currentMode === EditorMode.IDLE ? cls.active : ''}`}
          onClick={() => handleSetMode(EditorMode.IDLE)}
        >
          🖱️ Просмотр
        </button>
        <button
          className={`${cls.button} ${currentMode === EditorMode.PLACING_STOP ? cls.active : ''}`}
          onClick={() => handleSetMode(EditorMode.PLACING_STOP)}
        >
          🚏 Остановки
        </button>
        <button
          className={`${cls.button} ${currentMode === EditorMode.DRAWING_ROUTE ? cls.active : ''}`}
          onClick={() => handleSetMode(EditorMode.DRAWING_ROUTE)}
        >
          🛣️ Маршруты
        </button>
      </div>

      <div className={cls.hint}>
        💡 ЛКМ по остановке — редактировать | Клик по маршруту — управление
      </div>
    </div>
  );
};
