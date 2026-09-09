import { WatchPosition, PositionInfo, MeasurementRaw, CalculatedMeasurement, PositionStats } from '../types';

export const WATCH_POSITIONS: PositionInfo[] = [
  {
    id: 'WORN_WRIST',
    label: 'Puesto en muñeca',
    shortLabel: 'Muñeca',
    iconName: 'UserCheck',
    category: 'uso',
    description: 'En uso diario activo en la muñeca'
  },
  {
    id: 'WATCH_WINDER',
    label: 'En cargador / Winder',
    shortLabel: 'Cargador',
    iconName: 'RotateCw',
    category: 'uso',
    description: 'En caja rotatoria automática manteniéndose cargado'
  },
  {
    id: 'DIAL_UP',
    label: 'Esfera Arriba (CH)',
    shortLabel: 'Esfera Arriba',
    iconName: 'Compass',
    category: 'posicion',
    description: 'Horizontal en reposo con la esfera hacia el techo'
  },
  {
    id: 'DIAL_DOWN',
    label: 'Esfera Abajo (FH)',
    shortLabel: 'Esfera Abajo',
    iconName: 'Shield',
    category: 'posicion',
    description: 'Horizontal con la tapa trasera hacia arriba'
  },
  {
    id: 'CROWN_UP',
    label: 'Corona Arriba (CU / 12H)',
    shortLabel: 'Corona Arriba',
    iconName: 'ArrowUpCircle',
    category: 'posicion',
    description: 'Vertical descansando con la corona hacia arriba'
  },
  {
    id: 'CROWN_DOWN',
    label: 'Corona Abajo (CD)',
    shortLabel: 'Corona Abajo',
    iconName: 'ArrowDownCircle',
    category: 'posicion',
    description: 'Vertical apoyado con la corona hacia abajo'
  },
  {
    id: 'CROWN_LEFT',
    label: 'Corona Izquierda (CL / 9H)',
    shortLabel: 'Corona Izq.',
    iconName: 'ArrowLeftCircle',
    category: 'posicion',
    description: 'Vertical con corona a la izquierda (las 9 arriba o pos. lateral)'
  },
  {
    id: 'CROWN_RIGHT',
    label: 'Corona Derecha (CR / 3H)',
    shortLabel: 'Corona Der.',
    iconName: 'ArrowRightCircle',
    category: 'posicion',
    description: 'Vertical con corona a la derecha (las 3 arriba o pos. lateral)'
  },
  {
    id: 'REST_BOX',
    label: 'En estuche / Mesa',
    shortLabel: 'Estuche',
    iconName: 'Box',
    category: 'posicion',
    description: 'Reposo general en su estuche o mesa'
  },
];

export function getPositionInfo(pos: WatchPosition): PositionInfo {
  return WATCH_POSITIONS.find(p => p.id === pos) || {
    id: pos,
    label: pos,
    shortLabel: pos,
    iconName: 'Watch',
    category: 'posicion',
    description: pos
  };
}

export function getNowIso(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export function formatTimeOnly(isoString: string): string {
  if (!isoString) return '00:00:00';
  const parts = isoString.split('T');
  if (parts.length > 1) {
    return parts[1].slice(0, 8);
  }
  return isoString.slice(0, 8);
}

export function formatDateOnly(isoString: string): string {
  if (!isoString) return '';
  return isoString.split('T')[0];
}

/**
 * Combina una fecha base (YYYY-MM-DD) con una cadena de hora (HH:mm:ss o HH:mm).
 * Maneja inteligentemente transiciones de medianoche si la diferencia respecto
 * a la hora real base supera las 12 horas.
 */
export function combineDateAndTime(baseIso: string, timeStr: string): string {
  const baseDate = new Date(baseIso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const baseDateStr = `${baseDate.getFullYear()}-${pad(baseDate.getMonth() + 1)}-${pad(baseDate.getDate())}`;

  // Asegurar formato HH:mm:ss
  const parts = timeStr.trim().split(':');
  const hh = pad(parseInt(parts[0] || '0', 10));
  const mm = pad(parseInt(parts[1] || '0', 10));
  const ss = pad(parseInt(parts[2] || '0', 10));
  const candidateIso = `${baseDateStr}T${hh}:${mm}:${ss}`;

  let candidateDate = new Date(candidateIso);
  const diffHours = (candidateDate.getTime() - baseDate.getTime()) / (1000 * 3600);

  // Si la diferencia es > 12 horas (por ejemplo medianoche cruzada: real 23:59 y reloj 00:01)
  if (diffHours > 12) {
    candidateDate = new Date(candidateDate.getTime() - 24 * 3600 * 1000);
  } else if (diffHours < -12) {
    candidateDate = new Date(candidateDate.getTime() + 24 * 3600 * 1000);
  }

  return `${candidateDate.getFullYear()}-${pad(candidateDate.getMonth() + 1)}-${pad(candidateDate.getDate())}T${pad(candidateDate.getHours())}:${pad(candidateDate.getMinutes())}:${pad(candidateDate.getSeconds())}`;
}

/**
 * Calcula la diferencia en segundos entre la hora del reloj y la hora real.
 * diff = (watchTime - realTime) en segundos.
 * Positivo (+) significa que el reloj ADELANTA.
 * Negativo (-) significa que el reloj RETRASA.
 */
export function computeSecondsDiff(realTimeIso: string, watchTimeIso: string): number {
  const realMs = new Date(realTimeIso).getTime();
  const watchMs = new Date(watchTimeIso).getTime();
  const diffSec = (watchMs - realMs) / 1000;
  return Math.round(diffSec * 10) / 10;
}

/**
 * Procesa la lista de mediciones ordenadas cronológicamente para un reloj,
 * calculando tramos, reinicios, evoluciones puntual y acumulada.
 */
export function calculateMeasurements(rawList: MeasurementRaw[]): CalculatedMeasurement[] {
  // Ordenar cronológicamente por realTime
  const sorted = [...rawList].sort((a, b) => new Date(a.realTime).getTime() - new Date(b.realTime).getTime());

  let currentSessionIndex = 0;
  let sessionStartMeasurement: CalculatedMeasurement | null = null;
  let previousMeasurement: CalculatedMeasurement | null = null;

  const result: CalculatedMeasurement[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const raw = sorted[i];
    const diffSeconds = computeSecondsDiff(raw.realTime, raw.watchTime);
    const isReset = raw.isReset ?? (i === 0);

    if (isReset && i > 0) {
      currentSessionIndex += 1;
      sessionStartMeasurement = null;
      previousMeasurement = null;
    }

    const calc: CalculatedMeasurement = {
      ...raw,
      isReset,
      diffSeconds,
      sessionIndex: currentSessionIndex,
      isSessionStart: !sessionStartMeasurement,
      hoursSinceSessionStart: 0,
      sessionCumulativeDrift: 0,
    };

    if (!sessionStartMeasurement) {
      sessionStartMeasurement = calc;
      calc.isSessionStart = true;
      calc.hoursSinceSessionStart = 0;
      calc.sessionCumulativeDrift = 0;
      calc.sessionAverageRate_spd = 0;
    } else {
      const msSinceSession = new Date(raw.realTime).getTime() - new Date(sessionStartMeasurement.realTime).getTime();
      const hoursSinceSession = Math.max(0.01, msSinceSession / (1000 * 60 * 60));
      calc.hoursSinceSessionStart = Math.round(hoursSinceSession * 10) / 10;
      
      // Desviación acumulada respecto al inicio de este ciclo/sesión
      const cumulativeDrift = diffSeconds - sessionStartMeasurement.diffSeconds;
      calc.sessionCumulativeDrift = Math.round(cumulativeDrift * 10) / 10;

      if (hoursSinceSession >= 0.25) {
        const days = hoursSinceSession / 24;
        calc.sessionAverageRate_spd = Math.round((cumulativeDrift / days) * 10) / 10;
      } else {
        calc.sessionAverageRate_spd = 0;
      }
    }

    if (previousMeasurement && !isReset) {
      const msSincePrev = new Date(raw.realTime).getTime() - new Date(previousMeasurement.realTime).getTime();
      const hoursSincePrev = Math.max(0.01, msSincePrev / (1000 * 60 * 60));
      const deltaSec = diffSeconds - previousMeasurement.diffSeconds;

      calc.deltaPrevSeconds = Math.round(deltaSec * 10) / 10;
      calc.hoursSincePrev = Math.round(hoursSincePrev * 10) / 10;

      if (hoursSincePrev >= 0.1) {
        const days = hoursSincePrev / 24;
        calc.intervalRate_spd = Math.round((deltaSec / days) * 10) / 10;
      }
    }

    result.push(calc);
    previousMeasurement = calc;
  }

  return result;
}

/**
 * Calcula estadísticas agrupadas por posición
 */
export function calculatePositionStats(measurements: CalculatedMeasurement[]): PositionStats[] {
  // Solo se consideran tramos con intervalo válido para la tasa horaria de la posición
  const map: Record<WatchPosition, { count: number; totalHours: number; weightedRates: number[]; rates: number[] }> = {
    DIAL_UP: { count: 0, totalHours: 0, weightedRates: [], rates: [] },
    DIAL_DOWN: { count: 0, totalHours: 0, weightedRates: [], rates: [] },
    CROWN_UP: { count: 0, totalHours: 0, weightedRates: [], rates: [] },
    CROWN_DOWN: { count: 0, totalHours: 0, weightedRates: [], rates: [] },
    CROWN_LEFT: { count: 0, totalHours: 0, weightedRates: [], rates: [] },
    CROWN_RIGHT: { count: 0, totalHours: 0, weightedRates: [], rates: [] },
    WORN_WRIST: { count: 0, totalHours: 0, weightedRates: [], rates: [] },
    WATCH_WINDER: { count: 0, totalHours: 0, weightedRates: [], rates: [] },
    REST_BOX: { count: 0, totalHours: 0, weightedRates: [], rates: [] },
  };

  for (const m of measurements) {
    if (!map[m.position]) {
      map[m.position] = { count: 0, totalHours: 0, weightedRates: [], rates: [] };
    }
    map[m.position].count += 1;

    if (m.hoursSincePrev && m.intervalRate_spd !== undefined && m.hoursSincePrev >= 0.25) {
      map[m.position].totalHours += m.hoursSincePrev;
      map[m.position].rates.push(m.intervalRate_spd);
      // peso por horas
      map[m.position].weightedRates.push(m.intervalRate_spd * m.hoursSincePrev);
    }
  }

  const results: PositionStats[] = [];

  for (const posKey of Object.keys(map) as WatchPosition[]) {
    const entry = map[posKey];
    if (entry.count === 0) continue;

    const posInfo = getPositionInfo(posKey);
    let avgRate = 0;
    let minRate = 0;
    let maxRate = 0;

    if (entry.totalHours > 0 && entry.weightedRates.length > 0) {
      const sumWeighted = entry.weightedRates.reduce((a, b) => a + b, 0);
      avgRate = Math.round((sumWeighted / entry.totalHours) * 10) / 10;
      minRate = Math.min(...entry.rates);
      maxRate = Math.max(...entry.rates);
    } else if (entry.rates.length > 0) {
      avgRate = Math.round((entry.rates.reduce((a, b) => a + b, 0) / entry.rates.length) * 10) / 10;
      minRate = Math.min(...entry.rates);
      maxRate = Math.max(...entry.rates);
    }

    results.push({
      position: posKey,
      label: posInfo.label,
      shortLabel: posInfo.shortLabel,
      count: entry.count,
      totalHours: Math.round(entry.totalHours * 10) / 10,
      avgRate_spd: avgRate,
      minRate_spd: minRate,
      maxRate_spd: maxRate,
    });
  }

  // Ordenar por cantidad de registros
  return results.sort((a, b) => b.count - a.count);
}

/**
 * Formatear segundos con signo explícito
 */
export function formatSeconds(sec: number | undefined, withUnit = true): string {
  if (sec === undefined || isNaN(sec)) return '-';
  const sign = sec > 0 ? '+' : '';
  const num = sec.toFixed(1);
  return `${sign}${num}${withUnit ? 's' : ''}`;
}

/**
 * Formatear tasa s/d con signo
 */
export function formatSpd(rate: number | undefined): string {
  if (rate === undefined || isNaN(rate)) return '-';
  const sign = rate > 0 ? '+' : '';
  return `${sign}${rate.toFixed(1)} s/d`;
}

/**
 * Formato amigable de fecha y hora
 */
export function formatDateTime(isoStr: string): { date: string; time: string } {
  try {
    const d = new Date(isoStr);
    const date = d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const time = d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    return { date, time };
  } catch {
    return { date: isoStr, time: '' };
  }
}

/**
 * Exportar mediciones a CSV compatible con Excel / Google Sheets
 */
export function exportToCsv(watchName: string, measurements: CalculatedMeasurement[]): string {
  const headers = [
    'ID',
    'Reinicio de Conteo',
    'Fecha y Hora Real',
    'Hora Reloj Automático',
    'Desviación Puntual (s)',
    'Evolución vs Anterior (s)',
    'Horas Tramo',
    'Tasa Diaria Tramo (s/día)',
    'Horas Sesión Acumuladas',
    'Desviación Acumulada Sesión (s)',
    'Tasa Media Sesión (s/día)',
    'Posición / Soporte',
    'Notas'
  ];

  const rows = measurements.map(m => {
    const pos = getPositionInfo(m.position);
    return [
      m.id,
      m.isReset ? 'SÍ (Puesta en hora/Reinicio)' : 'NO',
      `"${m.realTime}"`,
      `"${m.watchTime}"`,
      m.diffSeconds,
      m.deltaPrevSeconds !== undefined ? m.deltaPrevSeconds : '',
      m.hoursSincePrev !== undefined ? m.hoursSincePrev : '',
      m.intervalRate_spd !== undefined ? m.intervalRate_spd : '',
      m.hoursSinceSessionStart,
      m.sessionCumulativeDrift,
      m.sessionAverageRate_spd !== undefined ? m.sessionAverageRate_spd : '',
      `"${pos.label}"`,
      `"${(m.notes || '').replace(/"/g, '""')}"`
    ].join(';');
  });

  return [headers.join(';'), ...rows].join('\n');
}
