import { Watch, MeasurementRaw } from '../types';

export const INITIAL_WATCHES: Watch[] = [
  {
    id: 'w-default',
    name: 'Mi Reloj Automático',
    brand: 'Reloj Automático',
    model: 'Calibre Mecánico',
    caliber: 'Automático',
    targetRateMin: -15,
    targetRateMax: +25,
    powerReserveHours: 42,
    color: '#0284c7',
    notes: 'Primer reloj para seguimiento de desviación horaria.',
    createdAt: new Date().toISOString(),
  },
];

// Comienza completamente en blanco sin mediciones de ejemplo
export const INITIAL_MEASUREMENTS: MeasurementRaw[] = [];

// Opcional por si el usuario pulsa explícitamente en "Cargar datos de prueba"
export const DEMO_SAMPLE_WATCHES: Watch[] = [
  {
    id: 'w-demo-1',
    name: 'Reloj de Muestra A',
    brand: 'Muestra',
    model: 'Diver 200m',
    caliber: 'Automático 21.600 A/h',
    targetRateMin: -15,
    targetRateMax: +25,
    powerReserveHours: 41,
    color: '#0284c7',
    notes: 'Reloj de prueba para demostración.',
    createdAt: new Date().toISOString(),
  },
];

export const DEMO_SAMPLE_MEASUREMENTS: MeasurementRaw[] = [];
