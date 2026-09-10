import React, { useState, useEffect } from 'react';
import { Watch } from '../types';
import { X, Watch as WatchIcon, Trash2 } from 'lucide-react';

interface WatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (watch: Watch) => void;
  onDelete?: (watchId: string) => void;
  initialWatch?: Watch | null;
  canDelete: boolean;
}

const COLOR_OPTIONS = [
  '#0284c7', // Sky blue
  '#10b981', // Emerald green
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#64748b', // Slate
  '#0f172a', // Midnight black
  '#dc2626', // Crimson red
];

export const WatchModal: React.FC<WatchModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialWatch,
  canDelete,
}) => {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [name, setName] = useState('');
  const [caliber, setCaliber] = useState('');
  const [targetRateMin, setTargetRateMin] = useState<number>(-10);
  const [targetRateMax, setTargetRateMax] = useState<number>(15);
  const [powerReserveHours, setPowerReserveHours] = useState<number>(40);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [notes, setNotes] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setConfirmDelete(false);
    if (initialWatch) {
      setBrand(initialWatch.brand);
      setModel(initialWatch.model);
      setName(initialWatch.name);
      setCaliber(initialWatch.caliber || '');
      setTargetRateMin(initialWatch.targetRateMin ?? -10);
      setTargetRateMax(initialWatch.targetRateMax ?? 15);
      setPowerReserveHours(initialWatch.powerReserveHours ?? 40);
      setColor(initialWatch.color || COLOR_OPTIONS[0]);
      setNotes(initialWatch.notes || '');
    } else {
      setBrand('');
      setModel('');
      setName('');
      setCaliber('');
      setTargetRateMin(-10);
      setTargetRateMax(15);
      setPowerReserveHours(40);
      setColor(COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)]);
      setNotes('');
    }
  }, [initialWatch, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialWatch ? initialWatch.id : `w-${Date.now()}`,
      brand: brand.trim() || 'Reloj',
      model: model.trim() || 'Automático',
      name: name.trim() || `${brand} ${model}`.trim(),
      caliber: caliber.trim(),
      targetRateMin: Number(targetRateMin),
      targetRateMax: Number(targetRateMax),
      powerReserveHours: Number(powerReserveHours),
      color,
      notes: notes.trim(),
      createdAt: initialWatch ? initialWatch.createdAt : new Date().toISOString(),
    });
    onClose();
  };

  const handleApplyPreset = (type: 'COSC' | 'SEIKO' | 'SWISS_STD') => {
    if (type === 'COSC') {
      setTargetRateMin(-4);
      setTargetRateMax(6);
    } else if (type === 'SEIKO') {
      setTargetRateMin(-15);
      setTargetRateMax(25);
    } else if (type === 'SWISS_STD') {
      setTargetRateMin(-10);
      setTargetRateMax(15);
    }
  };

  return (
    <div
      id="watch-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WatchIcon className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold">
              {initialWatch ? 'Editar Ficha del Reloj' : 'Añadir Nuevo Reloj a la Colección'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Brand & Model */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Marca</label>
              <input
                id="watch-brand-input"
                type="text"
                placeholder="Ej: Seiko, Tissot, Rolex"
                required
                value={brand}
                onChange={e => setBrand(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Modelo / Referencia</label>
              <input
                id="watch-model-input"
                type="text"
                placeholder="Ej: PRX, Submariner, SKX"
                required
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20"
              />
            </div>
          </div>

          {/* Caliber & Power Reserve */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Calibre / Movimiento</label>
              <input
                id="watch-caliber-input"
                type="text"
                placeholder="Ej: 4R36, Powermatic 80, NH35"
                value={caliber}
                onChange={e => setCaliber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Reserva de marcha (horas)</label>
              <input
                id="watch-power-reserve-input"
                type="number"
                min="10"
                max="240"
                value={powerReserveHours}
                onChange={e => setPowerReserveHours(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 font-mono"
              />
            </div>
          </div>

          {/* Tolerance specifications */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700">
                Tolerancia de Fábrica Esperada (s/día)
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('COSC')}
                  className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-600 hover:bg-slate-100"
                  title="Cronómetro COSC (-4 a +6 s/d)"
                >
                  COSC (-4/+6)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('SEIKO')}
                  className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-600 hover:bg-slate-100"
                  title="Estándar Seiko (-15 a +25 s/d)"
                >
                  Seiko
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block">Mínimo (Atraso s/d)</span>
                <input
                  id="target-rate-min-input"
                  type="number"
                  value={targetRateMin}
                  onChange={e => setTargetRateMin(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Máximo (Adelanto s/d)</span>
                <input
                  id="target-rate-max-input"
                  type="number"
                  value={targetRateMax}
                  onChange={e => setTargetRateMax(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Color tag */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Color de identificación</label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-slate-900 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Notas sobre el reloj</label>
            <textarea
              id="watch-notes-textarea"
              rows={2}
              placeholder="Ej: Regulado por relojero en 2025, suele adelantar con esfera arriba..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {initialWatch && onDelete ? (
              confirmDelete ? (
                <div className="flex items-center gap-1.5 animate-in fade-in">
                  <button
                    type="button"
                    id="confirm-delete-watch-btn"
                    onClick={() => {
                      onDelete(initialWatch.id);
                      onClose();
                    }}
                    className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Confirmar Borrado
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  id="delete-watch-btn"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar reloj</span>
                </button>
              )
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="save-watch-btn"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors shadow-sm"
              >
                {initialWatch ? 'Guardar Reloj' : 'Crear Ficha'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
