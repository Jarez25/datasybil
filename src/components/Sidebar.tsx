import React, { useState } from 'react';
import { ConnectionConfig, DatabaseMetadata, TableMetadata } from '../types';
import {
  Database,
  Plus,
  RefreshCw,
  Table as TableIcon,
  Columns,
  Key,
  ChevronRight,
  ChevronDown,
  PlayCircle,
  Eye,
  Server,
  Zap,
  MoreVertical,
  Calculator,
  ListOrdered,
  FileCode,
  HelpCircle,
} from 'lucide-react';

export type FormulaType = 'select' | 'count' | 'latest' | 'describe' | 'insert';

interface Props {
  connections: ConnectionConfig[];
  activeConnectionId: string | null;
  metadataMap: Record<string, DatabaseMetadata>;
  onSelectConnection: (id: string) => void;
  onOpenNewConnectionModal: () => void;
  onLoadDemo: () => void;
  onRefreshMetadata: (id: string) => void;
  onSelectTableForQuery: (table: TableMetadata, schemaName?: string) => void;
  onSelectFormula: (formula: FormulaType, table: TableMetadata, schemaName?: string) => void;
  isDemoLoading: boolean;
}

export const Sidebar: React.FC<Props> = ({
  connections,
  activeConnectionId,
  metadataMap,
  onSelectConnection,
  onOpenNewConnectionModal,
  onLoadDemo,
  onRefreshMetadata,
  onSelectTableForQuery,
  onSelectFormula,
  isDemoLoading,
}) => {
  const [expandedConnections, setExpandedConnections] = useState<Record<string, boolean>>({
    'demo-sqlite': true,
  });
  const [expandedSchemas, setExpandedSchemas] = useState<Record<string, boolean>>({
    'demo-sqlite-main': true,
  });
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [openMenuTableKey, setOpenMenuTableKey] = useState<string | null>(null);

  const toggleConnection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedConnections((prev) => {
      const next = !prev[id];
      // If opening, auto-expand first schema
      if (next && metadataMap[id]?.schemas?.length) {
        setExpandedSchemas((sPrev) => ({
          ...sPrev,
          [`${id}-${metadataMap[id].schemas[0].name}`]: true,
        }));
      }
      return { ...prev, [id]: next };
    });
    onSelectConnection(id);
  };

  const toggleSchema = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSchemas((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleTable = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTables((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside
      className="w-80 bg-zinc-950 border-r border-zinc-800 flex flex-col h-full select-none text-zinc-300 relative"
      onClick={() => setOpenMenuTableKey(null)}
    >
      {/* Sidebar Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-sm tracking-wide text-zinc-100">Explorador de BD</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenNewConnectionModal}
            title="Nueva Conexión"
            className="flex items-center gap-1 px-2 py-1 bg-zinc-900 border border-zinc-700/80 hover:border-emerald-500/80 text-zinc-300 hover:text-emerald-400 rounded text-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Conectar</span>
          </button>
        </div>
      </div>

      {/* Quick Demo Action if no connections or quick testing */}
      {connections.length === 0 && (
        <div className="p-4 text-center border-b border-zinc-800 bg-zinc-900/30">
          <p className="text-xs text-zinc-400 mb-3">No hay conexiones activas configuradas.</p>
          <button
            onClick={onLoadDemo}
            disabled={isDemoLoading}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isDemoLoading ? 'Creando demo...' : 'Cargar Demo SQLite Instantáneo'}</span>
          </button>
        </div>
      )}

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
        {connections.map((conn) => {
          const isConnExpanded = expandedConnections[conn.id] ?? (conn.id === activeConnectionId);
          const isSelected = activeConnectionId === conn.id;
          const meta = metadataMap[conn.id];

          return (
            <div key={conn.id} className="rounded-md overflow-hidden">
              {/* Connection Root Node */}
              <div
                onClick={(e) => toggleConnection(conn.id, e)}
                className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer group transition ${
                  isSelected ? 'bg-zinc-800 text-zinc-100 font-medium' : 'hover:bg-zinc-900 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {isConnExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  )}
                  <Server className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate" title={conn.name}>
                    {conn.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 uppercase px-1 rounded bg-zinc-900 border border-zinc-800">
                    {conn.driver}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRefreshMetadata(conn.id);
                    }}
                    title="Recargar metadatos del servidor"
                    className="p-1 hover:text-emerald-400 hover:bg-zinc-700/60 rounded"
                  >
                    <RefreshCw className="w-3 h-3 text-zinc-400" />
                  </button>
                </div>
              </div>

              {/* Schemas / Databases Tree */}
              {isConnExpanded && meta && (
                <div className="pl-3 pt-1 space-y-0.5 border-l border-zinc-800/80 ml-3">
                  {meta.schemas.length === 0 ? (
                    <div className="text-[11px] text-zinc-500 italic px-2 py-1">
                      No se encontraron esquemas accesibles.
                    </div>
                  ) : (
                    meta.schemas.map((schema) => {
                      const schemaKey = `${conn.id}-${schema.name}`;
                      const isSchemaExpanded = expandedSchemas[schemaKey] ?? true;

                      return (
                        <div key={schema.name}>
                          {/* Schema Node */}
                          <div
                            onClick={(e) => toggleSchema(schemaKey, e)}
                            className="flex items-center justify-between px-2 py-1 rounded hover:bg-zinc-900 cursor-pointer text-zinc-400 hover:text-zinc-200"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              {isSchemaExpanded ? (
                                <ChevronDown className="w-3 h-3 text-zinc-600 shrink-0" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />
                              )}
                              <Database className="w-3.5 h-3.5 text-amber-400/90 shrink-0" />
                              <span className="truncate font-medium text-zinc-200">{schema.name}</span>
                            </div>
                            <span className="text-[10px] text-zinc-500 bg-zinc-900 px-1 rounded">
                              {schema.tables.length} tablas
                            </span>
                          </div>

                          {/* Tables */}
                          {isSchemaExpanded && (
                            <div className="pl-3 space-y-0.5 border-l border-zinc-800/60 ml-2.5">
                              {schema.tables.length === 0 ? (
                                <div className="text-[11px] text-zinc-500 italic px-2 py-0.5">
                                  Sin tablas
                                </div>
                              ) : (
                                schema.tables.map((table) => {
                                  const tableKey = `${schemaKey}-${table.name}`;
                                  const isTableExpanded = !!expandedTables[tableKey];
                                  const isView = table.table_type.includes('VIEW');
                                  const isMenuOpen = openMenuTableKey === tableKey;

                                  return (
                                    <div key={table.name} className="relative">
                                      <div
                                        onClick={(e) => toggleTable(tableKey, e)}
                                        onDoubleClick={() => onSelectTableForQuery(table, schema.name)}
                                        className="flex items-center justify-between px-2 py-1 rounded hover:bg-zinc-900 cursor-pointer text-zinc-300 hover:text-zinc-100 group"
                                        title={`Doble clic para consultar filas de ${table.name}`}
                                      >
                                        <div className="flex items-center gap-1.5 truncate min-w-0">
                                          {isTableExpanded ? (
                                            <ChevronDown className="w-3 h-3 text-zinc-600 shrink-0" />
                                          ) : (
                                            <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />
                                          )}
                                          {isView ? (
                                            <Eye className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                          ) : (
                                            <TableIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                          )}
                                          <span className="truncate font-mono">{table.name}</span>
                                          {/* Row count badge */}
                                          {table.row_count_estimate !== undefined &&
                                            table.row_count_estimate !== null && (
                                              <span className="text-[10px] text-emerald-400/80 font-mono bg-emerald-950/40 px-1 rounded border border-emerald-900/50 shrink-0">
                                                {table.row_count_estimate >= 1000
                                                  ? `~${(table.row_count_estimate / 1000).toFixed(1)}k`
                                                  : table.row_count_estimate}{' '}
                                                filas
                                              </span>
                                            )}
                                        </div>

                                        {/* Action buttons on hover */}
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onSelectTableForQuery(table, schema.name);
                                            }}
                                            title="Ver primeras 100 líneas"
                                            className="p-0.5 hover:text-emerald-400 transition"
                                          >
                                            <PlayCircle className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenMenuTableKey(isMenuOpen ? null : tableKey);
                                            }}
                                            title="Fórmulas y consultas rápidas"
                                            className="p-0.5 hover:text-amber-400 transition"
                                          >
                                            <MoreVertical className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Formulas Dropdown Menu */}
                                      {isMenuOpen && (
                                        <div
                                          onClick={(e) => e.stopPropagation()}
                                          className="absolute right-0 top-full mt-1 w-56 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl py-1.5 z-40 text-xs"
                                        >
                                          <div className="px-3 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800 mb-1">
                                            Fórmulas para {table.name}
                                          </div>
                                          <button
                                            onClick={() => {
                                              onSelectFormula('count', table, schema.name);
                                              setOpenMenuTableKey(null);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800 text-left text-zinc-200"
                                          >
                                            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>Contar líneas (COUNT *)</span>
                                          </button>
                                          <button
                                            onClick={() => {
                                              onSelectFormula('select', table, schema.name);
                                              setOpenMenuTableKey(null);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800 text-left text-zinc-200"
                                          >
                                            <PlayCircle className="w-3.5 h-3.5 text-blue-400" />
                                            <span>Primeras 100 líneas (LIMIT)</span>
                                          </button>
                                          <button
                                            onClick={() => {
                                              onSelectFormula('latest', table, schema.name);
                                              setOpenMenuTableKey(null);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800 text-left text-zinc-200"
                                          >
                                            <ListOrdered className="w-3.5 h-3.5 text-amber-400" />
                                            <span>Últimas 100 líneas (ORDER BY DESC)</span>
                                          </button>
                                          <button
                                            onClick={() => {
                                              onSelectFormula('describe', table, schema.name);
                                              setOpenMenuTableKey(null);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800 text-left text-zinc-200"
                                          >
                                            <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                                            <span>Estructura (DESCRIBE)</span>
                                          </button>
                                          <button
                                            onClick={() => {
                                              onSelectFormula('insert', table, schema.name);
                                              setOpenMenuTableKey(null);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800 text-left text-zinc-200"
                                          >
                                            <FileCode className="w-3.5 h-3.5 text-rose-400" />
                                            <span>Plantilla INSERT INTO</span>
                                          </button>
                                        </div>
                                      )}

                                      {/* Columns */}
                                      {isTableExpanded && (
                                        <div className="pl-3 space-y-0.5 border-l border-zinc-800/40 ml-2.5 my-1">
                                          {table.columns.map((col) => (
                                            <div
                                              key={col.name}
                                              className="flex items-center justify-between px-2 py-0.5 text-zinc-400 hover:text-zinc-200"
                                            >
                                              <div className="flex items-center gap-1.5 truncate">
                                                {col.is_primary_key ? (
                                                  <Key className="w-3 h-3 text-amber-400 shrink-0" />
                                                ) : (
                                                  <Columns className="w-3 h-3 text-zinc-600 shrink-0" />
                                                )}
                                                <span className="truncate text-[11px] font-mono">{col.name}</span>
                                              </div>
                                              <span className="text-[10px] text-zinc-500 uppercase font-mono">
                                                {col.data_type}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between bg-zinc-950">
        <span>DataSybil Core v0.1.0</span>
        <button
          onClick={onLoadDemo}
          disabled={isDemoLoading}
          className="text-emerald-400 hover:underline flex items-center gap-1"
        >
          <Zap className="w-3 h-3" />
          <span>Demo DB</span>
        </button>
      </div>
    </aside>
  );
};
