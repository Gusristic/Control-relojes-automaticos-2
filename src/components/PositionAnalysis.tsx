import React from 'react';
import { CalculatedMeasurement, PositionStats, Watch } from '../types';
import { calculatePositionStats, formatSeconds, formatSpd, getPositionInfo } from '../utils/calculations';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Compass, Lightbulb, Clock, CheckCircle2, TrendingUp, RotateCw } from 'lucide-react';

interface PositionAnalysisProps {
  watch: Watch;
  measurements: CalculatedMeasurement[];
}

export const PositionAnalysis: React.FC<PositionAnalysisProps> = ({ watch, measurements }) => {
  const stats: PositionStats[] = calculatePositionStats(measurements);

  // Overall calculations
  const totalMeasurements = measurements.length;
  const validRates = measurements
    .map(m => m.intervalRate_spd)
    .filter((r): r is number => r !== undefined);

  const globalAvgRate = validRates.length > 0
    ? Math.round((validRates.reduce((a, b) => a + b, 0) / validRates.length) * 10) / 10
    : 0;

  const maxGain = validRates.length > 0 ? Math.max(...validRates) : 0;
  const maxLoss = validRates.length > 0 ? Math.min(...validRates) : 0;

  // Find best position to compensate drift
  // If watch runs fast (globalAvgRate > 0), find slowest position (lowest avgRate)
  // If watch runs slow (globalAvgRate < 0), find fastest position (highest avgRate)
  const restingPositions = stats.filter(
    s => s.position !== 'WORN_WRIST' && s.position !== 'WATCH_WINDER' && s.totalHours > 0
  );

  const compensatingPosition = restingPositions.length > 0
    ? globalAvgRate > 0
      ? [...restingPositions].sort((a, b) => a.avgRate_spd - b.avgRate_spd)[0]
      : [...restingPositions].sort((a, b) => b.avgRate_spd - a.avgRate_spd)[0]
    : null;

  // Chart data
  const chartData = stats.map(s => ({
    name: s.shortLabel,
    fullName: s.label,
    rate: s.avgRate_spd,
    hours: s.totalHours,
    count: s.count,
  }));

  return (
    <div id="position-analysis-container" className="space-y-4">
      {/* 1. Global Totals Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            Tasa Media Global
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {formatSpd(globalAvgRate)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Promedio de todos los tramos</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            Mediciones / Sesión
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {totalMeasurements} medidas
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Última desv: {measurements.length > 0 ? formatSeconds(measurements[measurements.length - 1].diffSeconds) : '-'}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Mayor Adelanto
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            {formatSpd(maxGain)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Pico máximo positivo</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Mayor Atraso
          </div>
          <div className="text-xl font-bold font-mono text-amber-600 mt-1">
            {formatSpd(maxLoss)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Pico máximo de atraso</div>
        </div>
      </div>

      {/* 2. Horological Compensation Advice */}
      {compensatingPosition && (
        <div
          id="compensation-advice-banner"
          className="bg-sky-50/80 border border-sky-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-sky-900"
        >
          <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sky-950 text-sm">
              Consejo de regulación nocturna por posición
            </div>
            <p className="mt-0.5 text-sky-800 leading-relaxed">
              Tu reloj <strong>{watch.brand} {watch.name}</strong> tiene una tasa media de{' '}
              <span className="font-mono font-semibold">{formatSpd(globalAvgRate)}</span>.{' '}
              {globalAvgRate > 0 ? (
                <>
                  Dado que tiende a adelantar ligeramente, cuando te lo quites a dormir déjalo en reposo en{' '}
                  <span className="font-semibold underline decoration-sky-400 underline-offset-2">
                    {compensatingPosition.label}
                  </span>{' '}
                  (donde rinde a <span className="font-mono font-semibold">{formatSpd(compensatingPosition.avgRate_spd)}</span>),
                  para compensar y mantener el reloj en hora perfecta sin tocar la corona.
                </>
              ) : globalAvgRate < 0 ? (
                <>
                  Dado que tiende a atrasar, cuando no lo uses déjalo en reposo en{' '}
                  <span className="font-semibold underline decoration-sky-400 underline-offset-2">
                    {compensatingPosition.label}
                  </span>{' '}
                  (donde rinde a <span className="font-mono font-semibold">{formatSpd(compensatingPosition.avgRate_spd)}</span>),
                  para recuperar los segundos perdidos.
                </>
              ) : (
                <>El reloj se encuentra perfectamente balanceado a 0.0 s/d en promedio.</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* 3. Graphic: Bar Chart of Deviations by Position */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-slate-700" />
            <span className="font-bold text-slate-800 text-sm">
              Rendimiento y Tasa Diaria (segundos/día) por Posición
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">0 s/d = Precisión perfecta</span>
        </div>

        {chartData.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Registra al menos 2 mediciones separadas en el tiempo para ver el rendimiento por posición.
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  unit=" s/d"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  formatter={(value: any) => [`${formatSpd(Number(value))}`, 'Tasa media']}
                  labelFormatter={(label: any) => `Posición: ${label}`}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => {
                    const isPositive = entry.rate >= 0;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={isPositive ? '#059669' : '#d97706'}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 4. Detailed Table by Position */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="font-bold text-slate-800 text-xs">
            Desglose Detallado: Desviación por Posición, Muñeca y Cargador
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            {stats.length} posiciones observadas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Posición / Estado</th>
                <th className="py-2 px-3 text-center">Tipo</th>
                <th className="py-2 px-3 text-center">Registros</th>
                <th className="py-2 px-3 text-right">Horas Totales</th>
                <th className="py-2 px-3 text-right">Tasa Media (s/d)</th>
                <th className="py-2 px-3 text-right">Rango (Mín / Máx)</th>
                <th className="py-2 px-3">Diagnóstico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {stats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                    Sin mediciones suficientes para calcular el desglose por posición.
                  </td>
                </tr>
              ) : (
                stats.map(s => {
                  const posInfo = getPositionInfo(s.position);
                  const isWinder = s.position === 'WATCH_WINDER';
                  const isWrist = s.position === 'WORN_WRIST';

                  return (
                    <tr key={s.position} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-900 flex items-center gap-2">
                        {isWinder ? (
                          <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                        ) : isWrist ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                        )}
                        <span>{s.label}</span>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            posInfo.category === 'uso'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {posInfo.category === 'uso' ? 'Uso / Carga' : 'Posición estática'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono">{s.count}</td>

                      <td className="py-2.5 px-3 text-right font-mono">
                        {s.totalHours > 0 ? `${s.totalHours}h` : '—'}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        <span
                          className={
                            s.avgRate_spd > 0
                              ? 'text-emerald-700'
                              : s.avgRate_spd < 0
                              ? 'text-amber-700'
                              : 'text-slate-600'
                          }
                        >
                          {formatSpd(s.avgRate_spd)}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-500">
                        {s.totalHours > 0
                          ? `${formatSeconds(s.minRate_spd, false)} / ${formatSeconds(s.maxRate_spd, false)}`
                          : '—'}
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block text-[11px] ${
                            s.avgRate_spd > 2
                              ? 'text-emerald-700 font-medium'
                              : s.avgRate_spd < -2
                              ? 'text-amber-700 font-medium'
                              : 'text-slate-600'
                          }`}
                        >
                          {s.avgRate_spd > 2
                            ? 'Adelanto moderado'
                            : s.avgRate_spd > 0
                            ? 'Adelanto leve (óptimo)'
                            : s.avgRate_spd < -2
                            ? 'Atraso apreciable'
                            : s.avgRate_spd < 0
                            ? 'Atraso leve'
                            : 'Neutro perfecto'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
