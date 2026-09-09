import React, { useState, useEffect, useMemo } from 'react';
import { Watch, MeasurementRaw, CalculatedMeasurement, WatchPosition } from './types';
import {
  INITIAL_WATCHES,
  INITIAL_MEASUREMENTS,
  DEMO_SAMPLE_WATCHES,
  DEMO_SAMPLE_MEASUREMENTS,
} from './data/initialData';
import { calculateMeasurements, formatSeconds, formatSpd } from './utils/calculations';
import { WatchTimeComparator } from './components/WatchTimeComparator';
import { WatchSelector } from './components/WatchSelector';
import { SheetGrid } from './components/SheetGrid';
import { PositionAnalysis } from './components/PositionAnalysis';
import { PerformanceCharts } from './components/PerformanceCharts';
import { AddMeasurementModal } from './components/AddMeasurementModal';
import { WatchModal } from './components/WatchModal';
import { GoogleSheetsExportModal } from './components/GoogleSheetsExportModal';
import { ConfirmModal } from './components/ConfirmModal';
import {
  Table,
  Compass,
  LineChart as ChartIcon,
  Plus,
  RotateCcw,
  Sparkles,
  Download,
  Upload,
  FileSpreadsheet,
  Trash2,
  Watch as WatchIcon,
} from 'lucide-react';

const STORAGE_KEY_WATCHES = 'horology_sheets_watches_v3';
const STORAGE_KEY_MEASUREMENTS = 'horology_sheets_measurements_v3';

export default function App() {
  // Purge legacy demo data if present from older versions
  useEffect(() => {
    try {
      localStorage.removeItem('horology_sheets_watches_v1');
      localStorage.removeItem('horology_sheets_measurements_v1');
      localStorage.removeItem('horology_sheets_watches_v2');
      localStorage.removeItem('horology_sheets_measurements_v2');
    } catch (e) {
      // ignore
    }
  }, []);

  // 1. Persistence state for Watches
  const [watches, setWatches] = useState<Watch[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WATCHES);
      if (saved) {
        const parsed: Watch[] = JSON.parse(saved);
        // If it only contains legacy demo watches, start clean with INITIAL_WATCHES
        const hasLegacyDemo = parsed.some(w => w.id.includes('turtle') || w.id.includes('prx') || w.id.includes('hamilton'));
        if (!hasLegacyDemo && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading watches from localStorage', e);
    }
    return INITIAL_WATCHES;
  });

  // 2. Selected Watch
  const [selectedWatchId, setSelectedWatchId] = useState<string>(() => {
    return watches[0]?.id || INITIAL_WATCHES[0].id;
  });

  // 3. Persistence state for Measurements (Starts empty with 0 demo rows)
  const [rawMeasurements, setRawMeasurements] = useState<MeasurementRaw[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MEASUREMENTS);
      if (saved) {
        const parsed: MeasurementRaw[] = JSON.parse(saved);
        // If it contains legacy demo measurements, start completely clean
        const hasLegacyDemo = parsed.some(m => m.watchId?.includes('turtle') || m.watchId?.includes('prx'));
        if (!hasLegacyDemo) return parsed;
      }
    } catch (e) {
      console.error('Error loading measurements from localStorage', e);
    }
    return INITIAL_MEASUREMENTS;
  });

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WATCHES, JSON.stringify(watches));
    } catch (e) {
      console.error('Error saving watches', e);
    }
  }, [watches]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MEASUREMENTS, JSON.stringify(rawMeasurements));
    } catch (e) {
      console.error('Error saving measurements', e);
    }
  }, [rawMeasurements]);

  // Active view tab: Sheets Grid, Position Analysis, or Time Charts
  const [activeTab, setActiveTab] = useState<'SHEETS' | 'POSITIONS' | 'CHARTS'>('SHEETS');

  // Modals state
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<CalculatedMeasurement | null>(null);
  const [modalDefaultIsReset, setModalDefaultIsReset] = useState(false);
  const [prefilledTime, setPrefilledTime] = useState<string | undefined>(undefined);

  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [editingWatch, setEditingWatch] = useState<Watch | null>(null);

  const [isSheetsExportModalOpen, setIsSheetsExportModalOpen] = useState(false);

  // In-app confirmation dialog state (replaces window.confirm)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // In-app toast feedback (replaces window.alert)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Active watch object
  const currentWatch = useMemo(() => {
    return watches.find(w => w.id === selectedWatchId) || watches[0] || INITIAL_WATCHES[0];
  }, [watches, selectedWatchId]);

  // Filter and compute measurements for the current watch
  const calculatedMeasurements = useMemo(() => {
    const forThisWatch = rawMeasurements.filter(m => m.watchId === currentWatch.id);
    return calculateMeasurements(forThisWatch);
  }, [rawMeasurements, currentWatch.id]);

  // Quick top summary metrics
  const lastMeasurement = calculatedMeasurements[calculatedMeasurements.length - 1];
  const activeSessionMeasurements = useMemo(() => {
    if (calculatedMeasurements.length === 0) return [];
    const maxSession = Math.max(...calculatedMeasurements.map(m => m.sessionIndex));
    return calculatedMeasurements.filter(m => m.sessionIndex === maxSession);
  }, [calculatedMeasurements]);

  const activeSessionDrift = lastMeasurement?.sessionCumulativeDrift ?? 0;
  const activeSessionRate = lastMeasurement?.sessionAverageRate_spd;

  // Handlers for measurements
  const handleOpenAddModal = (isReset = false, prefillTime?: string) => {
    setEditingMeasurement(null);
    setModalDefaultIsReset(isReset);
    setPrefilledTime(prefillTime);
    setIsMeasurementModalOpen(true);
  };

  const handleOpenEditModal = (m: CalculatedMeasurement) => {
    setEditingMeasurement(m);
    setModalDefaultIsReset(m.isReset || false);
    setPrefilledTime(undefined);
    setIsMeasurementModalOpen(true);
  };

  const handleSaveMeasurement = (item: MeasurementRaw) => {
    setRawMeasurements(prev => {
      const exists = prev.some(m => m.id === item.id);
      if (exists) {
        return prev.map(m => (m.id === item.id ? item : m));
      } else {
        return [...prev, item];
      }
    });
  };

  const handleDeleteMeasurement = (id: string) => {
    setRawMeasurements(prev => prev.filter(m => m.id !== id));
    showToast('Fila de medición eliminada.');
  };

  // Direct fast save from the on-screen WatchTimeComparator
  const handleDirectSaveMeasurement = (
    realTimeIso: string,
    watchTimeIso: string,
    position: WatchPosition,
    isReset: boolean,
    notes: string
  ) => {
    if (!currentWatch) return;
    const newMeasurement: MeasurementRaw = {
      id: `m-${Date.now()}`,
      watchId: currentWatch.id,
      realTime: realTimeIso,
      watchTime: watchTimeIso,
      position,
      isReset,
      notes: notes.trim(),
    };
    setRawMeasurements(prev => [...prev, newMeasurement]);
    showToast('Medición registrada en la hoja de cálculo.');
  };

  // Handlers for watches
  const handleAddWatch = () => {
    setEditingWatch(null);
    setIsWatchModalOpen(true);
  };

  const handleEditWatch = (watch: Watch) => {
    setEditingWatch(watch);
    setIsWatchModalOpen(true);
  };

  const handleSaveWatch = (savedWatch: Watch) => {
    setWatches(prev => {
      const exists = prev.some(w => w.id === savedWatch.id);
      if (exists) {
        return prev.map(w => (w.id === savedWatch.id ? savedWatch : w));
      } else {
        return [...prev, savedWatch];
      }
    });
    setSelectedWatchId(savedWatch.id);
    showToast(`Reloj ${savedWatch.brand} ${savedWatch.name} guardado.`);
  };

  const handleDeleteWatch = (watchId: string) => {
    const watchToDelete = watches.find(w => w.id === watchId);
    const watchName = watchToDelete ? `${watchToDelete.brand} ${watchToDelete.name}` : 'este reloj';

    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar reloj?',
      message: `¿Estás seguro de que deseas eliminar ${watchName} y todas sus mediciones asociadas? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar reloj',
      variant: 'danger',
      onConfirm: () => {
        const remaining = watches.filter(w => w.id !== watchId);
        setWatches(remaining);
        setRawMeasurements(prev => prev.filter(m => m.watchId !== watchId));
        if (remaining.length > 0) {
          setSelectedWatchId(remaining[0].id);
        } else {
          setSelectedWatchId('');
        }
        showToast(`Reloj ${watchName} eliminado.`);
      },
    });
  };

  // Clear all demo data to start clean
  const handleClearAllData = () => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Borrar todos los datos?',
      message: '¿Deseas borrar TODOS los relojes y mediciones de ejemplo para empezar desde cero con tu propia colección?',
      confirmLabel: 'Borrar todo',
      variant: 'danger',
      onConfirm: () => {
        setWatches([]);
        setRawMeasurements([]);
        setSelectedWatchId('');
        handleAddWatch();
        showToast('Colección reiniciada. Listo para añadir tu reloj.');
      },
    });
  };

  // Restore sample demo data
  const handleRestoreDemoData = () => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Cargar datos de ejemplo?',
      message: '¿Deseas restaurar un reloj de demostración con mediciones de prueba?',
      confirmLabel: 'Cargar ejemplo',
      variant: 'primary',
      onConfirm: () => {
        setWatches(DEMO_SAMPLE_WATCHES);
        setRawMeasurements(DEMO_SAMPLE_MEASUREMENTS);
        setSelectedWatchId(DEMO_SAMPLE_WATCHES[0].id);
        showToast('Reloj y mediciones de prueba cargadas.');
      },
    });
  };

  // Export full backup
  const handleExportFullBackup = () => {
    const data = {
      version: 1,
      exportDate: new Date().toISOString(),
      watches,
      measurements: rawMeasurements,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Horology_Sheets_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Copia de seguridad descargada.');
  };

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.watches && Array.isArray(parsed.watches) && parsed.measurements) {
          setWatches(parsed.watches);
          setRawMeasurements(parsed.measurements);
          if (parsed.watches.length > 0) {
            setSelectedWatchId(parsed.watches[0].id);
          }
          showToast('¡Copia de seguridad importada con éxito!');
        } else {
          showToast('El archivo no tiene el formato válido de Horology Sheets.');
        }
      } catch (err) {
        showToast('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <span className="font-mono text-base font-black tracking-tighter text-emerald-400">
                H<span className="text-white">S</span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Horology Sheets
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Precisión Automática
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Hoja de cálculo de desviación, posiciones, cargador y evolución temporal
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="header-export-google-sheets-btn"
              onClick={() => setIsSheetsExportModalOpen(true)}
              title="Exportar todo a Google Sheets"
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold shadow-2xs transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span className="hidden sm:inline">Exportar a Google Sheets</span>
              <span className="sm:hidden">Sheets</span>
            </button>

            <button
              id="header-clear-demo-btn"
              onClick={handleClearAllData}
              title="Borrar todos los relojes y mediciones de ejemplo para empezar desde cero"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Borrar ejemplos</span>
            </button>

            <button
              id="header-restore-demo-btn"
              onClick={handleRestoreDemoData}
              title="Recargar datos de prueba de múltiples relojes"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Cargar Ejemplo</span>
            </button>

            <button
              id="header-backup-json-btn"
              onClick={handleExportFullBackup}
              title="Exportar copia de seguridad en JSON"
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 text-slate-600" />
            </button>

            <label
              id="header-import-json-btn"
              title="Importar copia de seguridad"
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>

            <button
              id="header-add-measure-btn"
              onClick={() => handleOpenAddModal(false)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Medición</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1 w-full space-y-5">
        {/* 1. Direct Watch Time Comparator & Live Atomic Reference Clock */}
        <WatchTimeComparator
          currentWatch={currentWatch || null}
          lastMeasurement={lastMeasurement || null}
          onSaveMeasurement={handleDirectSaveMeasurement}
          onOpenNewWatchModal={handleAddWatch}
        />

        {watches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xs space-y-4 my-8">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <WatchIcon className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-800 text-base">Colección de relojes vacía</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Has borrado los relojes de ejemplo. Añade tu propio reloj automático para empezar a registrar y calcular sus desviaciones horológicas.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                id="empty-add-first-watch-btn"
                onClick={handleAddWatch}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir mi primer reloj</span>
              </button>
              <button
                id="empty-restore-samples-btn"
                onClick={handleRestoreDemoData}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar ejemplos</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 2. Watch Selector Tabs & Current Watch Specs */}
            <WatchSelector
              watches={watches}
              selectedWatchId={selectedWatchId}
              onSelectWatch={setSelectedWatchId}
              onAddWatch={handleAddWatch}
              onEditWatch={handleEditWatch}
              onDeleteWatch={handleDeleteWatch}
            />

            {/* 3. Quick Stats & View Switcher Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
              {/* Navigation View Tabs */}
              <div className="flex items-center gap-1">
                <button
                  id="tab-sheets-grid"
                  onClick={() => setActiveTab('SHEETS')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === 'SHEETS'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Table className="w-4 h-4" />
                  <span>Hoja de Cálculo (Sheets)</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      activeTab === 'SHEETS' ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {calculatedMeasurements.length}
                  </span>
                </button>

                <button
                  id="tab-position-analysis"
                  onClick={() => setActiveTab('POSITIONS')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === 'POSITIONS'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span>Desviación por Posición</span>
                </button>

                <button
                  id="tab-performance-charts"
                  onClick={() => setActiveTab('CHARTS')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === 'CHARTS'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <ChartIcon className="w-4 h-4" />
                  <span>Gráficas Temporales</span>
                </button>
              </div>

              {/* Quick Real-Time Status Pill */}
              <div className="flex items-center gap-3 px-3 py-1 text-xs border-t md:border-t-0 md:border-l border-slate-200 text-slate-600">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                    Última Medida
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {lastMeasurement ? formatSeconds(lastMeasurement.diffSeconds) : '0.0s'}
                  </span>
                </div>

                <div className="h-6 w-px bg-slate-200" />

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                    Desv. Sesión Activa
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      activeSessionDrift > 0
                        ? 'text-emerald-600'
                        : activeSessionDrift < 0
                        ? 'text-amber-600'
                        : 'text-slate-700'
                    }`}
                  >
                    {formatSeconds(activeSessionDrift)}
                  </span>
                </div>

                <div className="h-6 w-px bg-slate-200" />

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                    Tasa Media
                  </span>
                  <span className="font-mono font-semibold text-slate-700">
                    {formatSpd(activeSessionRate)}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Active Tab Content */}
            {currentWatch && activeTab === 'SHEETS' && (
              <SheetGrid
                watchName={`${currentWatch.brand} ${currentWatch.name}`}
                measurements={calculatedMeasurements}
                onAddMeasurement={() => handleOpenAddModal(false)}
                onEditMeasurement={handleOpenEditModal}
                onDeleteMeasurement={handleDeleteMeasurement}
                onStartNewSession={() => handleOpenAddModal(true)}
                onOpenGoogleSheetsExport={() => setIsSheetsExportModalOpen(true)}
              />
            )}

            {currentWatch && activeTab === 'POSITIONS' && (
              <PositionAnalysis
                watch={currentWatch}
                measurements={calculatedMeasurements}
              />
            )}

            {currentWatch && activeTab === 'CHARTS' && (
              <PerformanceCharts
                watch={currentWatch}
                measurements={calculatedMeasurements}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Horology Sheets — Medición de Desviación para Relojes Mecánicos y Automáticos</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Compatible con exportación a Google Sheets y Excel • Algoritmo de compensación por posiciones
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddMeasurementModal
        isOpen={isMeasurementModalOpen}
        onClose={() => setIsMeasurementModalOpen(false)}
        onSave={handleSaveMeasurement}
        watchId={currentWatch.id}
        initialData={editingMeasurement}
        defaultIsReset={modalDefaultIsReset}
        prefilledRealTime={prefilledTime}
      />

      <WatchModal
        isOpen={isWatchModalOpen}
        onClose={() => setIsWatchModalOpen(false)}
        onSave={handleSaveWatch}
        onDelete={handleDeleteWatch}
        initialWatch={editingWatch}
        canDelete={watches.length > 1}
      />

      <GoogleSheetsExportModal
        isOpen={isSheetsExportModalOpen}
        onClose={() => setIsSheetsExportModalOpen(false)}
        watches={watches}
        measurements={rawMeasurements}
      />

      {/* In-app Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Floating In-App Toast */}
      {toastMessage && (
        <div
          id="app-toast-notification"
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
