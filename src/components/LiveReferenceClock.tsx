import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, Zap, PlusCircle } from 'lucide-react';

interface LiveReferenceClockProps {
  onQuickAdd: (currentIsoTime: string) => void;
  onOpenResetModal: (currentIsoTime: string) => void;
}

export const LiveReferenceClock: React.FC<LiveReferenceClockProps> = ({
  onQuickAdd,
  onOpenResetModal,
}) => {
  const [time, setTime] = useState<Date>(new Date());
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const handleSyncFlash = () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 500);
  };

  const getIsoCurrentTime = () => {
    const now = new Date();
    // Local ISO string YYYY-MM-DDTHH:mm:ss
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  };

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const tenths = Math.floor(time.getMilliseconds() / 100);

  const formattedDate = time.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      id="live-reference-clock"
      className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white shadow-md relative overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Clock Left */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
                Hora Real de Referencia (NTP / Sistema)
              </span>
              <button
                id="refresh-clock-btn"
                onClick={handleSyncFlash}
                title="Comprobar sincronía"
                className="text-slate-400 hover:text-slate-200 transition-colors p-1"
              >
                <RefreshCw className={`w-3 h-3 ${isFlashing ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>
            <div className="text-xs text-slate-400 capitalize">{formattedDate}</div>
          </div>
        </div>

        {/* Big Digits */}
        <div className="flex items-baseline gap-1 font-mono">
          <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 shadow-inner">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
              {hours}:{minutes}:{seconds}
            </span>
            <span className="text-emerald-400 text-sm font-semibold ml-1">.{tenths}</span>
          </div>
        </div>

        {/* Fast Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="quick-add-measure-btn"
            onClick={() => onQuickAdd(getIsoCurrentTime())}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg shadow transition-colors active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Medir ahora</span>
          </button>
          <button
            id="quick-reset-run-btn"
            onClick={() => onOpenResetModal(getIsoCurrentTime())}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-medium rounded-lg transition-colors active:scale-95"
            title="Usar si el reloj se paró o acabas de ponerlo en hora"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Reinicio / Parada</span>
          </button>
        </div>
      </div>
    </div>
  );
};
