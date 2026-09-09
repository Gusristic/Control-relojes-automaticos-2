import React from 'react';
import { Watch } from '../types';
import { Watch as WatchIcon, Plus, Settings, Cpu, ShieldCheck, Trash2 } from 'lucide-react';

interface WatchSelectorProps {
  watches: Watch[];
  selectedWatchId: string;
  onSelectWatch: (watchId: string) => void;
  onAddWatch: () => void;
  onEditWatch: (watch: Watch) => void;
  onDeleteWatch?: (watchId: string) => void;
}

export const WatchSelector: React.FC<WatchSelectorProps> = ({
  watches,
  selectedWatchId,
  onSelectWatch,
  onAddWatch,
  onEditWatch,
  onDeleteWatch,
}) => {
  const currentWatch = watches.find(w => w.id === selectedWatchId) || watches[0];

  return (
    <div id="watch-selector-container" className="space-y-3">
      {/* Tab bar of watches */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <div className="flex items-center gap-2">
          {watches.map(watch => {
            const isSelected = watch.id === selectedWatchId;
            return (
              <button
                key={watch.id}
                id={`watch-tab-${watch.id}`}
                onClick={() => onSelectWatch(watch.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'bg-white shadow-sm border-slate-300 text-slate-900 ring-2 ring-slate-900/10'
                    : 'bg-slate-100 hover:bg-slate-200/80 border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: watch.color || '#3b82f6' }}
                />
                <span className="font-semibold">{watch.brand}</span>
                <span className="text-slate-500 font-normal">{watch.name}</span>
              </button>
            );
          })}

          <button
            id="add-new-watch-tab-btn"
            onClick={onAddWatch}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-200/70 hover:bg-slate-300/70 text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap border border-dashed border-slate-300"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Reloj</span>
          </button>
        </div>
      </div>

      {/* Selected Watch Info Bar */}
      {currentWatch && (
        <div
          id="current-watch-banner"
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ backgroundColor: currentWatch.color || '#0284c7' }}
            >
              <WatchIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 text-sm">
                  {currentWatch.brand} {currentWatch.model || currentWatch.name}
                </span>
                {currentWatch.caliber && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 text-[11px] font-mono">
                    <Cpu className="w-3 h-3 text-slate-500" />
                    {currentWatch.caliber}
                  </span>
                )}
                {(currentWatch.targetRateMin !== undefined || currentWatch.targetRateMax !== undefined) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-mono">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Tolerancia: {currentWatch.targetRateMin ?? -15} / +{currentWatch.targetRateMax ?? 25} s/d
                  </span>
                )}
                {currentWatch.powerReserveHours && (
                  <span className="text-slate-500 text-[11px]">
                    Reserva: {currentWatch.powerReserveHours}h
                  </span>
                )}
              </div>
              {currentWatch.notes && (
                <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">
                  {currentWatch.notes}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              id="edit-current-watch-btn"
              onClick={() => onEditWatch(currentWatch)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-md font-medium text-xs shadow-2xs transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Editar ficha</span>
            </button>

            {onDeleteWatch && (
              <button
                id="delete-current-watch-quick-btn"
                onClick={() => onDeleteWatch(currentWatch.id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 bg-white border border-rose-200 rounded-md font-medium text-xs shadow-2xs transition-colors"
                title={`Eliminar ${currentWatch.brand} ${currentWatch.name}`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">Eliminar</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
