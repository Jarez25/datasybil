import React, { useState } from 'react';
import { DriverType, ConnectionConfig } from '../types';
import { Database, X, Check, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (config: ConnectionConfig) => Promise<void>;
}

export const NewConnectionModal: React.FC<Props> = ({ isOpen, onClose, onConnect }) => {
  const [driver, setDriver] = useState<DriverType>('postgres');
  const [name, setName] = useState('');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState(5432);
  const [database, setDatabase] = useState('postgres');
  const [username, setUsername] = useState('postgres');
  const [password, setPassword] = useState('');
  const [filePath, setFilePath] = useState('');
  const [sslMode, setSslMode] = useState('prefer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDriverChange = (newDriver: DriverType) => {
    setDriver(newDriver);
    if (newDriver === 'postgres') {
      setPort(5432);
      if (!name || name === 'My MySQL' || name === 'Local SQLite') setName('Local PostgreSQL');
      if (username === 'root') setUsername('postgres');
      if (database === '') setDatabase('postgres');
    } else if (newDriver === 'mysql') {
      setPort(3306);
      if (!name || name === 'Local PostgreSQL' || name === 'Local SQLite') setName('Local MySQL');
      if (username === 'postgres') setUsername('root');
      setDatabase('');
    } else if (newDriver === 'sqlite') {
      if (!name || name === 'Local PostgreSQL' || name === 'Local MySQL' || name === 'My MySQL') setName('Local SQLite');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const config: ConnectionConfig = {
      id: `conn-${Date.now()}`,
      name: name || `${driver.toUpperCase()} Connection`,
      driver,
      host: driver !== 'sqlite' ? host : undefined,
      port: driver !== 'sqlite' ? port : undefined,
      username: driver !== 'sqlite' ? username : undefined,
      password: driver !== 'sqlite' ? password : undefined,
      database: driver !== 'sqlite' ? database : undefined,
      file_path: driver === 'sqlite' ? filePath : undefined,
      ssl_mode: driver === 'postgres' ? sslMode : undefined,
    };

    try {
      await onConnect(config);
      onClose();
    } catch (err: unknown) {
      setError(typeof err === 'string' ? err : (err as Error)?.message || 'Failed to connect');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-zinc-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold tracking-tight">Nueva Conexión de Base de Datos</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded-md hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-950/60 border border-red-800 rounded-lg text-sm text-red-200">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Motor Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Motor de Base de Datos
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['postgres', 'mysql', 'sqlite'] as DriverType[]).map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => handleDriverChange(d)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border text-center transition capitalize ${
                    driver === d
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold shadow-sm'
                      : 'border-zinc-800 bg-zinc-800/40 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {d === 'postgres' ? 'PostgreSQL' : d === 'mysql' ? 'MySQL' : 'SQLite'}
                </button>
              ))}
            </div>
          </div>

          {/* Connection Name */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Nombre Descriptivo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="p. ej. Servidor Producción o Local DB"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {driver === 'sqlite' ? (
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Ruta del Archivo SQLite</label>
              <input
                type="text"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder=":memory: o C:\Users\...\database.db"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-xs text-zinc-500 mt-1">Usa :memory: para una base de datos temporal en memoria.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-zinc-400 mb-1">Host / Servidor</label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Puerto</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-zinc-400">Base de Datos</label>
                  <span className="text-[10px] text-zinc-500">(Opcional: déjalo vacío para ver todas las bases)</span>
                </div>
                <input
                  type="text"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  placeholder={driver === 'postgres' ? 'postgres (o vacío)' : 'Dejar vacío para listar todas las bases'}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Usuario</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {driver === 'postgres' && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Modo SSL</label>
                  <select
                    value={sslMode}
                    onChange={(e) => setSslMode(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="disable">Disable</option>
                    <option value="prefer">Prefer (Recomendado)</option>
                    <option value="require">Require</option>
                  </select>
                </div>
              )}
            </>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-lg transition disabled:opacity-50 shadow-md shadow-emerald-950/40"
            >
              {isSubmitting ? (
                <span>Conectando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar y Conectar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
