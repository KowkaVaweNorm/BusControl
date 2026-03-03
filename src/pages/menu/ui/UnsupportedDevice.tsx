import cls from './UnsupportedDevice.module.scss';
import { useDeviceCheck } from '@/shared/lib/hooks';

/**
 * Заглушка для неподдерживаемых устройств
 */
export const UnsupportedDevice = () => {
  const { screenWidth, minWidth, isTouchDevice } = useDeviceCheck();

  return (
    <div className={cls.page}>
      <div className={cls.icon}>⚠️</div>

      <h1>Устройство не поддерживается</h1>

      <div className={cls.message}>
        К сожалению, игра работает только на ПК с шириной экрана от 900px. Ваше устройство не
        соответствует минимальным требованиям.
      </div>

      <div className={cls.requirements}>
        <div className={cls['requirements-title']}>Минимальные требования:</div>

        <div className={cls.requirement}>
          <span className={`${cls.check} ${screenWidth >= minWidth ? cls['pass'] : cls['fail']}`}>
            {screenWidth >= minWidth ? '✓' : '✗'}
          </span>
          <span>
            Ширина экрана: {screenWidth}px (требуется ≥{minWidth}px)
          </span>
        </div>

        <div className={cls.requirement}>
          <span className={`${cls.check} ${!isTouchDevice ? cls['pass'] : cls['fail']}`}>
            {!isTouchDevice ? '✓' : '✗'}
          </span>
          <span>Устройство: {!isTouchDevice ? 'ПК (мышь/клавиатура)' : 'Сенсорный экран'}</span>
        </div>
      </div>

      <div className={cls.help}>Попробуйте открыть игру на компьютере с большим монитором</div>
    </div>
  );
};
