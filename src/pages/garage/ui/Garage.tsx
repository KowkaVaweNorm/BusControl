import { useState, useEffect } from 'react';
import { BusCard } from './BusCard';
import { playerProgressService } from '@/features/player-progress/model/PlayerProgressService';
import { gameStateStore } from '@/app/store/GameStateStore';
import {
  BUS_TYPES_CONFIG,
  getBaseUpgradeCost,
  getMaxUpgradeLevel,
} from '@/entities/Bus/model/BusTypes';
import type { BusData } from '../model/types';
import type { BusTypeId } from '@/entities/Bus/model/BusTypes';
import cls from './Garage.module.scss';

interface GarageProps {
  onBack: () => void;
}

/**
 * Преобразовать данные из PlayerProgress в BusData для UI
 */
function convertToBusData(
  busTypeId: string,
  level: number,
  isPurchased: boolean,
  isActive: boolean,
  totalIncome: number,
  index: number
): BusData {
  const config = BUS_TYPES_CONFIG.find((c) => c.id === busTypeId);
  if (!config) {
    throw new Error(`Unknown bus type: ${busTypeId}`);
  }

  const nextUpgradeCost = level < getMaxUpgradeLevel() ? getBaseUpgradeCost(level + 1) : 0;

  return {
    busTypeId: busTypeId as BusTypeId,
    id: `bus_${index}`,
    name: config.name,
    icon: config.icon,
    capacity: config.baseCapacity,
    speed: config.baseSpeed,
    comfort: config.comfort,
    level,
    maxLevel: getMaxUpgradeLevel(),
    upgradeCost: nextUpgradeCost,
    isPurchased,
    isActive,
    totalIncome,
    basePrice: config.basePrice,
  };
}

/**
 * Страница гаража (автопарк)
 */
export const Garage = ({ onBack }: GarageProps) => {
  const [balance, setBalance] = useState(playerProgressService.getBalance());
  const [buses, setBuses] = useState<BusData[]>([]);
  const [_busCounts, setBusCounts] = useState<Map<string, number>>(new Map());
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Загрузка данных при монтировании и при изменении reloadTrigger
  useEffect(() => {
    const loadData = () => {
      const currentBalance = playerProgressService.getBalance();
      setBalance(currentBalance);

      const purchasedBuses = playerProgressService.getPurchasedBuses();
      const counts = playerProgressService.getBusCountsByType();
      setBusCounts(counts);

      // Генерируем список всех типов автобусов (купленные + доступные для покупки)
      const allBuses: BusData[] = BUS_TYPES_CONFIG.map((config, index) => {
        const purchasedBus = purchasedBuses.find((b) => b.busTypeId === config.id);
        const typeLevel = playerProgressService.getBusTypeLevel(config.id);

        if (purchasedBus) {
          // Купленный автобус (показываем один раз для типа)
          return convertToBusData(
            config.id,
            typeLevel,
            true,
            false,
            0,
            index
          );
        } else {
          // Не куплен — показываем как доступный для покупки
          return convertToBusData(
            config.id,
            0,
            false,
            false,
            0,
            index
          );
        }
      });

      setBuses(allBuses);
    };

    loadData();

    // Подписка на изменения баланса из gameStateStore для обновления данных
    const unsubBalance = gameStateStore.subscribe((state) => {
      setBalance(state.money);
      // Перезагружаем данные автобусов при изменении баланса
      setReloadTrigger(prev => prev + 1);
    });

    return () => {
      unsubBalance();
    };
  }, [reloadTrigger]); // Перезагрузка при изменении reloadTrigger

  /**
   * Купить автобус
   */
  const handleBuyBus = (busTypeId: string) => {
    const config = BUS_TYPES_CONFIG.find((c) => c.id === busTypeId);
    if (!config) return;

    const currentBalance = playerProgressService.getBalance();
    if (currentBalance < config.basePrice) {
      alert(`❌ Недостаточно средств! Нужно ${config.basePrice}₽, у вас ${currentBalance}₽`);
      return;
    }

    // Покупаем через PlayerProgressService (он сам изменит баланс и сохранит)
    playerProgressService.buyBus(busTypeId as BusTypeId, config.basePrice);

    // Синхронизируем gameStateStore с playerProgressService
    gameStateStore.setBalance(playerProgressService.getBalance());

    // Триггерим перезагрузку данных
    setReloadTrigger(prev => prev + 1);
  };

  /**
   * Прокачать тип автобуса (глобально для всех автобусов этого типа)
   */
  const handleUpgradeType = (busTypeId: string) => {
    const currentLevel = playerProgressService.getBusTypeLevel(busTypeId);
    const upgradeCost = getBaseUpgradeCost(currentLevel + 1);

    const currentBalance = playerProgressService.getBalance();
    if (currentBalance < upgradeCost) {
      alert('❌ Недостаточно средств!');
      return;
    }

    // Прокачиваем тип через PlayerProgressService
    const success = playerProgressService.upgradeBusType(busTypeId, upgradeCost);

    if (success) {
      // Синхронизируем gameStateStore с playerProgressService
      gameStateStore.setBalance(playerProgressService.getBalance());

      // Триггерим перезагрузку данных
      setReloadTrigger(prev => prev + 1);
    }
  };

  return (
    <div className={cls.page}>
      <div className={cls.ticket}>
        {/* Шапка билета - всегда видна */}
        <div className={cls.ticketHeader}>
          <div className={cls.routeName}>
            <h1>АВТОПАРК</h1>
          </div>
          <div className={cls.headerActions}>
            {/* Баланс */}
            <div className={cls.balance}>
              <span className={cls.balanceIcon}>🪙</span>
              <span className={cls.balanceValue}>{balance}₽</span>
            </div>
            <button className={cls.backBtn} onClick={onBack}>
              ← НАЗАД
            </button>
          </div>
        </div>

        {/* Сетка автобусов - скроллится если не помещается */}
        <div className={cls.fleetGrid}>
          {buses.map((bus) => {
            const count = _busCounts.get(bus.busTypeId) || 0;
            return (
              <BusCard
                key={bus.id}
                bus={bus}
                balance={balance}
                count={count}
                onBuy={() => handleBuyBus(bus.busTypeId)}
                onUpgradeType={() => handleUpgradeType(bus.busTypeId)}
              />
            );
          })}
        </div>

        {/* Нижняя панель - всегда видна */}
        <div className={cls.ticketFooter}>
          <div className={cls.stub}>
            * покупайте и прокачивайте автобусы для увеличения дохода *
          </div>
        </div>
      </div>
    </div>
  );
};
