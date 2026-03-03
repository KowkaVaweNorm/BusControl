import cls from './Menu.module.scss';

interface MenuProps {
  onStart: () => void;
  onGarage: () => void;
  onSettings: () => void;
}

/**
 * Заглушка главного меню
 * TODO: Заменить на полноценный дизайн
 */
export const Menu = ({ onStart, onGarage, onSettings }: MenuProps) => {
  return (
    <div className={cls.page}>
      <h1>🚌 Bus Control</h1>
      
      <div className={cls['menu-buttons']}>
        <button onClick={onStart}>
          🎮 Начать игру
        </button>
        
        <button onClick={onGarage}>
          🚌 Автопарк
        </button>
        
        <button onClick={onSettings}>
          ⚙️ Настройки
        </button>
      </div>

      <div className={cls.version}>
        v0.1.0 (Dev)
      </div>
    </div>
  );
};
