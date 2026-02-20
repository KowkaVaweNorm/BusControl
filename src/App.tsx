import { GameCanvas } from './widgets/game-canvas';
import { StatsPanel } from './widgets/stats-panel';
import { Toolbar } from './widgets/toolbar';
import { Notifications } from './widgets/notifications';
import { MapManager } from './widgets/map-manager';
import './index.css';

function App() {
  return (
    <div className="app">
      {/* Слой игры */}
      <GameCanvas />

      {/* Слой UI (HUD) */}
      <StatsPanel />
      <Notifications />
      <Toolbar />
      <MapManager />
    </div>
  );
}

export default App;
