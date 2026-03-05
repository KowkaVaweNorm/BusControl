import cls from './GameOverModal.module.scss';

export interface GameOverModalProps {
  /** Видимость модалки */
  isVisible: boolean;
  /** Причина проигрыша (опционально) */
  reason?: string;
  /** Обработчик кнопки "В меню" */
  onBackToMenu?: () => void;
  /** Обработчик кнопки "Начать заново" */
  onRestart?: () => void;
}

export const GameOverModal = ({
  isVisible,
  reason,
  onBackToMenu,
  onRestart,
}: GameOverModalProps) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className={cls.overlay}>
      <div className={cls.modal}>
        <div className={cls.header}>
          <span className={cls.icon}>💀</span>
          <h2 className={cls.title}>ВЫ ПРОИГРАЛИ</h2>
        </div>

        {reason && <p className={cls.reason}>{reason}</p>}

        <div className={cls.buttons}>
          <button className={cls.buttonSecondary} onClick={onBackToMenu}>
            В МЕНЮ
          </button>
          <button className={cls.buttonPrimary} onClick={onRestart}>
            НАЧАТЬ ЗАНОВО
          </button>
        </div>
      </div>
    </div>
  );
};
