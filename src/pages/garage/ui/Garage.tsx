import cls from './Garage.module.scss';

interface GarageProps {
  onBack: () => void;
}

/**
 * Заглушка страницы гаража (автопарк)
 * TODO: Заменить на полноценный дизайн с управлением автобусами
 */
export const Garage = ({ onBack }: GarageProps) => {
  return (
    <div className={cls.page}>
      <h1>🚌 Автопарк</h1>
      
      <div className={cls['empty-message']}>
        Здесь будет управление автобусами:<br />
        • Покупка новых автобусов<br />
        • Улучшение характеристик<br />
        • Статистика по каждому автобусу
      </div>

      <button className={cls['back-button']} onClick={onBack}>
        ← Назад в меню
      </button>
    </div>
  );
};
