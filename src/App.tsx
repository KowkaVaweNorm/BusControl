import { useEffect, useState } from 'react';
import { GameCanvas, setSelectedMapId, restartLevel } from './widgets/game-canvas';
import { StatsPanel } from './widgets/stats-panel';
import { Toolbar } from './widgets/toolbar';
import { Notifications } from './widgets/notifications';
import { MapManager } from './widgets/map-manager';
import { TimeDisplay } from './widgets/time-display';
import { StopEditor } from './widgets/stop-editor';
import { StopOccupancy } from './widgets/stop-occupancy';
import { CitizenComplaints, clearRecentComplaints } from './widgets/citizen-complaints';
import { GameOverModal } from './widgets/game-over';
import { DeveloperIndicator } from './widgets/developer-indicator';
import { RouteEditor } from './widgets/route-editor';
import { gameStateStore, type GameState } from './app/store/GameStateStore';
import { gameLoopService } from './shared/lib/game-core/GameLoopService';
import { timeService } from './features/time-of-day';
import { resetComplaintTimers } from './entities/stop/model/StopOverloadSystem';
import { resetGameOverSystem } from './features/game-over';
import { gameModeService, GameMode } from './features/game-mode';
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

  // Состояние Game Over из GameStateStore
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);

  // Режим игры (Developer/Viewer)
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.VIEWER);

  // Проверка устройства
  const deviceCheck = useDeviceCheck();

  useEffect(() => {
    // Инициализация режима игры
    gameModeService.initialize();
    setGameMode(gameModeService.getMode());

    // Подписка на изменения режима (опрос каждую секунду)
    const modeInterval = setInterval(() => {
      const currentMode = gameModeService.getMode();
      setGameMode(currentMode);
    }, 500);

    // Подписка на изменения сцены в GameStateStore
    const unsubscribe = gameStateStore.subscribe((state: GameState) => {
      setCurrentScene(state.currentScene);
      setIsGameOver(state.isGameOver);
      setGameOverReason(state.gameOverReason);
    });

    return () => {
      clearInterval(modeInterval);
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

  // Обработчики для GameOverModal
  const handleGameOverBackToMenu = () => {
    gameStateStore.clearGameOver();
    gameStateStore.setScene('menu');
  };

  const handleGameOverRestart = () => {
    console.log('[App] Restarting level...');

    // 1. Сбрасываем Game Over состояние
    gameStateStore.clearGameOver();

    // 2. Сбрасываем таймеры жалоб и систему Game Over
    resetComplaintTimers();
    resetGameOverSystem();

    // 3. Перезапускаем уровень (перезагрузка карты)
    restartLevel();

    // 4. Сбрасываем игровые статы (деньги, пассажиры, жалобы)
    // Но сохраняем сцену 'game'
    gameStateStore.setState({
      isPaused: false,
      score: 0,
      level: 1,
      gameTime: 0,
      money: 5000,
      totalPassengersDelivered: 0,
      activeBuses: 0,
      totalStops: 0,
      message: '',
      totalComplaints: 0,
      averageStopOccupancy: 0,
      overloadedStopsCount: 0,
      isGameOver: false,
      gameOverReason: null,
      gameOverStats: null,
    });

    // 5. Очищаем последние жалобы в UI
    clearRecentComplaints();

    // 6. Сбрасываем время к начальному значению
    timeService.reset();

    // 7. Начинаем новую сессию
    gameStateStore.startNewSession();

    // 8. Возобновляем игру (снимаем с паузы)
    gameLoopService.resume();

    console.log('[App] Level restarted');
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
      {/* Индикатор режима разработчика */}
      <DeveloperIndicator />

      {/* Слой игры */}
      <GameCanvas />

      {/* Слой UI (HUD) - виджеты доступные всем */}
      <StatsPanel />
      <StopOccupancy />
      <CitizenComplaints />
      <TimeDisplay />

      {/* Виджеты доступные только в режиме разработчика */}
      {gameMode === GameMode.DEVELOPER && (
        <>
          <Toolbar />
          <StopEditor />
          <MapManager />
        </>
      )}

      {/* Редактор маршрута (доступен всем, открывается кликом по маршруту) */}
      <RouteEditor />

      {/* Уведомления (всегда доступны) */}
      <Notifications />

      {/* GameOver Modal */}
      <GameOverModal
        isVisible={isGameOver}
        reason={gameOverReason ?? undefined}
        onBackToMenu={handleGameOverBackToMenu}
        onRestart={handleGameOverRestart}
      />
    </div>
  );
}

export default App;
