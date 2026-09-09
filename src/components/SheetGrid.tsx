import React, { useState } from 'react';
import { CalculatedMeasurement, WatchPosition } from '../types';
import {
  getPositionInfo,
  formatSeconds,
  formatSpd,
  formatDateTime,
  exportToCsv,
} from '../utils/calculations';
import {
  Download,
  Copy,
  Check,
  Trash2,
  Edit2,
  RotateCcw,
  Clock,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
  FileSpreadsheet,
  X,
} from 'lucide-react';

interface SheetGridProps {
  watchName: string;
  measurements: CalculatedMeasurement[];
  onAddMeasurement: () => void;
  onEditMeasurement: (m: CalculatedMeasurement) => void;
  onDeleteMeasurement: (id: string) => void;
  onStartNewSession: () => void;
  onOpenGoogleSheetsExport?: () => void;
}

export const SheetGrid: React.FC<SheetGridProps> = ({
  watchName,
  measurements,
  onAddMeasurement,
  onEditMeasurement,
  onDeleteMeasurement,
  onStartNewSession,
  onOpenGoogleSheetsExport,
}) => {
  const [copied, setCopied] = useState(false);
  const [filterPosition, setFilterPosition] = useState<string>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleExportCsv = () => {
    const csvContent = exportToCsv(watchName, measurements);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Desviacion_${watchName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyToClipboard = async () => {
    // Generate tab-separated values (TSV) so users can paste directly into Google Sheets or Excel!
    const headers = [
      '#',
      'Tipo',
      'Fecha y Hora Real',
      'Hora Reloj',
      'Desviación (s)',
      'Evolución vs Ant. (s)',
      'Tasa Tramo (s/d)',
      'Desv. Acumulada (s)',
      'Tasa Sesión (s/d)',
      'Posición / Soporte',
      'Notas'
    ];

    const rows = measurements.map((m, idx) => [
      idx + 1,
      m.isReset ? 'Reinicio / Puesta en hora' : 'Medida',
      m.realTime,
      m.watchTime,
      m.diffSeconds,
      m.deltaPrevSeconds !== undefined ? m.deltaPrevSeconds : '',
      m.intervalRate_spd !== undefined ? m.intervalRate_spd : '',
      m.sessionCumulativeDrift,
      m.sessionAverageRate_spd !== undefined ? m.sessionAverageRate_spd : '',
      getPositionInfo(m.position).label,
      m.notes || ''
    ]);

    const tsv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    await navigator.clipboard.writeText(tsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredMeasurements = filterPosition === 'ALL'
    ? measurements
    : measurements.filter(m => m.position === filterPosition);

  return (
    <div id="sheets-data-grid-container" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Top Toolbar */}
      <div className="p-3 sm:p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block" />
            Hoja de Mediciones ({measurements.length} registros)
          </span>

          {/* Quick Position Filter */}
          <select
            id="filter-position-select"
            value={filterPosition}
            onChange={e => setFilterPosition(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="ALL">Todas las posiciones y usos</option>
            <option value="WORN_WRIST">Puesto en muñeca</option>
            <option value="WATCH_WINDER">En cargador / Winder</option>
            <option value="DIAL_UP">Esfera Arriba</option>
            <option value="DIAL_DOWN">Esfera Abajo</option>
            <option value="CROWN_UP">Corona Arriba</option>
            <option value="CROWN_DOWN">Corona Abajo</option>
            <option value="CROWN_LEFT">Corona Izquierda</option>
            <option value="CROWN_RIGHT">Corona Derecha</option>
            <option value="REST_BOX">En estuche / Mesa</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {onOpenGoogleSheetsExport && (
            <button
              id="export-google-sheets-grid-btn"
              onClick={onOpenGoogleSheetsExport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md text-xs font-semibold transition-colors shadow-2xs"
              title="Crear y exportar a una hoja de Google Sheets en tu Drive"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Exportar a Google Sheets</span>
            </button>
          )}

          <button
            id="copy-to-sheets-btn"
            onClick={handleCopyToClipboard}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-medium transition-colors"
            title="Copiar datos tabulados para pegar directamente en Google Sheets o Excel"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">¡Copiado TSV!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copiar a Sheets</span>
              </>
            )}
          </button>

          <button
            id="export-csv-btn"
            onClick={handleExportCsv}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-medium transition-colors"
            title="Descargar archivo CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar CSV</span>
          </button>

          <button
            id="start-new-session-sheet-btn"
            onClick={onStartNewSession}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md text-xs font-medium transition-colors"
            title="Reiniciar el conteo si el reloj se paró o fue ajustado"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>Nueva sesión / Parada</span>
          </button>

          <button
            id="add-row-sheet-btn"
            onClick={onAddMeasurement}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir fila</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="overflow-x-auto max-h-[580px] scrollbar-thin">
        <table id="horology-sheets-table" className="w-full text-left text-xs border-collapse">
          {/* Table Header */}
          <thead className="bg-slate-100/90 sticky top-0 z-10 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3 min-w-[130px]">Estado / Tipo</th>
              <th className="py-2.5 px-3 min-w-[140px]">Hora Real (Ref.)</th>
              <th className="py-2.5 px-3 min-w-[140px]">Hora Reloj Auto.</th>
              <th className="py-2.5 px-3 min-w-[120px] text-right">Desv. Puntual</th>
              <th className="py-2.5 px-3 min-w-[125px] text-right">Evolución vs Ant.</th>
              <th className="py-2.5 px-3 min-w-[120px] text-right">Tasa Tramo</th>
              <th className="py-2.5 px-3 min-w-[130px] text-right">Desv. Total Sesión</th>
              <th className="py-2.5 px-3 min-w-[120px] text-right">Tasa Total</th>
              <th className="py-2.5 px-3 min-w-[150px]">Posición / Uso</th>
              <th className="py-2.5 px-3 min-w-[180px]">Observaciones</th>
              <th className="py-2.5 px-3 w-20 text-center">Acciones</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 text-slate-800 font-sans">
            {filteredMeasurements.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium">No hay mediciones con el filtro actual.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Pulsa en "Añadir fila" o "Medir ahora" para registrar la primera comparación.
                  </p>
                </td>
              </tr>
            ) : (
              filteredMeasurements.map((m, index) => {
                const realDt = formatDateTime(m.realTime);
                const watchDt = formatDateTime(m.watchTime);
                const posInfo = getPositionInfo(m.position);

                // Styling based on deviation
                const isPositive = m.diffSeconds > 0;
                const isZero = m.diffSeconds === 0;
                const diffColor = isZero
                  ? 'text-slate-600 bg-slate-100'
                  : isPositive
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/50'
                  : 'text-amber-700 bg-amber-50 border border-amber-200/50';

                return (
                  <React.Fragment key={m.id}>
                    {/* Session Reset Header Banner */}
                    {m.isReset && (
                      <tr className="bg-amber-50/80 border-t-2 border-b border-amber-200 text-amber-900 font-medium">
                        <td colSpan={12} className="py-1.5 px-4 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="font-bold">
                              {index === 0
                                ? 'Sesión Inicial: Inicio de Conteo'
                                : `Sesión #${m.sessionIndex + 1}: Reinicio de Conteo (Puesta en hora tras parada)`}
                            </span>
                            <span className="text-[11px] text-amber-700 font-normal">
                              — Las evoluciones acumuladas se calculan a partir de este punto base.
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}

                    <tr
                      id={`measurement-row-${m.id}`}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* # Index */}
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {index + 1}
                      </td>

                      {/* Estado */}
                      <td className="py-2.5 px-3">
                        {m.isReset ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            <RotateCcw className="w-2.5 h-2.5" />
                            Puesta en hora
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                            Medición
                          </span>
                        )}
                      </td>

                      {/* Real Time */}
                      <td className="py-2.5 px-3 font-mono">
                        <div className="text-slate-900 font-medium">{realDt.time}</div>
                        <div className="text-[10px] text-slate-400">{realDt.date}</div>
                      </td>

                      {/* Watch Time */}
                      <td className="py-2.5 px-3 font-mono">
                        <div className="text-slate-900 font-medium">{watchDt.time}</div>
                        <div className="text-[10px] text-slate-400">{watchDt.date}</div>
                      </td>

                      {/* Desviación puntual */}
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-xs ${diffColor}`}
                        >
                          {formatSeconds(m.diffSeconds)}
                        </span>
                      </td>

                      {/* Evolución vs anterior */}
                      <td className="py-2.5 px-3 text-right font-mono">
                        {m.deltaPrevSeconds !== undefined ? (
                          <div className="flex items-center justify-end gap-1">
                            {m.deltaPrevSeconds > 0 ? (
                              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                            ) : m.deltaPrevSeconds < 0 ? (
                              <ArrowDownRight className="w-3 h-3 text-amber-600" />
                            ) : (
                              <Minus className="w-3 h-3 text-slate-400" />
                            )}
                            <span
                              className={`font-semibold ${
                                m.deltaPrevSeconds > 0
                                  ? 'text-emerald-700'
                                  : m.deltaPrevSeconds < 0
                                  ? 'text-amber-700'
                                  : 'text-slate-600'
                              }`}
                            >
                              {formatSeconds(m.deltaPrevSeconds)}
                            </span>
                            {m.hoursSincePrev && (
                              <span className="text-[10px] text-slate-400 ml-0.5">
                                ({m.hoursSincePrev}h)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Tasa tramo (s/d) */}
                      <td className="py-2.5 px-3 text-right font-mono">
                        {m.intervalRate_spd !== undefined ? (
                          <span
                            className={`font-medium ${
                              m.intervalRate_spd > 0
                                ? 'text-emerald-700'
                                : m.intervalRate_spd < 0
                                ? 'text-amber-700'
                                : 'text-slate-600'
                            }`}
                          >
                            {formatSpd(m.intervalRate_spd)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Desviación Acumulada Sesión */}
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">
                        <span
                          className={
                            m.sessionCumulativeDrift > 0
                              ? 'text-emerald-700'
                              : m.sessionCumulativeDrift < 0
                              ? 'text-amber-700'
                              : 'text-slate-600'
                          }
                        >
                          {formatSeconds(m.sessionCumulativeDrift)}
                        </span>
                      </td>

                      {/* Tasa Media Total Sesión */}
                      <td className="py-2.5 px-3 text-right font-mono">
                        {m.sessionAverageRate_spd !== undefined ? (
                          <span className="text-slate-700 font-medium">
                            {formatSpd(m.sessionAverageRate_spd)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Posición / Soporte */}
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            posInfo.category === 'uso'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {posInfo.shortLabel}
                        </span>
                      </td>

                      {/* Observaciones */}
                      <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-xs truncate" title={m.notes}>
                        {m.notes || <span className="text-slate-300 italic">Sin notas</span>}
                      </td>

                      {/* Acciones */}
                      <td className="py-2.5 px-3 text-center">
                        {deletingId === m.id ? (
                          <div className="flex items-center justify-center gap-1 animate-in fade-in duration-100">
                            <button
                              id={`confirm-delete-${m.id}`}
                              type="button"
                              onClick={() => {
                                onDeleteMeasurement(m.id);
                                setDeletingId(null);
                              }}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold shadow-xs transition-colors"
                              title="Confirmar eliminación"
                            >
                              Borrar
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(null)}
                              className="p-0.5 text-slate-400 hover:text-slate-600 rounded text-[10px]"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              id={`edit-m-${m.id}`}
                              type="button"
                              onClick={() => onEditMeasurement(m)}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                              title="Editar fila"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`delete-m-${m.id}`}
                              type="button"
                              onClick={() => setDeletingId(m.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Eliminar fila"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Spreadsheet Footnote Info */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-slate-500 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            <strong>Convenio Horológico:</strong> Desviación positiva (+) indica que el reloj adelanta (va más rápido que la hora real); negativa (-) indica que atrasa.
          </span>
        </div>
        <div className="text-slate-400 font-mono text-[10px]">
          Fórmula Tasa Tramo = (Δs / Horas transcurridas) × 24h
        </div>
      </div>
    </div>
  );
};
