import React, { useState, useEffect } from 'react';
import { Watch, MeasurementRaw } from '../types';
import { googleSignIn, initAuth, logout, getAccessToken } from '../services/googleAuth';
import { createGoogleSheetsSpreadsheet, GoogleSheetsExportResult } from '../services/googleSheetsService';
import { User } from 'firebase/auth';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface GoogleSheetsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  watches: Watch[];
  measurements: MeasurementRaw[];
}

export const GoogleSheetsExportModal: React.FC<GoogleSheetsExportModalProps> = ({
  isOpen,
  onClose,
  watches,
  measurements,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<GoogleSheetsExportResult | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, accessToken) => {
        setUser(authedUser);
        setToken(accessToken);
        setIsLoadingAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setIsLoadingAuth(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'No se pudo completar el inicio de sesión con Google.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setExportResult(null);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setErrorMsg(null);

    try {
      const currentToken = token || (await getAccessToken());
      if (!currentToken) {
        throw new Error('Sesión no encontrada. Por favor inicia sesión con Google.');
      }

      const result = await createGoogleSheetsSpreadsheet(watches, measurements, currentToken);
      setExportResult(result);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Ocurrió un error al exportar a Google Sheets.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div
      id="google-sheets-export-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Modal Header */}
        <div className="bg-emerald-800 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Exportar a Google Sheets
                <span className="text-[10px] bg-emerald-700/80 px-2 py-0.5 rounded-full font-normal">
                  Google Workspace
                </span>
              </h3>
              <p className="text-xs text-emerald-100/80">
                Crea una hoja de cálculo en vivo en tu Google Drive para trabajar directamente sobre ella
              </p>
            </div>
          </div>
          <button
            id="close-sheets-modal-btn"
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Error notice if any */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success State: Created Spreadsheet Link */}
          {exportResult ? (
            <div className="space-y-4 py-2">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>¡Hoja de cálculo creada con éxito en Google Drive!</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Se ha generado tu hoja con <strong>{exportResult.totalRows} filas</strong> de mediciones,
                  desgloses completos por posición y fichas técnicas de tus <strong>{watches.length} relojes</strong>.
                </p>

                {/* Main Open Link Button */}
                <div className="pt-1">
                  <a
                    id="open-google-sheets-url-btn"
                    href={exportResult.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all text-sm active:scale-98"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Abrir en Google Sheets</span>
                    <ExternalLink className="w-4 h-4 opacity-80" />
                  </a>
                </div>

                {/* Copy link */}
                <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-emerald-700 bg-white/70 p-2 rounded-lg border border-emerald-200/60 font-mono">
                  <span className="truncate">{exportResult.spreadsheetUrl}</span>
                  <button
                    onClick={() => handleCopyUrl(exportResult.spreadsheetUrl)}
                    className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-emerald-50 border border-emerald-200 rounded text-emerald-800 font-sans shrink-0 font-medium"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setExportResult(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Volver a exportar
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                >
                  Entendido / Cerrar
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Authenticated User Status or Google Sign In Button */}
              {user ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'Usuario'}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full border border-slate-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                        {(user.displayName || user.email || 'G')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-slate-900 leading-tight">
                        {user.displayName || 'Usuario de Google'}
                      </div>
                      <div className="text-[11px] text-slate-500">{user.email}</div>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="text-slate-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center space-y-3">
                  <p className="text-slate-600 leading-relaxed">
                    Para crear y guardar la hoja de cálculo directamente en tu cuenta de Google Drive,
                    inicia sesión con Google con los permisos concedidos.
                  </p>

                  {/* Standard Sign in with Google Button */}
                  <div className="flex justify-center pt-1">
                    <button
                      id="google-signin-btn"
                      type="button"
                      onClick={handleSignIn}
                      disabled={isSigningIn}
                      className="inline-flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs font-semibold text-slate-700 hover:text-slate-900 transition-all active:scale-98 disabled:opacity-50 text-xs"
                    >
                      {isSigningIn ? (
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 48 48">
                          <path
                            fill="#EA4335"
                            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                          />
                          <path
                            fill="#4285F4"
                            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                          />
                          <path
                            fill="#34A853"
                            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                          />
                        </svg>
                      )}
                      <span>Iniciar sesión con Google</span>
                    </button>
                  </div>
                </div>
              )}

              {/* What will be exported preview */}
              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-white">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Contenido que se incluirá en tu Google Sheet:</span>
                </div>
                <ul className="space-y-1.5 text-slate-600 text-[11px] list-disc list-inside">
                  <li>
                    <strong>Pestaña 1: Mediciones y Desviación</strong> — Todas las {measurements.length} mediciones
                    con hora real, hora del reloj, desviación puntual en segundos, evoluciones puntual y total, y sesiones de reinicio.
                  </li>
                  <li>
                    <strong>Pestaña 2: Desglose por Posición y Uso</strong> — Tasa diaria promedio (s/d), horas
                    observadas y diagnóstico de compensación por posición (esfera arriba/abajo, coronas, muñeca y cargador).
                  </li>
                  <li>
                    <strong>Pestaña 3: Colección de Relojes</strong> — Fichas técnicas de tus {watches.length} relojes con
                    calibres, tolerancias de fábrica (COSC / estándar) y reservas de marcha.
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  id="confirm-export-google-sheets-btn"
                  type="button"
                  onClick={handleExport}
                  disabled={!user || isExporting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-semibold rounded-lg shadow-sm transition-all active:scale-95 disabled:scale-100"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generando hoja en Drive...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Crear Google Sheet ahora</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
