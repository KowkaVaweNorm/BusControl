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
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Загрузка данных при монтировании и при изменении reloadTrigger
  useEffect(() => {
    const loadData = () => {
      const currentBalance = playerProgressService.getBalance();
      setBalance(currentBalance);

      const purchasedBuses = playerProgressService.getPurchasedBuses();

      // Генерируем список всех типов автобусов (купленные + доступные для покупки)
      const allBuses: BusData[] = BUS_TYPES_CONFIG.map((config, index) => {
        const purchasedBus = purchasedBuses.find((b) => b.busTypeId === config.id);

        if (purchasedBus) {
          // Купленный автобус
          return convertToBusData(
            config.id,
            purchasedBus.level,
            true,
            purchasedBus.isActive,
            purchasedBus.totalIncome,
            index
          );
        } else {
          // Не куплен — показываем как доступный для покупки
          return convertToBusData(
            config.id,
            1,
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
   * Прокачать автобус
   */
  const handleUpgrade = (busIndex: number) => {
    const bus = buses[busIndex];
    if (!bus || bus.level >= bus.maxLevel) return;

    const currentBalance = playerProgressService.getBalance();
    if (currentBalance < bus.upgradeCost) {
      alert('❌ Недостаточно средств!');
      return;
    }

    // Находим индекс в purchasedBuses
    const purchasedBuses = playerProgressService.getPurchasedBuses();
    const purchasedIndex = purchasedBuses.findIndex((b) => b.busTypeId === bus.busTypeId);

    if (purchasedIndex === -1) return;

    // Прокачиваем через PlayerProgressService
    const success = playerProgressService.upgradeBus(purchasedIndex, bus.upgradeCost);

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
        {/* Шапка билета */}
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

        {/* Сетка автобусов */}
        <div className={cls.fleetGrid}>
          {buses.map((bus, index) => (
            <BusCard
              key={bus.id}
              bus={bus}
              balance={balance}
              onBuy={() => handleBuyBus(bus.busTypeId)}
              onUpgrade={() => handleUpgrade(index)}
            />
          ))}
        </div>

        {/* Нижняя панель */}
        <div className={cls.stub}>
          * покупайте и прокачивайте автобусы для увеличения дохода *
        </div>
      </div>
    </div>
  );
};
