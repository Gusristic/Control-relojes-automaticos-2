import React, { useState } from 'react';
import { CalculatedMeasurement, Watch } from '../types';
import { formatSeconds, formatSpd, formatDateTime, getPositionInfo } from '../utils/calculations';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
} from 'recharts';
import { TrendingUp, Activity, Layers, Calendar } from 'lucide-react';

interface PerformanceChartsProps {
  watch: Watch;
  measurements: CalculatedMeasurement[];
}

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ watch, measurements }) => {
  const [viewMode, setViewMode] = useState<'CURRENT_SESSION' | 'ALL_TIME'>('CURRENT_SESSION');

  // Identify sessions
  const sessions: number[] = Array.from(new Set(measurements.map(m => m.sessionIndex)));
  const currentSessionIndex = sessions.length > 0 ? Math.max(...sessions) : 0;

  const displayData = viewMode === 'CURRENT_SESSION'
    ? measurements.filter(m => m.sessionIndex === currentSessionIndex)
    : measurements;

  // Prepare chart series
  const chartData = displayData.map((m, idx) => {
    const dt = formatDateTime(m.realTime);
    const pos = getPositionInfo(m.position);
    return {
      id: m.id,
      index: idx + 1,
      dateLabel: `${dt.date.slice(0, 5)} ${dt.time.slice(0, 5)}`,
      fullDate: `${dt.date} ${dt.time}`,
      rawDiff: m.diffSeconds,
      cumulativeDrift: m.sessionCumulativeDrift,
      rate_spd: m.intervalRate_spd ?? 0,
      hasRate: m.intervalRate_spd !== undefined,
      positionLabel: pos.shortLabel,
      isReset: m.isReset,
      notes: m.notes,
      sessionIndex: m.sessionIndex,
    };
  });

  return (
    <div id="performance-charts-container" className="space-y-4">
      {/* Chart Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span className="font-bold text-slate-800 text-sm">
            Evolución Gráfica del Rendimiento a lo Largo del Tiempo
          </span>
        </div>

        {sessions.length > 1 && (
          <div className="flex items-center gap-1.5 text-xs bg-slate-100 p-1 rounded-lg">
            <button
              id="chart-filter-current-session-btn"
              onClick={() => setViewMode('CURRENT_SESSION')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                viewMode === 'CURRENT_SESSION'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sesión actual (tras última parada)
            </button>
            <button
              id="chart-filter-all-sessions-btn"
              onClick={() => setViewMode('ALL_TIME')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                viewMode === 'ALL_TIME'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Histórico completo ({sessions.length} sesiones)
            </button>
          </div>
        )}
      </div>

      {/* Chart 1: Cumulative Drift over time */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" />
              Desviación Acumulada (segundos) vs Tiempo
            </h4>
            <p className="text-[11px] text-slate-500">
              Muestra la evolución continua de los segundos ganados (+) o perdidos (-) respecto al punto de inicio.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="inline-block w-3 h-0.5 bg-emerald-500 rounded" />
            <span>Desv. Acumulada</span>
          </div>
        </div>

        {chartData.length < 2 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Se necesitan al menos 2 mediciones para graficar la evolución temporal.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 25, left: 0, bottom: 25 }}>
                <defs>
                  <linearGradient id="driftGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  angle={-20}
                  textAnchor="end"
                  interval="preserveStartEnd"
                />
                <YAxis
                  unit="s"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1 border border-slate-800">
                          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
                            <span>{data.fullDate}</span>
                            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                              {data.positionLabel}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 pt-1">
                            <span className="text-slate-400">Desv. Acumulada:</span>
                            <span className="font-mono font-bold text-emerald-400">
                              {formatSeconds(data.cumulativeDrift)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-400">Desv. Puntual:</span>
                            <span className="font-mono text-slate-300">
                              {formatSeconds(data.rawDiff)}
                            </span>
                          </div>
                          {data.isReset && (
                            <div className="text-amber-300 text-[10px] font-semibold pt-1 border-t border-slate-800">
                              ⚠️ Puesta en hora / Reinicio de conteo
                            </div>
                          )}
                          {data.notes && (
                            <div className="text-slate-400 text-[10px] italic line-clamp-2">
                              "{data.notes}"
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                <Area
                  type="monotone"
                  dataKey="cumulativeDrift"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#driftGradient)"
                  dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#047857' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chart 2: Daily Rate per Interval vs Tolerance Spec */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              Tasa Diaria Instantánea (s/d) por Medición vs Tolerancia
            </h4>
            <p className="text-[11px] text-slate-500">
              Comprueba si cada tramo se mantiene dentro de la tolerancia de fábrica del calibre (
              {watch.targetRateMin ?? -15} a +{watch.targetRateMax ?? 25} s/d).
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5 bg-blue-600 rounded" />
              <span>Tasa tramo</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5 bg-rose-400 border border-dashed rounded" />
              <span>Tolerancia</span>
            </span>
          </div>
        </div>

        {chartData.filter(d => d.hasRate).length < 2 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Se necesitan varias mediciones para calcular la tasa de marcha s/día.
          </div>
        ) : (
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData.filter(d => d.hasRate)}
                margin={{ top: 10, right: 25, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  angle={-20}
                  textAnchor="end"
                  interval="preserveStartEnd"
                />
                <YAxis
                  unit=" s/d"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  formatter={(val: any) => [`${formatSpd(Number(val))}`, 'Tasa diaria']}
                  labelFormatter={(label: any) => `Medición: ${label}`}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
                {watch.targetRateMax !== undefined && (
                  <ReferenceLine
                    y={watch.targetRateMax}
                    stroke="#f43f5e"
                    strokeDasharray="3 3"
                    label={{
                      value: `Max +${watch.targetRateMax} s/d`,
                      fill: '#e11d48',
                      fontSize: 10,
                      position: 'top',
                    }}
                  />
                )}
                {watch.targetRateMin !== undefined && (
                  <ReferenceLine
                    y={watch.targetRateMin}
                    stroke="#f43f5e"
                    strokeDasharray="3 3"
                    label={{
                      value: `Min ${watch.targetRateMin} s/d`,
                      fill: '#e11d48',
                      fontSize: 10,
                      position: 'bottom',
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="rate_spd"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#1d4ed8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
