import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ConnectionConfig, DatabaseMetadata, QueryResult, QueryTab, TableMetadata } from './types';
import { Sidebar, FormulaType } from './components/Sidebar';
import { NewConnectionModal } from './components/NewConnectionModal';
import { SqlEditor } from './components/SqlEditor';
import { ResultsGrid } from './components/ResultsGrid';
import {
  Play,
  Plus,
  X,
  AlertTriangle,
  CheckCircle2,
  Database,
  Terminal,
  Table as TableIcon,
  Sparkles,
  Calculator,
  ChevronDown,
} from 'lucide-react';
import './App.css';

export function App() {
  const [connections, setConnections] = useState<ConnectionConfig[]>([]);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [metadataMap, setMetadataMap] = useState<Record<string, DatabaseMetadata>>({});
  const [isNewConnModalOpen, setIsNewConnModalOpen] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [isFormulasDropdownOpen, setIsFormulasDropdownOpen] = useState(false);

  // Tabs state
  const [tabs, setTabs] = useState<QueryTab[]>([
    {
      id: 'tab-1',
      title: 'Consola 1',
      sql: `-- Bienvenido a DataSybil - Gestor de Bases de Datos en Rust\n-- Puedes ejecutar consultas SQL con Ctrl + Enter o haciendo clic en 'Ejecutar'.\n\nSELECT * FROM users;\n`,
      connectionId: null,
      result: null,
      isExecuting: false,
      error: null,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [bottomTab, setBottomTab] = useState<'results' | 'messages'>('results');

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Auto-load demo on first launch if empty
  useEffect(() => {
    handleLoadDemo();
  }, []);

  const handleLoadDemo = async () => {
    setIsDemoLoading(true);
    try {
      const demoId: string = await invoke('create_demo_sqlite');
      const demoConfig: ConnectionConfig = {
        id: demoId,
        name: 'Demo Store (SQLite)',
        driver: 'sqlite',
        file_path: ':memory:',
      };

      setConnections((prev) => {
        if (prev.some((c) => c.id === demoId)) return prev;
        return [demoConfig, ...prev];
      });
      setActiveConnectionId(demoId);

      // Fetch metadata
      const meta: DatabaseMetadata = await invoke('get_schema_metadata', { id: demoId });
      setMetadataMap((prev) => ({ ...prev, [demoId]: meta }));

      // Update active tab to point to demo connection
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                connectionId: demoId,
              }
            : t
        )
      );

      // Execute initial sample query
      handleExecuteQuery(demoId, 'SELECT * FROM users LIMIT 50;');
    } catch (err) {
      console.error('Failed to load demo SQLite database:', err);
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleConnect = async (config: ConnectionConfig) => {
    const connId: string = await invoke('connect_db', { config });
    setConnections((prev) => [...prev, { ...config, id: connId }]);
    setActiveConnectionId(connId);

    // Fetch schema metadata
    const meta: DatabaseMetadata = await invoke('get_schema_metadata', { id: connId });
    setMetadataMap((prev) => ({ ...prev, [connId]: meta }));

    // Link active tab to new connection
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, connectionId: connId } : t))
    );
  };

  const handleRefreshMetadata = async (id: string) => {
    try {
      const meta: DatabaseMetadata = await invoke('get_schema_metadata', { id });
      setMetadataMap((prev) => ({ ...prev, [id]: meta }));
    } catch (err) {
      console.error('Failed to refresh metadata:', err);
    }
  };

  const handleExecuteQuery = async (targetConnId?: string, overrideSql?: string) => {
    const connId = targetConnId || activeTab.connectionId || activeConnectionId;
    if (!connId) {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, error: 'Por favor selecciona o crea una conexión antes de ejecutar.' }
            : t
        )
      );
      setBottomTab('messages');
      return;
    }

    const querySql = overrideSql || activeTab.sql;
    if (!querySql.trim()) return;

    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? { ...t, isExecuting: true, error: null, sql: overrideSql || t.sql }
          : t
      )
    );

    try {
      // Execute via Rust backend
      const result = await invoke<QueryResult>('execute_query', {
        id: connId,
        sql: querySql,
      });

      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, result, isExecuting: false, error: null }
            : t
        )
      );
      setBottomTab('results');
    } catch (err: unknown) {
      const errorMsg =
        typeof err === 'string'
          ? err
          : (err as Error)?.message || 'Error desconocido al ejecutar la consulta';

      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, error: errorMsg, isExecuting: false }
            : t
        )
      );
      setBottomTab('messages');
    }
  };

  const getQuotedIdentifier = (driver: string, tableName: string, schemaName?: string) => {
    if (driver === 'mysql') {
      return schemaName ? `\`${schemaName}\`.\`${tableName}\`` : `\`${tableName}\``;
    } else if (driver === 'postgres') {
      return schemaName ? `"${schemaName}"."${tableName}"` : `"${tableName}"`;
    } else {
      return `"${tableName}"`;
    }
  };

  const handleSelectTableForQuery = (table: TableMetadata, schemaName?: string) => {
    if (!table || !table.name) return;
    const currentConn = connections.find(c => c.id === (activeTab.connectionId || activeConnectionId));
    const driver = currentConn?.driver || 'sqlite';
    const tableId = getQuotedIdentifier(driver, table.name, schemaName);
    const sql = `SELECT * FROM ${tableId} LIMIT 100;`;

    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? { ...t, sql, title: table.name }
          : t
      )
    );
    handleExecuteQuery(undefined, sql);
  };

  const handleSelectFormula = (
    formula: FormulaType,
    table: TableMetadata,
    schemaName?: string
  ) => {
    if (!table || !table.name) return;
    const currentConn = connections.find(c => c.id === (activeTab.connectionId || activeConnectionId));
    const driver = currentConn?.driver || 'sqlite';
    const tableId = getQuotedIdentifier(driver, table.name, schemaName);

    let sql = '';
    if (formula === 'count') {
      sql = `SELECT COUNT(*) AS total_lineas FROM ${tableId};`;
    } else if (formula === 'select') {
      sql = `SELECT * FROM ${tableId} LIMIT 100;`;
    } else if (formula === 'latest') {
      sql = `SELECT * FROM ${tableId} ORDER BY 1 DESC LIMIT 100;`;
    } else if (formula === 'describe') {
      if (driver === 'mysql') {
        sql = `DESCRIBE ${tableId};`;
      } else if (driver === 'postgres') {
        sql = `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '${table.name}';`;
      } else {
        sql = `PRAGMA table_info("${table.name}");`;
      }
    } else if (formula === 'insert') {
      const cols = table.columns
        .filter((c) => !c.is_primary_key)
        .map((c) => (driver === 'mysql' ? `\`${c.name}\`` : `"${c.name}"`));
      const placeholders = cols.map(() => `'valor'`);
      sql = `INSERT INTO ${tableId} (${cols.join(', ')})\nVALUES (${placeholders.join(', ')});`;
    }

    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? { ...t, sql, title: `${table.name} (${formula})` }
          : t
      )
    );

    if (formula !== 'insert') {
      handleExecuteQuery(undefined, sql);
    }
  };

  const insertGeneralFormula = (snippet: string) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? { ...t, sql: `${t.sql.trimEnd()}\n\n${snippet}\n` }
          : t
      )
    );
    setIsFormulasDropdownOpen(false);
  };

  const handleAddTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTab: QueryTab = {
      id: newId,
      title: `Consola ${tabs.length + 1}`,
      sql: `-- Nueva consulta\nSELECT `,
      connectionId: activeConnectionId,
      result: null,
      isExecuting: false,
      error: null,
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id) {
      setActiveTabId(remaining[remaining.length - 1].id);
    }
  };

  const updateActiveTabSql = (sql: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, sql } : t))
    );
  };

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-zinc-950 font-sans text-zinc-100"
      onClick={() => setIsFormulasDropdownOpen(false)}
    >
      {/* Left Database Explorer Sidebar */}
      <Sidebar
        connections={connections}
        activeConnectionId={activeConnectionId}
        metadataMap={metadataMap}
        onSelectConnection={(id) => {
          setActiveConnectionId(id);
          setTabs((prev) =>
            prev.map((t) => (t.id === activeTabId ? { ...t, connectionId: id } : t))
          );
        }}
        onOpenNewConnectionModal={() => setIsNewConnModalOpen(true)}
        onLoadDemo={handleLoadDemo}
        onRefreshMetadata={handleRefreshMetadata}
        onSelectTableForQuery={handleSelectTableForQuery}
        onSelectFormula={handleSelectFormula}
        isDemoLoading={isDemoLoading}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header / App Bar */}
        <header className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0 select-none">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-950">
              <Database className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-sm tracking-tight text-zinc-100">DataSybil</span>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold uppercase bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                Rust Core
              </span>
            </div>
          </div>

          {/* Active Connection & Quick Actions */}
          <div className="flex items-center gap-3">
            {/* Connection Selector */}
            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs">
              <span className="text-zinc-500">Conexión:</span>
              <select
                value={activeConnectionId || ''}
                onChange={(e) => {
                  const id = e.target.value;
                  setActiveConnectionId(id);
                  setTabs((prev) =>
                    prev.map((t) => (t.id === activeTabId ? { ...t, connectionId: id } : t))
                  );
                }}
                className="bg-transparent text-zinc-200 outline-none cursor-pointer font-medium"
              >
                {connections.length === 0 ? (
                  <option value="">Sin conexiones</option>
                ) : (
                  connections.map((c) => (
                    <option key={c.id} value={c.id} className="bg-zinc-900 text-zinc-200">
                      {c.name} ({c.driver.toUpperCase()})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Quick Formulas Dropdown Button */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFormulasDropdownOpen(!isFormulasDropdownOpen);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700/90 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 transition"
                title="Fórmulas y consultas SQL comunes"
              >
                <Calculator className="w-3.5 h-3.5 text-amber-400" />
                <span>Fórmulas Rápidas</span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {isFormulasDropdownOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1.5 w-64 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl py-1.5 z-50 text-xs"
                >
                  <div className="px-3 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800 mb-1">
                    Insertar Plantilla SQL
                  </div>
                  <button
                    onClick={() => insertGeneralFormula('SELECT COUNT(*) AS total_filas FROM tabla;')}
                    className="w-full flex flex-col px-3 py-1.5 hover:bg-zinc-800 text-left text-zinc-200"
                  >
                    <span className="font-semibold text-emerald-300">Contar líneas / filas</span>
                    <span className="text-[10px] text-zinc-400 font-mono">SELECT COUNT(*) FROM ...</span>
                  </button>
                  <button
                    onClick={() => insertGeneralFormula('SELECT * FROM tabla LIMIT 100;')}
                    className="w-full flex flex-col px-3 py-1.5 hover:bg-zinc-800 text-left text-zinc-200"
                  >
                    <span className="font-semibold text-blue-300">Primeras 100 líneas</span>
                    <span className="text-[10px] text-zinc-400 font-mono">SELECT * FROM ... LIMIT 100</span>
                  </button>
                  <button
                    onClick={() =>
                      insertGeneralFormula('SELECT * FROM tabla ORDER BY 1 DESC LIMIT 100;')
                    }
                    className="w-full flex flex-col px-3 py-1.5 hover:bg-zinc-800 text-left text-zinc-200"
                  >
                    <span className="font-semibold text-amber-300">Últimas 100 líneas</span>
                    <span className="text-[10px] text-zinc-400 font-mono">ORDER BY 1 DESC LIMIT 100</span>
                  </button>
                  <button
                    onClick={() =>
                      insertGeneralFormula(
                        'SELECT columna, COUNT(*) AS cantidad\nFROM tabla\nGROUP BY columna\nORDER BY cantidad DESC;'
                      )
                    }
                    className="w-full flex flex-col px-3 py-1.5 hover:bg-zinc-800 text-left text-zinc-200"
                  >
                    <span className="font-semibold text-purple-300">Agrupar y contar líneas</span>
                    <span className="text-[10px] text-zinc-400 font-mono">GROUP BY columna</span>
                  </button>
                  <button
                    onClick={() =>
                      insertGeneralFormula('SELECT * FROM tabla WHERE columna = \'valor\';')
                    }
                    className="w-full flex flex-col px-3 py-1.5 hover:bg-zinc-800 text-left text-zinc-200"
                  >
                    <span className="font-semibold text-rose-300">Filtrar por condición</span>
                    <span className="text-[10px] text-zinc-400 font-mono">WHERE columna = ...</span>
                  </button>
                </div>
              )}
            </div>

            {/* Run Query Button */}
            <button
              onClick={() => handleExecuteQuery()}
              disabled={activeTab.isExecuting || !activeConnectionId}
              className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-xs rounded-lg transition disabled:opacity-40 shadow-sm shadow-emerald-950"
              title="Ejecutar consulta (Ctrl + Enter)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Ejecutar</span>
              <kbd className="hidden sm:inline-block px-1 py-0.5 text-[10px] bg-emerald-700/80 rounded text-emerald-100">
                Ctrl ↵
              </kbd>
            </button>
          </div>
        </header>

        {/* Query Editor Tabs */}
        <div className="h-9 bg-zinc-950 border-b border-zinc-800 flex items-center px-2 gap-1 overflow-x-auto shrink-0 select-none">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`group flex items-center gap-2 px-3 py-1.5 text-xs rounded-t-md cursor-pointer border-t-2 transition ${
                  isActive
                    ? 'bg-[#1e1e1e] border-emerald-500 text-zinc-100 font-medium'
                    : 'bg-zinc-900/40 border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-400" />
                <span className="truncate max-w-[130px]">{tab.title}</span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => handleCloseTab(tab.id, e)}
                    className="p-0.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 opacity-60 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={handleAddTab}
            title="Nueva pestaña de consulta"
            className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition ml-1"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Split Container: Upper Monaco Editor / Lower Results Grid */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Upper Section: Monaco SQL Editor */}
          <div className="h-1/2 min-h-[160px] border-b border-zinc-800 flex flex-col">
            <SqlEditor
              value={activeTab.sql}
              onChange={updateActiveTabSql}
              onExecute={() => handleExecuteQuery()}
              isExecuting={activeTab.isExecuting}
            />
          </div>

          {/* Lower Section: Tabs for Results & Messages */}
          <div className="h-1/2 min-h-[180px] flex flex-col bg-zinc-950">
            {/* Lower Header Tabs */}
            <div className="h-8 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between px-3 shrink-0 text-xs select-none">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBottomTab('results')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition ${
                    bottomTab === 'results'
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Resultados</span>
                  {activeTab.result && (
                    <span className="text-[10px] text-zinc-400 font-mono">
                      ({activeTab.result.rows.length})
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setBottomTab('messages')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition ${
                    bottomTab === 'messages'
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mensajes</span>
                  {activeTab.error && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>
              </div>

              {activeTab.result && (
                <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Completado en <strong className="text-zinc-200">{activeTab.result.execution_time_ms} ms</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Lower Tab Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {bottomTab === 'results' ? (
                <ResultsGrid result={activeTab.result} tableName={activeTab.title} />
              ) : (
                <div className="p-4 h-full overflow-auto font-mono text-xs select-text">
                  {activeTab.error ? (
                    <div className="flex items-start gap-2.5 p-3 bg-rose-950/40 border border-rose-800 rounded-lg text-rose-200">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="font-semibold text-rose-300">Error en la ejecución:</div>
                        <div className="whitespace-pre-wrap">{activeTab.error}</div>
                      </div>
                    </div>
                  ) : activeTab.result ? (
                    <div className="flex items-center gap-2 text-emerald-400 p-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Consulta completada con éxito. Filas afectadas: {activeTab.result.rows_affected}.
                        Duración: {activeTab.result.execution_time_ms} ms.
                      </span>
                    </div>
                  ) : (
                    <p className="text-zinc-500 italic">No hay mensajes de ejecución aún.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Connection Modal */}
      <NewConnectionModal
        isOpen={isNewConnModalOpen}
        onClose={() => setIsNewConnModalOpen(false)}
        onConnect={handleConnect}
      />
    </div>
  );
}

export default App;
