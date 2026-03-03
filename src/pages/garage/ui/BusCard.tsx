import type { BusData } from '../model';
import cls from './BusCard.module.scss';

interface BusCardProps {
  bus: BusData;
  balance: number;
  onUpgrade: (busId: string) => void;
}

/**
 * Карточка автобуса в автопарке
 */
export const BusCard = ({ bus, balance, onUpgrade }: BusCardProps) => {
  const progressPercent = (bus.level / bus.maxLevel) * 100;
  const progressBarClass = cls[`progressFill${bus.level <= 2 ? 'Easy' : bus.level <= 4 ? 'Medium' : 'Hard'}`];
  const canUpgrade = bus.level < bus.maxLevel && balance >= bus.upgradeCost;
  const isMaxLevel = bus.level >= bus.maxLevel;

  const handleUpgrade = () => {
    if (canUpgrade) {
      onUpgrade(bus.id);
    }
  };

  return (
    <div className={cls.busCard}>
      <div className={cls.busHeader}>
        <span className={cls.busIcon}>{bus.icon}</span>
        <span className={cls.busTitle}>{bus.name}</span>
      </div>

      <div className={cls.busDetails}>
        <div className={cls.detailRow}>
          <span className={cls.detailLabel}>Вместимость</span>
          <span className={cls.detailValue}>{bus.capacity} чел.</span>
        </div>
        <div className={cls.detailRow}>
          <span className={cls.detailLabel}>Скорость</span>
          <span className={cls.detailValue}>{bus.speed} км/ч</span>
        </div>
        <div className={cls.detailRow}>
          <span className={cls.detailLabel}>Комфорт</span>
          <span className={cls.detailValue}>{bus.comfort}</span>
        </div>
      </div>

      <div className={cls.progress}>
        <div className={cls.progressLabel}>
          <span>Прокачка</span>
          <span className={cls.levelText}>
            {bus.level}/{bus.maxLevel}
          </span>
        </div>
        <div className={cls.progressBar}>
          <div
            className={`${progressBarClass} ${cls.progressFill}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {!isMaxLevel && (
        <button
          className={cls.upgradeBtn}
          onClick={handleUpgrade}
          disabled={!canUpgrade}
        >
          🚀 ПРОКАЧАТЬ ({bus.upgradeCost})
        </button>
      )}
    </div>
  );
};
