import React, { useState, useEffect } from 'react';
import { WatchPosition, MeasurementRaw, CalculatedMeasurement } from '../types';
import { WATCH_POSITIONS, computeSecondsDiff, formatSeconds } from '../utils/calculations';
import { X, Clock, AlertTriangle, Check, Shield, RotateCw } from 'lucide-react';

interface AddMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (measurement: MeasurementRaw) => void;
  watchId: string;
  initialData?: CalculatedMeasurement | null;
  defaultIsReset?: boolean;
  prefilledRealTime?: string;
}

export const AddMeasurementModal: React.FC<AddMeasurementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  watchId,
  initialData,
  defaultIsReset = false,
  prefilledRealTime,
}) => {
  const getNowIso = () => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  };

  const [realTime, setRealTime] = useState<string>(getNowIso());
  const [watchTime, setWatchTime] = useState<string>(getNowIso());
  const [position, setPosition] = useState<WatchPosition>('WORN_WRIST');
  const [isReset, setIsReset] = useState<boolean>(defaultIsReset);
  const [notes, setNotes] = useState<string>('');

  // Quick delta adjustment in seconds helper
  const [manualOffsetSeconds, setManualOffsetSeconds] = useState<number>(0);

  useEffect(() => {
    if (initialData) {
      setRealTime(initialData.realTime);
      setWatchTime(initialData.watchTime);
      setPosition(initialData.position);
      setIsReset(initialData.isReset || false);
      setNotes(initialData.notes || '');
      const diff = computeSecondsDiff(initialData.realTime, initialData.watchTime);
      setManualOffsetSeconds(diff);
    } else {
      const nowStr = prefilledRealTime || getNowIso();
      setRealTime(nowStr);
      // By default, watch time matches real time (0 deviation on reset) or previous
      setWatchTime(nowStr);
      setManualOffsetSeconds(0);
      setIsReset(defaultIsReset);
      setPosition('WORN_WRIST');
      setNotes('');
    }
  }, [initialData, defaultIsReset, prefilledRealTime, isOpen]);

  if (!isOpen) return null;

  const currentDiff = computeSecondsDiff(realTime, watchTime);

  const handleSyncWithSystemNow = () => {
    const now = getNowIso();
    setRealTime(now);
    // update watch time preserving current offset
    applyOffset(now, manualOffsetSeconds);
  };

  const applyOffset = (baseIso: string, offsetSec: number) => {
    const baseDate = new Date(baseIso);
    const targetDate = new Date(baseDate.getTime() + offsetSec * 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const isoStr = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}T${pad(targetDate.getHours())}:${pad(targetDate.getMinutes())}:${pad(targetDate.getSeconds())}`;
    setWatchTime(isoStr);
    setManualOffsetSeconds(offsetSec);
  };

  const handleOffsetChange = (newOffset: number) => {
    setManualOffsetSeconds(newOffset);
    applyOffset(realTime, newOffset);
  };

  const handleWatchTimeInputChange = (val: string) => {
    setWatchTime(val);
    if (realTime && val) {
      const diff = computeSecondsDiff(realTime, val);
      setManualOffsetSeconds(diff);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialData ? initialData.id : `m-${Date.now()}`,
      watchId,
      realTime,
      watchTime,
      position,
      isReset,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div
      id="add-measurement-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {initialData ? 'Editar Medición' : isReset ? 'Puesta en Hora / Reinicio tras Parada' : 'Nueva Medición de Precisión'}
              </h3>
              <p className="text-xs text-slate-400">
                Compara la hora del reloj automático con la hora real de referencia
              </p>
            </div>
          </div>
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Reset run switch */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              isReset
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                id="modal-is-reset-checkbox"
                type="checkbox"
                checked={isReset}
                onChange={e => setIsReset(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
              />
              <div className="text-xs">
                <span className="font-bold block">
                  Reinicio de conteo (El reloj se paró o lo he puesto en hora)
                </span>
                <span className="text-[11px] text-slate-500">
                  Marca esta opción si el reloj agotó su reserva de marcha o si ajustaste la aguja horaria/minutero. Iniciará un nuevo ciclo acumulado.
                </span>
              </div>
            </label>
          </div>

          {/* Time Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Real Reference Time */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Hora Real (Referencia)
                </label>
                <button
                  type="button"
                  id="modal-use-now-btn"
                  onClick={handleSyncWithSystemNow}
                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-medium underline"
                >
                  Hora actual
                </button>
              </div>
              <input
                id="modal-real-time-input"
                type="datetime-local"
                step="1"
                required
                value={realTime.slice(0, 19)}
                onChange={e => {
                  setRealTime(e.target.value);
                  if (watchTime) {
                    const diff = computeSecondsDiff(e.target.value, watchTime);
                    setManualOffsetSeconds(diff);
                  }
                }}
                className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20"
              />
            </div>

            {/* 2. Watch Time */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Hora del Reloj Automático
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const pad = (n: number) => n.toString().padStart(2, '0');
                    const baseIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
                    const watchZeroIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
                    setRealTime(baseIso);
                    setWatchTime(watchZeroIso);
                    setManualOffsetSeconds(computeSecondsDiff(baseIso, watchZeroIso));
                  }}
                  className="text-[10px] text-sky-600 hover:text-sky-700 font-medium underline"
                  title="Ajusta el reloj a :00 segundos con la hora real de este instante"
                >
                  Segundero en :00 ahora
                </button>
              </div>
              <input
                id="modal-watch-time-input"
                type="datetime-local"
                step="1"
                required
                value={watchTime.slice(0, 19)}
                onChange={e => handleWatchTimeInputChange(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20"
              />
            </div>
          </div>

          {/* Quick Offset Stepper & Live Preview */}
          <div className="bg-slate-100/70 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-700">
                Ajuste rápido de desviación (segundos):
              </span>
              <div className="font-mono font-bold text-sm">
                <span
                  className={
                    currentDiff > 0
                      ? 'text-emerald-600'
                      : currentDiff < 0
                      ? 'text-amber-600'
                      : 'text-slate-600'
                  }
                >
                  {formatSeconds(currentDiff)}
                </span>
                <span className="text-[11px] font-normal text-slate-500 ml-1">
                  ({currentDiff > 0 ? 'Adelanta' : currentDiff < 0 ? 'Atrasa' : 'Exacto'})
                </span>
              </div>
            </div>

            {/* Quick buttons */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {[-10, -5, -2, -1, 0, +1, +2, +5, +10].map(s => (
                <button
                  type="button"
                  key={s}
                  onClick={() => handleOffsetChange(s)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-all ${
                    Math.round(currentDiff) === s
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-bold'
                      : 'bg-white hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {s > 0 ? `+${s}s` : `${s}s`}
                </button>
              ))}
            </div>
          </div>

          {/* Position and State Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Posición y Estado del Reloj durante este periodo:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {WATCH_POSITIONS.map(pos => {
                const isSelected = position === pos.id;
                return (
                  <button
                    type="button"
                    key={pos.id}
                    id={`pos-option-${pos.id}`}
                    onClick={() => setPosition(pos.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        pos.category === 'uso'
                          ? isSelected ? 'bg-emerald-400' : 'bg-blue-500'
                          : isSelected ? 'bg-sky-400' : 'bg-slate-400'
                      }`}
                    />
                    <div className="truncate">
                      <div className="font-semibold truncate">{pos.shortLabel}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Observaciones / Notas (opcional)
            </label>
            <input
              id="modal-notes-input"
              type="text"
              placeholder="Ej: Reposo nocturno en mesilla, tras 8h de oficina, etc."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            />
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              id="cancel-modal-btn"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="save-measurement-modal-btn"
              className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition-colors"
            >
              {initialData ? 'Guardar Cambios' : 'Registrar Medición'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
