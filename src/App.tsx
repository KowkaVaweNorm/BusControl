import { GameCanvas } from './widgets/game-canvas';
import './index.css';

function App() {
  return (
    <div className="app">
      {/* Слой игры */}
      <GameCanvas />

      {/* Слой UI (HUD) - пока заглушка, потом добавим баланс и кнопки */}
      <div
        style={{ position: 'absolute', top: 20, left: 20, color: 'white', pointerEvents: 'none' }}
      >
        <h1>Bus Control MVP</h1>
        <p>ЛКМ: Создать остановку | СКМ: Двигать карту | Колесо: Зум</p>
      </div>
    </div>
  );
}

export default App;
