import type { BusData } from '../model';
import { getUpgradeDescription, getIncomeMultiplier } from '@/entities/Bus/model/BusTypes';
import cls from './BusCard.module.scss';

interface BusCardProps {
  bus: BusData;
  balance: number;
  count: number; // Количество автобусов этого типа
  onBuy: () => void;
  onUpgradeType: () => void; // Прокачка типа (глобально)
}

/**
 * Карточка автобуса в автопарке
 */
export const BusCard = ({ bus, balance, count, onBuy, onUpgradeType }: BusCardProps) => {
  const progressPercent = (bus.level / bus.maxLevel) * 100;
  const progressBarClass = cls[`progressFill${bus.level <= 2 ? 'Easy' : bus.level <= 4 ? 'Medium' : 'Hard'}`];
  
  const canUpgrade = bus.level < bus.maxLevel && balance >= bus.upgradeCost;
  const isMaxLevel = bus.level >= bus.maxLevel;
  const canAfford = balance >= bus.basePrice;
  const currentMultiplier = getIncomeMultiplier(bus.busTypeId, bus.level);
  const nextMultiplier = bus.level < bus.maxLevel 
    ? getIncomeMultiplier(bus.busTypeId, bus.level + 1) 
    : currentMultiplier;
  const upgradeDesc = bus.level < bus.maxLevel 
    ? getUpgradeDescription(bus.busTypeId, bus.level + 1) 
    : 'Максимальный уровень';

  const handleUpgrade = () => {
    if (canUpgrade) {
      onUpgradeType();
    }
  };

  const handleBuy = () => {
    if (canAfford) {
      onBuy();
    }
  };

  return (
    <div className={`${cls.busCard} ${!bus.isPurchased ? cls.unpurchased : ''}`}>
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
          <span className={cls.detailValue}>{bus.speed}</span>
        </div>
        <div className={cls.detailRow}>
          <span className={cls.detailLabel}>Комфорт</span>
          <span className={cls.detailValue}>{bus.comfort}</span>
        </div>
        {bus.isPurchased && (
          <>
            <div className={cls.detailRow}>
              <span className={cls.detailLabel}>Доход</span>
              <span className={cls.detailValue}>x{currentMultiplier.toFixed(1)}</span>
            </div>
            <div className={cls.detailRow}>
              <span className={cls.detailLabel}>Количество</span>
              <span className={cls.detailValue}>{count} шт.</span>
            </div>
          </>
        )}
      </div>

      {!bus.isPurchased ? (
        // Кнопка КУПИТЬ (первый автобус типа)
        <button
          className={`${cls.buyBtn} ${!canAfford ? cls.disabled : ''}`}
          onClick={handleBuy}
          disabled={!canAfford}
        >
          💰 КУПИТЬ ({bus.basePrice}₽)
        </button>
      ) : (
        <>
          {/* Информация о количестве */}
          <div className={cls.ownedInfo}>
            <span className={cls.ownedLabel}>В автопарке:</span>
            <span className={cls.ownedCount}>{count} шт.</span>
          </div>

          {/* Кнопка КУПИТЬ ЕЩЁ */}
          <button
            className={`${cls.buyMoreBtn} ${!canAfford ? cls.disabled : ''}`}
            onClick={handleBuy}
            disabled={!canAfford}
          >
            💰 КУПИТЬ ЕЩЁ ({bus.basePrice}₽)
          </button>

          {/* Прогресс прокачки */}
          <div className={cls.progress}>
            <div className={cls.progressLabel}>
              <span>Прокачка типа</span>
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

          {/* Описание следующего улучшения */}
          <div className={cls.upgradeInfo}>
            <span className={cls.upgradeDesc}>
              {bus.level < bus.maxLevel ? `+${((nextMultiplier - currentMultiplier) * 100).toFixed(0)}% к доходу` : ''}
            </span>
            <span className={cls.upgradeName}>{upgradeDesc}</span>
          </div>

          {/* Кнопка ПРОКАЧАТЬ ТИП */}
          {!isMaxLevel && (
            <button
              className={`${cls.upgradeBtn} ${!canUpgrade ? cls.disabled : ''}`}
              onClick={handleUpgrade}
              disabled={!canUpgrade}
            >
              🚀 ПРОКАЧАТЬ ({bus.upgradeCost}₽)
            </button>
          )}

          {/* Статус "МАКС. УРОВЕНЬ" */}
          {isMaxLevel && (
            <div className={cls.maxLevelBadge}>
              ✨ МАКС. УРОВЕНЬ
            </div>
          )}
        </>
      )}
    </div>
  );
};
