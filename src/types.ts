export type WatchPosition =
  | 'DIAL_UP'       // Esfera Arriba (Dial Up / CH)
  | 'DIAL_DOWN'     // Esfera Abajo (Dial Down / FH)
  | 'CROWN_UP'      // Corona Arriba (Crown Up)
  | 'CROWN_DOWN'    // Corona Abajo (Crown Down)
  | 'CROWN_LEFT'    // Corona Izquierda (Crown Left - 9H)
  | 'CROWN_RIGHT'   // Corona Derecha (Crown Right - 3H)
  | 'WORN_WRIST'    // Puesto en muñeca (On Wrist)
  | 'WATCH_WINDER'  // En cargador / Winder (Rotating Winder)
  | 'REST_BOX';     // En estuche / Reposo neutro

export interface PositionInfo {
  id: WatchPosition;
  label: string;
  shortLabel: string;
  iconName: string;
  category: 'posicion' | 'uso';
  description: string;
}

export interface Watch {
  id: string;
  name: string;
  brand: string;
  model: string;
  caliber?: string;
  targetRateMin?: number; // e.g. -4 (COSC)
  targetRateMax?: number; // e.g. +6 (COSC)
  powerReserveHours?: number; // e.g. 42h, 80h
  color: string;
  notes?: string;
  createdAt: string;
}

export interface MeasurementRaw {
  id: string;
  watchId: string;
  realTime: string;      // ISO string 'YYYY-MM-DDTHH:mm:ss'
  watchTime: string;     // ISO string 'YYYY-MM-DDTHH:mm:ss'
  position: WatchPosition;
  isReset?: boolean;     // Puesta en hora / reinicio de conteo tras parada
  notes?: string;
}

export interface CalculatedMeasurement extends MeasurementRaw {
  diffSeconds: number;                    // watchTime - realTime in seconds
  sessionIndex: number;                  // 0, 1, 2... across resets
  isSessionStart: boolean;
  
  // Tramo vs anterior
  deltaPrevSeconds?: number;             // diff - prev.diff
  hoursSincePrev?: number;               // hours elapsed
  intervalRate_spd?: number;             // (deltaPrevSeconds / hoursSincePrev) * 24 (s/día)

  // Total acumulado de la sesión
  hoursSinceSessionStart: number;
  sessionCumulativeDrift: number;        // diffSeconds - start.diffSeconds
  sessionAverageRate_spd?: number;       // average s/día since session start
}

export interface PositionStats {
  position: WatchPosition;
  label: string;
  shortLabel: string;
  count: number;
  totalHours: number;
  avgRate_spd: number;
  minRate_spd: number;
  maxRate_spd: number;
}
