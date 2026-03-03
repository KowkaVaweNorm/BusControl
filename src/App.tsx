import { useEffect, useState } from 'react';
import { GameCanvas, setSelectedMapId } from './widgets/game-canvas';
import { StatsPanel } from './widgets/stats-panel';
import { Toolbar } from './widgets/toolbar';
import { Notifications } from './widgets/notifications';
import { MapManager } from './widgets/map-manager';
import { TimeDisplay } from './widgets/time-display';
import { StopEditor } from './widgets/stop-editor';
import { StopOccupancy } from './widgets/stop-occupancy';
import { CitizenComplaints } from './widgets/citizen-complaints';
import { gameStateStore, type GameState } from './app/store/GameStateStore';
import type { AppScene } from '@/shared/types/app-types';
import { useDeviceCheck } from '@/shared/lib/hooks';

// Страницы
import { Menu, Settings } from './pages/menu';
import { UnsupportedDevice } from './pages/menu';
import { Garage } from './pages/garage';

import './index.css';

/**
 * Корневой компонент приложения
 *
 * Управляет навигацией между страницами:
 * - menu: главное меню
 * - map-select: выбор карты
 * - settings: настройки
 * - garage: автопарк
 * - game: игровой процесс (Canvas + UI виджеты)
 */
function App() {
  const [currentScene, setCurrentScene] = useState<AppScene>(
    gameStateStore.getState().currentScene
  );
  const [showSettings, setShowSettings] = useState(false);

  // Проверка устройства
  const deviceCheck = useDeviceCheck();

  useEffect(() => {
    // Подписка на изменения сцены в GameStateStore
    const unsubscribe = gameStateStore.subscribe((state: GameState) => {
      setCurrentScene(state.currentScene);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Если устройство не поддерживается - показываем заглушку
  if (!deviceCheck.isSupported) {
    return <UnsupportedDevice />;
  }

  // Обработчики навигации
  const handleStartGame = (mapId: string) => {
    // Сохраняем ID выбранной карты для загрузки при инициализации GameCanvas
    setSelectedMapId(mapId);
    gameStateStore.setScene('game');
  };

  const handleSettings = () => {
    setShowSettings(true);
  };

  const handleBackToMenu = () => {
    setShowSettings(false);
    gameStateStore.setScene('menu');
  };

  // Рендеринг в зависимости от текущей сцены
  if (currentScene === 'menu') {
    if (showSettings) {
      return <Settings onBack={handleBackToMenu} />;
    }

    return (
      <Menu
        onStart={handleStartGame}
        onGarage={() => gameStateStore.setScene('garage')}
        onSettings={handleSettings}
      />
    );
  }

  if (currentScene === 'garage') {
    return <Garage onBack={handleBackToMenu} />;
  }

  // currentScene === 'game'
  return (
    <div className="app">
      {/* Слой игры */}
      <GameCanvas />

      {/* Слой UI (HUD) */}
      <StatsPanel />
      <StopOccupancy />
      <CitizenComplaints />
      <Notifications />
      <Toolbar />
      <MapManager />
      <TimeDisplay />
      <StopEditor />
    </div>
  );
}

export default App;
