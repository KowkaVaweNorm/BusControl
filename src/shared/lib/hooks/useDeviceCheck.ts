import { useEffect, useState } from 'react';

export interface DeviceCheckResult {
  /** Устройство поддерживается (PC с шириной >= 900px) */
  isSupported: boolean;
  /** Ширина экрана */
  screenWidth: number;
  /** Минимальная требуемая ширина */
  minWidth: number;
  /** Это тач-устройство (основной ввод - тач) */
  isTouchDevice: boolean;
}

/**
 * Хук для проверки поддержки устройства
 * 
 * Требования:
 * - Ширина экрана >= 900px
 * - Устройство НЕ тач-экран (PC с мышью/клавиатурой)
 */
export function useDeviceCheck(): DeviceCheckResult {
  const [result, setResult] = useState<DeviceCheckResult>({
    isSupported: false,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
    minWidth: 900,
    isTouchDevice: false,
  });

  useEffect(() => {
    const checkDevice = () => {
      const screenWidth = window.innerWidth;
      
      // Проверка на тач-устройство
      // Используем комбинацию факторов для более точного определения
      const hasTouchPoints = navigator.maxTouchPoints > 0;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Более строгая проверка: считаем тач-устройством только если:
      // 1. Это мобильный UA (телефон/планшет)
      // 2. ИЛИ есть тач-точки И нет поддержки мыши
      const isTouchDevice = isMobileUA || (hasTouchPoints && !hasMouseSupport());

      const isSupported = screenWidth >= 900 && !isTouchDevice;

      setResult({
        isSupported,
        screenWidth,
        minWidth: 900,
        isTouchDevice,
      });
    };

    // Первоначальная проверка
    checkDevice();

    // Проверка при изменении размера окна
    window.addEventListener('resize', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  return result;
}

/**
 * Проверка поддержки мыши
 * Возвращает true если устройство имеет мышь (ПК)
 */
function hasMouseSupport(): boolean {
  // Проверка через matchMedia (современный способ)
  const mouseQuery = window.matchMedia('(pointer: fine)');
  if (mouseQuery.matches) {
    return true;
  }
  
  // Резервная проверка через hover
  const hoverQuery = window.matchMedia('(hover: hover)');
  if (hoverQuery.matches) {
    return true;
  }
  
  return false;
}
