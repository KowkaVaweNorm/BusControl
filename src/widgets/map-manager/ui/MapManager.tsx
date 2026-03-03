import { useState, useEffect } from 'react';
import { mapSaveService, type PresetMap } from '@/features/map-save';
import cls from './MapManager.module.scss';

export const MapManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [presets, setPresets] = useState<PresetMap[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [mapName, setMapName] = useState('My Map');
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    // Загрузка списка пресетов
    const presetList = mapSaveService.getPresetList();
    setPresets(presetList);

    // Проверка наличия сохранения
    setHasSave(mapSaveService.hasSave());
  }, []);

  const handleLoadPreset = () => {
    if (!selectedPreset) return;

    if (confirm('Загрузка пресета очистит текущую карту. Продолжить?')) {
      const success = mapSaveService.loadPreset(selectedPreset);
      if (success) {
        // Сохраняем пресет как текущую карту
        mapSaveService.saveCurrentMap(mapName);
        setHasSave(true);
      }
    }
  };

  const handleSave = () => {
    mapSaveService.saveCurrentMap(mapName);
    setHasSave(true);
    alert('Карта сохранена!');
  };

  const handleLoad = () => {
    const savedData = mapSaveService.loadFromLocalStorage();
    if (savedData) {
      mapSaveService.loadMap(savedData);
      setMapName(savedData.mapName);
    } else {
      alert('Нет сохранённой карты!');
    }
  };

  const handleClear = () => {
    if (confirm('Вы уверены? Это удалит сохранение и очистит карту.')) {
      mapSaveService.clearLocalStorage();
      setHasSave(false);

      // Очистка всех сущностей
      const confirmReload = confirm('Перезагрузить страницу для применения?');
      if (confirmReload) {
        window.location.reload();
      }
    }
  };

  const handleExport = () => {
    try {
      const jsonString = mapSaveService.exportToJson();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${mapName.replace(/\s+/g, '_')}_map.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Ошибка экспорта: ' + (error as Error).message);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        mapSaveService.importFromJson(jsonString);
        setHasSave(true);
        alert('Карта успешно загружена!');
      } catch (error) {
        alert('Ошибка импорта: ' + (error as Error).message);
      }
    };
    reader.readAsText(file);

    // Сброс input для возможности повторной загрузки того же файла
    event.target.value = '';
  };

  return (
    <div className={cls.container}>
      <button className={cls.toggleButton} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : '🗺️'}
      </button>

      {isOpen && (
        <div className={cls.panel}>
          <h3 className={cls.title}>Управление картой</h3>

          {/* Пресеты */}
          <div className={cls.section}>
            <label className={cls.label}>Загрузить пресет:</label>
            <select
              className={cls.select}
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
            >
              <option value="">-- Выберите пресет --</option>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} (
                  {preset.difficulty === 'easy'
                    ? 'Лёгкий'
                    : preset.difficulty === 'medium'
                      ? 'Средний'
                      : 'Сложный'}
                  )
                </option>
              ))}
            </select>
            <button className={cls.button} onClick={handleLoadPreset} disabled={!selectedPreset}>
              Загрузить
            </button>
          </div>

          <div className={cls.separator}></div>

          {/* Сохранение/Загрузка */}
          <div className={cls.section}>
            <label className={cls.label}>Название карты:</label>
            <input
              type="text"
              className={cls.input}
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              placeholder="My Map"
            />
          </div>

          <div className={cls.section}>
            <button className={cls.button} onClick={handleSave}>
              💾 Сохранить
            </button>
            <button className={cls.button} onClick={handleLoad} disabled={!hasSave}>
              📂 Загрузить
            </button>
            <button
              className={`${cls.button} ${cls.danger}`}
              onClick={handleClear}
              disabled={!hasSave}
            >
              🗑️ Очистить
            </button>
          </div>

          <div className={cls.separator}></div>

          {/* Экспорт/Импорт */}
          <div className={cls.section}>
            <button className={cls.button} onClick={handleExport}>
              📤 Экспорт JSON
            </button>
            <label className={`${cls.button} ${cls.fileInput}`}>
              📥 Импорт JSON
              <input type="file" accept=".json" onChange={handleImport} hidden />
            </label>
          </div>

          {/* Информация */}
          {hasSave && (
            <div className={cls.info}>
              {(() => {
                const metadata = mapSaveService.getSaveMetadata();
                return metadata ? (
                  <>
                    <div>Карта: {metadata.mapName}</div>
                    <div>Остановок: {metadata.stopsCount}</div>
                    <div>Маршрутов: {metadata.routesCount}</div>
                    <div>Автобусов: {metadata.busesCount}</div>
                  </>
                ) : null;
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
