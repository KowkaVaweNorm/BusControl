import { useState } from 'react';
import { BusCard } from './BusCard';
import { MOCK_BUSES, INITIAL_BALANCE } from '../model';
import cls from './Garage.module.scss';

interface GarageProps {
  onBack: () => void;
}

/**
 * Страница гаража (автопарк)
 * Пока что с мок-данными (заглушками)
 */
export const Garage = ({ onBack }: GarageProps) => {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [buses, setBuses] = useState(MOCK_BUSES);

  const handleUpgrade = (busId: string) => {
    const bus = buses.find((b) => b.id === busId);
    if (!bus || bus.level >= bus.maxLevel) return;

    if (balance < bus.upgradeCost) {
      alert('❌ Недостаточно средств!');
      return;
    }

    // Списываем баланс
    setBalance((prev) => prev - bus.upgradeCost);

    // Увеличиваем уровень автобуса
    setBuses((prev) =>
      prev.map((b) =>
        b.id === busId ? { ...b, level: b.level + 1 } : b
      )
    );
  };

  return (
    <div className={cls.page}>
      <div className={cls.ticket}>
        {/* Шапка билета */}
        <div className={cls.ticketHeader}>
          <div className={cls.routeName}>
            <h1>АВТОПАРК</h1>
          </div>
          <div className={cls.headerActions}>
            {/* Баланс */}
            <div className={cls.balance}>
              <span className={cls.balanceIcon}>🪙</span>
              <span className={cls.balanceValue}>{balance}</span>
            </div>
            <button className={cls.backBtn} onClick={onBack}>
              ← НАЗАД
            </button>
          </div>
        </div>

        {/* Сетка автобусов */}
        <div className={cls.fleetGrid}>
          {buses.map((bus) => (
            <BusCard
              key={bus.id}
              bus={bus}
              balance={balance}
              onUpgrade={handleUpgrade}
            />
          ))}
        </div>

        {/* Нижняя панель */}
        <div className={cls.stub}>
          * техника готова к рейсам · баланс пополняется в рейсах *
        </div>
      </div>
    </div>
  );
};
