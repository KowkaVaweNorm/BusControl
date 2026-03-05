import cls from './UnsupportedDevice.module.scss';
import { useDeviceCheck } from '@/shared/lib/hooks';

/**
 * Заглушка для неподдерживаемых устройств
 * В стиле билета/чека (как меню и гараж)
 */
export const UnsupportedDevice = () => {
  const { screenWidth, minWidth, isTouchDevice } = useDeviceCheck();

  return (
    <div className={cls.page}>
      <div className={cls.ticket}>
        {/* Шапка билета */}
        <div className={cls.ticketHeader}>
          <div className={cls.routeName}>
            <h1>⚠️ BUS CONTROL</h1>
          </div>
        </div>

        {/* Сообщение */}
        <div className={cls.messageSection}>
          <div className={cls.messageTitle}>Устройство не поддерживается</div>

          <div className={cls.message}>
            К сожалению, игра работает только на ПК с шириной экрана от 900px.
          </div>
        </div>

        {/* Требования */}
        <div className={cls.requirementsSection}>
          <div className={cls.requirementsTitle}>Минимальные требования:</div>

          <div className={cls.requirementsList}>
            <div className={cls.requirement}>
              <span className={`${cls.check} ${screenWidth >= minWidth ? cls.pass : cls.fail}`}>
                {screenWidth >= minWidth ? '✓' : '✗'}
              </span>
              <span>
                Ширина экрана: <strong>{screenWidth}px</strong> (требуется ≥{minWidth}px)
              </span>
            </div>

            <div className={cls.requirement}>
              <span className={`${cls.check} ${!isTouchDevice ? cls.pass : cls.fail}`}>
                {!isTouchDevice ? '✓' : '✗'}
              </span>
              <span>
                Устройство: <strong>{!isTouchDevice ? 'ПК (мышь/клавиатура)' : 'Сенсорный экран'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Помощь */}
        <div className={cls.helpSection}>
          <div className={cls.helpText}>
            Попробуйте открыть игру на компьютере с большим монитором
          </div>
        </div>

        {/* Нижняя панель */}
        <div className={cls.stub}>* сохраните билет до конца поездки *</div>
      </div>
    </div>
  );
};
