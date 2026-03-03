import { useState, useEffect } from 'react';
import { CITIES_DATA, getCityById, getPresetByCityId } from '../model';
import { MapPreview } from './MapPreview';
import cls from './Menu.module.scss';

const STORAGE_KEY_SELECTED_MAP = 'bus_control_selected_map';

interface MenuProps {
  onStart: (mapId: string) => void;
  onGarage: () => void;
  onSettings: () => void;
}

/**
 * Главное меню в стиле билета/чека
 */
export const Menu = ({ onStart, onGarage, onSettings: _onSettings }: MenuProps) => {
  const [selectedCityId, setSelectedCityId] = useState<string>(() => {
    // Загружаем последний выбранный город из localStorage
    const saved = localStorage.getItem(STORAGE_KEY_SELECTED_MAP);
    return saved || 'tutorial';
  });
  const [volume, setVolume] = useState(80);

  const selectedCity = getCityById(selectedCityId) ?? null;

  useEffect(() => {
    // Сохраняем выбранный город при изменении
    localStorage.setItem(STORAGE_KEY_SELECTED_MAP, selectedCityId);
  }, [selectedCityId]);

  const handleCitySelect = (cityId: string) => {
    setSelectedCityId(cityId);
  };

  const handleStart = () => {
    if (selectedCity) {
      const presetId = getPresetByCityId(selectedCityId);
      if (presetId) {
        onStart(presetId);
      }
    }
  };

  const getVolumeIcon = (val: number) => {
    if (val === 0) return '🔇';
    if (val < 30) return '🔈';
    if (val < 70) return '🔉';
    return '🔊';
  };

  return (
    <div className={cls.page}>
      <div className={cls.ticket}>
        {/* Шапка билета */}
        <div className={cls.ticketHeader}>
          <div className={cls.routeName}>
            <h1>BUS CONTROL</h1>
          </div>
          <div className={cls.controls}>
            <div className={cls.volume}>
              <span className={cls.volumeIcon}>{getVolumeIcon(volume)}</span>
              <input
                type="range"
                className={cls.volumeSlider}
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
              />
            </div>
            <button className={cls.fleetBtn} onClick={onGarage}>
              🚌 АВТОПАРК
            </button>
          </div>
        </div>

        {/* Таблица городов */}
        <div className={cls.routesSection}>
          <div className={cls.routesHeader}>
            <span>ГОРОД</span>
            <span>ОСТАНОВОК</span>
            <span>МАРШРУТОВ</span>
            <span>СЛОЖН.</span>
          </div>
          <div className={cls.routesList}>
            {CITIES_DATA.map((city) => (
              <div
                key={city.id}
                className={`${cls.routeRow} ${selectedCityId === city.id ? cls.selected : ''}`}
                onClick={() => handleCitySelect(city.id)}
              >
                <span className={cls.routeNameText}>{city.name}</span>
                <span className={cls.routeStops}>{city.stops}</span>
                <span className={cls.routeRoutes}>{city.routes}</span>
                <span className={cls.routeDiff}>{city.difficulty}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Блок карты */}
        <MapPreview city={selectedCity} />

        {/* Нижняя панель */}
        <div className={cls.ticketFooter}>
          <div className={cls.selectedInfo}>
            <span className={cls.label}>ВЫБРАН:</span>
            {selectedCity ? (
              <>
                <span className={cls.value}>{selectedCity.name}</span>
                <span className={cls.value}>{selectedCity.stops}</span>
                <span className={cls.value}>{selectedCity.routes}</span>
                <span className={cls.value}>{selectedCity.difficulty}</span>
              </>
            ) : (
              <span className={cls.value}>—</span>
            )}
          </div>
          <button className={cls.startBtn} onClick={handleStart} disabled={!selectedCity}>
            НАЧАТЬ
          </button>
        </div>

        <div className={cls.stub}>* сохраните билет до конца поездки *</div>
      </div>
    </div>
  );
};
