import React, { useState, useEffect, useMemo } from 'react';
import { Watch, WatchPosition, CalculatedMeasurement } from '../types';
import {
  WATCH_POSITIONS,
  computeSecondsDiff,
  formatSeconds,
  formatSpd,
  combineDateAndTime,
  getNowIso,
} from '../utils/calculations';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  RotateCcw,
  Play,
  Pause,
  Plus,
  Send,
  Sliders,
  ChevronRight,
} from 'lucide-react';

interface WatchTimeComparatorProps {
  currentWatch: Watch | null;
  lastMeasurement: CalculatedMeasurement | null;
  onSaveMeasurement: (
    realTimeIso: string,
    watchTimeIso: string,
    position: WatchPosition,
    isReset: boolean,
    notes: string
  ) => void;
  onOpenNewWatchModal: () => void;
}

export const WatchTimeComparator: React.FC<WatchTimeComparatorProps> = ({
  currentWatch,
  lastMeasurement,
  onSaveMeasurement,
  onOpenNewWatchModal,
}) => {
  // Live reference system clock
  const [liveDate, setLiveDate] = useState<Date>(new Date());
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [frozenDate, setFrozenDate] = useState<Date | null>(null);

  // Update clock every 100ms
  useEffect(() => {
    if (isFrozen) return;
    const interval = setInterval(() => {
      setLiveDate(new Date());
    }, 100);
    return () => clearInterval(interval);
  }, [isFrozen]);

  const activeDate = isFrozen && frozenDate ? frozenDate : liveDate;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const realHoursStr = pad(activeDate.getHours());
  const realMinutesStr = pad(activeDate.getMinutes());
  const realSecondsStr = pad(activeDate.getSeconds());
  const tenths = Math.floor(activeDate.getMilliseconds() / 100);

  // Watch Time Direct Inputs
  const [watchHours, setWatchHours] = useState<string>(realHoursStr);
  const [watchMinutes, setWatchMinutes] = useState<string>(realMinutesStr);
  const [watchSeconds, setWatchSeconds] = useState<string>(realSecondsStr);
  const [isFollowRealTime, setIsFollowRealTime] = useState<boolean>(true);

  // Watch Position & Reset state
  const [position, setPosition] = useState<WatchPosition>('WORN_WRIST');
  const [isReset, setIsReset] = useState<boolean>(!lastMeasurement);
  const [notes, setNotes] = useState<string>('');
  const [savedFlash, setSavedFlash] = useState<boolean>(false);

  // Keep watch time synced with real time while user hasn't typed anything different
  useEffect(() => {
    if (isFollowRealTime && !isFrozen) {
      setWatchHours(realHoursStr);
      setWatchMinutes(realMinutesStr);
      setWatchSeconds(realSecondsStr);
    }
  }, [realHoursStr, realMinutesStr, realSecondsStr, isFollowRealTime, isFrozen]);

  // When there is no previous measurement, default isReset to true
  useEffect(() => {
    if (!lastMeasurement) {
      setIsReset(true);
    }
  }, [lastMeasurement]);

  // Construct ISO strings
  const realTimeIso = useMemo(() => {
    const d = activeDate;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }, [activeDate]);

  const watchTimeIso = useMemo(() => {
    const timeStr = `${watchHours || '00'}:${watchMinutes || '00'}:${watchSeconds || '00'}`;
    return combineDateAndTime(realTimeIso, timeStr);
  }, [realTimeIso, watchHours, watchMinutes, watchSeconds]);

  // AUTOMATIC CALCULATION: Difference in seconds (watch - real)
  const diffSeconds = useMemo(() => {
    return computeSecondsDiff(realTimeIso, watchTimeIso);
  }, [realTimeIso, watchTimeIso]);

  // Evolution vs last measurement calculation
  const evolutionStats = useMemo(() => {
    if (!lastMeasurement || isReset) return null;

    const prevRealDate = new Date(lastMeasurement.realTime);
    const currRealDate = new Date(realTimeIso);
    const diffMs = currRealDate.getTime() - prevRealDate.getTime();
    const hours = Math.round((diffMs / (1000 * 3600)) * 10) / 10;

    if (hours <= 0) return null;

    // Delta between current deviation and last deviation
    const deltaSeconds = Math.round((diffSeconds - lastMeasurement.diffSeconds) * 10) / 10;
    const rateSpd = Math.round(((deltaSeconds * 24) / hours) * 10) / 10;

    return {
      hours,
      deltaSeconds,
      rateSpd,
    };
  }, [lastMeasurement, isReset, diffSeconds, realTimeIso]);

  // Handlers
  const handleFreezeToggle = () => {
    if (!isFrozen) {
      const now = new Date();
      setFrozenDate(now);
      setIsFrozen(true);
      setIsFollowRealTime(false);
      setWatchHours(pad(now.getHours()));
      setWatchMinutes(pad(now.getMinutes()));
      setWatchSeconds(pad(now.getSeconds()));
    } else {
      setIsFrozen(false);
      setFrozenDate(null);
      setIsFollowRealTime(true);
    }
  };

  // Quick action: user's second hand just crossed :00
  const handleSecondHandCrossedZero = () => {
    const now = new Date();
    // Freeze at this split second
    setFrozenDate(now);
    setIsFrozen(true);
    setIsFollowRealTime(false);
    // Watch second hand is exactly 00
    setWatchHours(pad(now.getHours()));
    setWatchMinutes(pad(now.getMinutes()));
    setWatchSeconds('00');
  };

  // Adjust seconds directly with quick step buttons
  const handleStepSeconds = (delta: number) => {
    setIsFollowRealTime(false);
    let sec = parseInt(watchSeconds, 10) || 0;
    let min = parseInt(watchMinutes, 10) || 0;
    let hour = parseInt(watchHours, 10) || 0;

    sec += delta;
    while (sec >= 60) {
      sec -= 60;
      min += 1;
    }
    while (sec < 0) {
      sec += 60;
      min -= 1;
    }
    while (min >= 60) {
      min -= 60;
      hour = (hour + 1) % 24;
    }
    while (min < 0) {
      min += 60;
      hour = (hour - 1 + 24) % 24;
    }

    setWatchHours(pad(hour));
    setWatchMinutes(pad(min));
    setWatchSeconds(pad(sec));
  };

  const handleSetExact = () => {
    setWatchHours(realHoursStr);
    setWatchMinutes(realMinutesStr);
    setWatchSeconds(realSecondsStr);
    setIsFollowRealTime(true);
  };

  const handleSave = () => {
    if (!currentWatch) {
      onOpenNewWatchModal();
      return;
    }

    onSaveMeasurement(realTimeIso, watchTimeIso, position, isReset, notes);

    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);

    // Unfreeze and reset form for next observation
    setIsFrozen(false);
    setFrozenDate(null);
    setIsFollowRealTime(true);
    setIsReset(false);
    setNotes('');
  };

  return (
    <div
      id="watch-time-comparator-station"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white shadow-xl relative overflow-hidden"
    >
      {/* Background Subtle Accent */}
      <div className="absolute -right-16 -top-16 w-56 h-56 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Comparador Directo de Desviación</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-normal border border-emerald-500/30">
                Lectura Automática
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Pon la hora que marca tu reloj: la hora real se lee automáticamente y calcula la desviación al instante.
            </p>
          </div>
        </div>

        {/* Current Watch Badge */}
        {currentWatch ? (
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentWatch.color || '#10b981' }} />
            <span className="font-semibold text-slate-200">
              {currentWatch.brand} {currentWatch.name}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({currentWatch.targetRateMin ?? -15}s a +{currentWatch.targetRateMax ?? 25}s/d)
            </span>
          </div>
        ) : (
          <button
            onClick={onOpenNewWatchModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear mi primer reloj</span>
          </button>
        )}
      </div>

      {/* Main Dual Clock & Comparison Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 py-4 items-center">
        {/* 1. Real System Reference Clock (Left, 4 cols) */}
        <div className="lg:col-span-4 bg-slate-950/80 rounded-xl p-3.5 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${isFrozen ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}`}
              />
              {isFrozen ? 'Hora Real Congelada' : 'Hora Real de Referencia'}
            </span>

            <button
              id="comparator-freeze-toggle-btn"
              type="button"
              onClick={handleFreezeToggle}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                isFrozen
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title={isFrozen ? 'Reanudar lectura en vivo' : 'Congelar instante exacto'}
            >
              {isFrozen ? <Play className="w-3 h-3 text-amber-300" /> : <Pause className="w-3 h-3 text-slate-400" />}
              <span>{isFrozen ? 'Reanudar' : 'Congelar'}</span>
            </button>
          </div>

          {/* Digits Display */}
          <div className="font-mono text-center py-1">
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {realHoursStr}:{realMinutesStr}:{realSecondsStr}
              <span className="text-emerald-400 text-base font-normal ml-1">.{tenths}</span>
            </div>
            <div className="text-[11px] text-slate-400 capitalize pt-0.5">
              {activeDate.toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </div>
          </div>

          {/* Quick Trigger Button: Second Hand Crossed Zero */}
          <button
            id="comparator-mark-zero-btn"
            type="button"
            onClick={handleSecondHandCrossedZero}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-all active:scale-98"
            title="Pulsa en el segundo exacto en que la aguja de segundos de tu reloj cruce el :00"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>¡Mi segundero marca :00 ahora!</span>
          </button>
        </div>

        {/* 2. Direct Watch Time Entry (Middle, 4 cols) */}
        <div className="lg:col-span-4 bg-slate-950/80 rounded-xl p-3.5 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400 flex items-center gap-1">
              Hora que Marca Tu Reloj
            </span>
            <button
              type="button"
              onClick={handleSetExact}
              className="text-[10px] text-sky-400 hover:text-sky-300 font-medium underline"
            >
              Poner igual a hora real
            </button>
          </div>

          {/* Interactive HH : MM : SS Inputs */}
          <div className="flex items-center justify-center gap-1.5 py-1">
            <div className="flex flex-col items-center">
              <input
                id="watch-hours-input"
                type="number"
                min="0"
                max="23"
                value={watchHours}
                onChange={e => {
                  setIsFollowRealTime(false);
                  setWatchHours(e.target.value.padStart(2, '0').slice(-2));
                }}
                className="w-14 h-12 bg-slate-900 border border-slate-700 rounded-lg text-center font-mono text-2xl font-bold text-white focus:border-sky-500 focus:outline-none"
                placeholder="HH"
              />
              <span className="text-[9px] text-slate-400 uppercase mt-0.5">Horas</span>
            </div>

            <span className="text-2xl font-bold text-slate-500 pb-4">:</span>

            <div className="flex flex-col items-center">
              <input
                id="watch-minutes-input"
                type="number"
                min="0"
                max="59"
                value={watchMinutes}
                onChange={e => {
                  setIsFollowRealTime(false);
                  setWatchMinutes(e.target.value.padStart(2, '0').slice(-2));
                }}
                className="w-14 h-12 bg-slate-900 border border-slate-700 rounded-lg text-center font-mono text-2xl font-bold text-white focus:border-sky-500 focus:outline-none"
                placeholder="MM"
              />
              <span className="text-[9px] text-slate-400 uppercase mt-0.5">Minutos</span>
            </div>

            <span className="text-2xl font-bold text-slate-500 pb-4">:</span>

            <div className="flex flex-col items-center">
              <input
                id="watch-seconds-input"
                type="number"
                min="0"
                max="59"
                value={watchSeconds}
                onChange={e => {
                  setIsFollowRealTime(false);
                  setWatchSeconds(e.target.value.padStart(2, '0').slice(-2));
                }}
                className="w-14 h-12 bg-slate-900 border border-slate-700 rounded-lg text-center font-mono text-2xl font-bold text-sky-400 focus:border-sky-500 focus:outline-none"
                placeholder="SS"
              />
              <span className="text-[9px] text-sky-400 font-bold uppercase mt-0.5">Segundos</span>
            </div>
          </div>

          {/* Quick seconds adjustments */}
          <div className="flex items-center justify-center gap-1 flex-wrap">
            {[-5, -2, -1, +1, +2, +5].map(step => (
              <button
                type="button"
                key={step}
                onClick={() => handleStepSeconds(step)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-mono font-medium transition-colors"
              >
                {step > 0 ? `+${step}s` : `${step}s`}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Automatic Calculation Card (Right, 4 cols) */}
        <div className="lg:col-span-4 bg-slate-950/90 rounded-xl p-3.5 border border-slate-800 space-y-2">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Cálculo Automático de Desviación
          </div>

          {/* Main Deviation Result Box */}
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-between ${
              diffSeconds > 0
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : diffSeconds < 0
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            <div>
              <div className="text-2xl font-black font-mono tracking-tight leading-none">
                {formatSeconds(diffSeconds)}
              </div>
              <div className="text-[11px] font-medium pt-1">
                {diffSeconds > 0
                  ? 'Adelanto respecto a hora real'
                  : diffSeconds < 0
                  ? 'Atraso respecto a hora real'
                  : 'En perfecta sincronía (0.0s)'}
              </div>
            </div>

            <div className="text-right text-[10px] text-slate-400 space-y-0.5">
              {isReset ? (
                <span className="inline-block bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-medium border border-amber-500/30">
                  Nuevo inicio / Puesta en hora
                </span>
              ) : evolutionStats ? (
                <>
                  <div className="font-semibold text-slate-200">
                    Evolución: {formatSeconds(evolutionStats.deltaSeconds)}
                  </div>
                  <div className="font-mono text-emerald-400">
                    Tasa: {formatSpd(evolutionStats.rateSpd)}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    en {evolutionStats.hours}h de tramo
                  </div>
                </>
              ) : (
                <span>Primera medición</span>
              )}
            </div>
          </div>

          {/* Position Quick Selector */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 block">
              Posición / Soporte del reloj:
            </label>
            <select
              id="comparator-position-select"
              value={position}
              onChange={e => setPosition(e.target.value as WatchPosition)}
              className="w-full text-xs font-medium bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {WATCH_POSITIONS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.label} ({p.category === 'uso' ? 'Uso Activo / Cargador' : 'Reposo'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Footer Controls & Save Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
        {/* Reset Checkbox & Notes */}
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <label className="flex items-center gap-2 cursor-pointer bg-slate-800/60 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/60 transition-colors">
            <input
              id="comparator-is-reset-checkbox"
              type="checkbox"
              checked={isReset}
              onChange={e => setIsReset(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 text-amber-500 focus:ring-amber-400"
            />
            <span className="font-semibold text-amber-300">
              Reinicio de ciclo (el reloj se paró o lo puse en hora)
            </span>
          </label>

          <input
            id="comparator-notes-input"
            type="text"
            placeholder="Nota opcional (ej: noche en mesita, gimnasio...)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="text-xs bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500 flex-1 min-w-[200px]"
          />
        </div>

        {/* Big Save Button */}
        <div className="flex items-center gap-2">
          {savedFlash && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              ¡Medición guardada!
            </span>
          )}

          <button
            id="comparator-save-measurement-btn"
            type="button"
            onClick={handleSave}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30 transition-all text-xs sm:text-sm"
          >
            <Send className="w-4 h-4" />
            <span>Registrar Medición Ahora</span>
          </button>
        </div>
      </div>
    </div>
  );
};
