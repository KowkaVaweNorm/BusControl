import { getRouteColorByDifficulty } from '../model';
import type { CityData } from '../model';
import cls from './MapPreview.module.scss';

interface MapPreviewProps {
  city: CityData | null;
}

/**
 * Компонент предпросмотра карты (SVG)
 * Рисует схематичную карту города с остановками
 */
export const MapPreview = ({ city }: MapPreviewProps) => {
  if (!city) {
    return (
      <div className={cls.mapContainer}>
        <div className={cls.mapHeader}>СХЕМА ГОРОДА</div>
        <div className={cls.mapSvg}>
          <span className={cls.placeholder}>Выберите город</span>
        </div>
      </div>
    );
  }

  const lineColor = getRouteColorByDifficulty(city.difficulty);
  const radius = city.stops > 15 ? 4 : 6;

  const width = 450;
  const height = 130;
  const startX = 50;
  const endX = width - 50;
  const y = 70;

  // Генерируем кружки остановок
  const circles = [];
  if (city.stops === 1) {
    const cx = (startX + endX) / 2;
    circles.push(
      <circle key="stop-0" cx={cx} cy={y} r={radius} fill="#333" stroke="#111" strokeWidth="1.5" />
    );
  } else {
    for (let i = 0; i < city.stops; i++) {
      const x = startX + (i / (city.stops - 1)) * (endX - startX);
      circles.push(
        <circle
          key={`stop-${i}`}
          cx={x}
          cy={y}
          r={radius}
          fill="#333"
          stroke="#111"
          strokeWidth="1.5"
        />
      );
    }
  }

  return (
    <div className={cls.mapContainer}>
      <div className={cls.mapHeader}>СХЕМА ГОРОДА</div>
      <div className={cls.mapSvg}>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ display: 'block', background: 'transparent' }}
        >
          {/* Линия маршрута (пунктирная) */}
          <line
            x1={startX}
            y1={y}
            x2={endX}
            y2={y}
            stroke={lineColor}
            strokeWidth="4"
            strokeDasharray="6 4"
          />
          {/* Остановки */}
          {circles}
          {/* Подписи */}
          <text
            x="10"
            y="25"
            fontFamily="'Source Code Pro', monospace"
            fontSize="12"
            fill="#333"
            fontWeight="600"
          >
            {city.name}
          </text>
          <text x="10" y="45" fontFamily="'Source Code Pro', monospace" fontSize="10" fill="#333">
            остановок: {city.stops}
          </text>
          <text
            x={width - 80}
            y="25"
            fontFamily="'Source Code Pro', monospace"
            fontSize="10"
            fill="#333"
            fontWeight="500"
          >
            маршрутов: {city.routes}
          </text>
          <text
            x={width - 80}
            y="45"
            fontFamily="'Source Code Pro', monospace"
            fontSize="10"
            fill="#333"
          >
            сложн. {city.difficulty}
          </text>
        </svg>
      </div>
    </div>
  );
};
