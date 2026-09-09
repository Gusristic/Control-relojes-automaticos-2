import { Watch, CalculatedMeasurement, MeasurementRaw } from '../types';
import { getPositionInfo, calculatePositionStats, calculateMeasurements } from '../utils/calculations';

export interface GoogleSheetsExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  totalRows: number;
}

/**
 * Crea una hoja de cálculo completa en Google Drive y rellena todas las mediciones,
 * cálculos horológicos de evolución y desgloses por posición.
 */
export async function createGoogleSheetsSpreadsheet(
  watches: Watch[],
  allRawMeasurements: MeasurementRaw[],
  accessToken: string
): Promise<GoogleSheetsExportResult> {
  const dateStr = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const title = `Control de Desviación de Relojes Automáticos - ${dateStr}`;

  // 1. Create Spreadsheet container with 3 tabs
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Mediciones y Desviación',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
        {
          properties: {
            title: 'Desglose por Posición y Uso',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
        {
          properties: {
            title: 'Colección de Relojes',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createResponse.ok) {
    const errText = await createResponse.text();
    throw new Error(`Error al crear la hoja en Google Sheets: ${errText}`);
  }

  const createdData = await createResponse.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl = createdData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare Data for Sheet 1: Mediciones y Desviación
  const measurementsHeaders = [
    'Reloj',
    'Marca y Modelo',
    'Tipo de Entrada',
    'Fecha y Hora Real (Ref.)',
    'Hora Reloj Automático',
    'Desviación Puntual (seg)',
    'Evolución vs Anterior (seg)',
    'Horas Tramo',
    'Tasa Diaria Tramo (seg/día)',
    'Desviación Acumulada Sesión (seg)',
    'Tasa Media Sesión (seg/día)',
    'Posición / Soporte',
    'Categoría',
    'Observaciones / Notas',
  ];

  const measurementsRows: any[][] = [];

  // Group and compute per watch
  for (const watch of watches) {
    const watchRaw = allRawMeasurements.filter(m => m.watchId === watch.id);
    const calculated = calculateMeasurements(watchRaw);

    for (const m of calculated) {
      const pos = getPositionInfo(m.position);
      measurementsRows.push([
        watch.name,
        `${watch.brand} ${watch.model}`,
        m.isReset ? 'REINICIO / PUESTA EN HORA' : 'Medición regular',
        m.realTime.replace('T', ' '),
        m.watchTime.replace('T', ' '),
        m.diffSeconds,
        m.deltaPrevSeconds !== undefined ? m.deltaPrevSeconds : '',
        m.hoursSincePrev !== undefined ? m.hoursSincePrev : '',
        m.intervalRate_spd !== undefined ? m.intervalRate_spd : '',
        m.sessionCumulativeDrift,
        m.sessionAverageRate_spd !== undefined ? m.sessionAverageRate_spd : '',
        pos.label,
        pos.category === 'uso' ? 'Uso Activo / Cargador' : 'Posición Estática en Reposo',
        m.notes || '',
      ]);
    }
  }

  // 3. Prepare Data for Sheet 2: Desglose por Posición
  const positionHeaders = [
    'Reloj',
    'Posición / Soporte',
    'Tipo',
    'Nº Mediciones',
    'Horas Totales',
    'Tasa Media (seg/día)',
    'Mínimo (seg/día)',
    'Máximo (seg/día)',
    'Diagnóstico Horológico',
  ];

  const positionRows: any[][] = [];

  for (const watch of watches) {
    const watchRaw = allRawMeasurements.filter(m => m.watchId === watch.id);
    const calculated = calculateMeasurements(watchRaw);
    const stats = calculatePositionStats(calculated);

    for (const s of stats) {
      const pos = getPositionInfo(s.position);
      const diagnosis =
        s.avgRate_spd > 2
          ? 'Adelanto apreciable'
          : s.avgRate_spd > 0
          ? 'Adelanto leve (compensable)'
          : s.avgRate_spd < -2
          ? 'Atraso apreciable'
          : s.avgRate_spd < 0
          ? 'Atraso leve'
          : 'Exactitud neutra';

      positionRows.push([
        `${watch.brand} ${watch.name}`,
        s.label,
        pos.category === 'uso' ? 'Uso / Cargador' : 'Posición Estática',
        s.count,
        s.totalHours,
        s.avgRate_spd,
        s.totalHours > 0 ? s.minRate_spd : '',
        s.totalHours > 0 ? s.maxRate_spd : '',
        diagnosis,
      ]);
    }
  }

  // 4. Prepare Data for Sheet 3: Colección de Relojes
  const watchesHeaders = [
    'Nombre',
    'Marca',
    'Modelo',
    'Calibre / Movimiento',
    'Tolerancia Mínima (seg/día)',
    'Tolerancia Máxima (seg/día)',
    'Reserva de Marcha (horas)',
    'Notas del Reloj',
  ];

  const watchesRows = watches.map(w => [
    w.name,
    w.brand,
    w.model,
    w.caliber || '',
    w.targetRateMin ?? -15,
    w.targetRateMax ?? 25,
    w.powerReserveHours || 40,
    w.notes || '',
  ]);

  // 5. Populate values into Google Sheets via batchUpdate
  const batchUpdateValuesResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: "'Mediciones y Desviación'!A1",
            values: [measurementsHeaders, ...measurementsRows],
          },
          {
            range: "'Desglose por Posición y Uso'!A1",
            values: [positionHeaders, ...positionRows],
          },
          {
            range: "'Colección de Relojes'!A1",
            values: [watchesHeaders, ...watchesRows],
          },
        ],
      }),
    }
  );

  if (!batchUpdateValuesResponse.ok) {
    const err = await batchUpdateValuesResponse.text();
    console.error('Error al insertar datos en Google Sheets:', err);
    throw new Error(`Error al insertar datos en la hoja: ${err}`);
  }

  // 6. Optional: Format header row with bold text and dark theme
  try {
    const sheetIds = createdData.sheets.map((s: any) => s.properties.sheetId);
    const formatRequests = sheetIds.map((sId: number) => ({
      repeatCell: {
        range: {
          sheetId: sId,
          startRowIndex: 0,
          endRowIndex: 1,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.06, green: 0.1, blue: 0.16 }, // Slate dark
            textFormat: {
              bold: true,
              foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
              fontSize: 10,
            },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat)',
      },
    }));

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: formatRequests,
      }),
    });
  } catch (e) {
    console.warn('Formato opcional de cabecera no completado:', e);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    totalRows: measurementsRows.length,
  };
}
