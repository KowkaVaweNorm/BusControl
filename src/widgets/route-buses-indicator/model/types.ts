/**
 * Типы для виджета RouteBusesIndicator
 */

/**
 * Информация об автобусе на маршруте
 */
export interface RouteBusInfo {
  routeId: string;
  routeName: string;
  busCount: number;
  busTypes: Array<{
    typeId: string;
    typeName: string;
    count: number;
    level: number;
  }>;
}
