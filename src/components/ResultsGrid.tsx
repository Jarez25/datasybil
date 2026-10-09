import React, { useState, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { QueryResult } from '../types';
import {
  Download,
  Copy,
  Search,
  Clock,
  Rows,
  Check,
  FileSpreadsheet,
  FileCode,
  FileText,
  Database,
  Maximize2,
  X,
  FolderDown,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';

interface Props {
  result: QueryResult | null;
  tableName?: string;
}

interface SortConfig {
  colIndex: number;
  direction: 'asc' | 'desc';
}

export const ResultsGrid: React.FC<Props> = ({ result, tableName = 'result_set' }) => {
  const [filterText, setFilterText] = useState('');
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number; val: unknown } | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const toggleSort = (colIndex: number) => {
    setSortConfig((prev) => {
      if (!prev || prev.colIndex !== colIndex) {
        return { colIndex, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { colIndex, direction: 'desc' };
      }
      return null; // Return to original order
    });
  };

  // Filter rows based on search input
  const filteredRows = useMemo(() => {
    if (!result) return [];
    if (!filterText.trim()) return result.rows;
    const query = filterText.toLowerCase();

    return result.rows.filter((row) =>
      row.some((cell) => (cell !== null && cell !== undefined ? String(cell).toLowerCase().includes(query) : false))
    );
  }, [result, filterText]);

  // Sort rows based on active column and direction (smart typing: numbers, strings, booleans, dates)
  const sortedAndFilteredRows = useMemo(() => {
    if (!sortConfig) return filteredRows;
    const { colIndex, direction } = sortConfig;

    return [...filteredRows].sort((rowA, rowB) => {
      const a = rowA[colIndex];
      const b = rowB[colIndex];

      // Nulls always placed at the bottom regardless of asc/desc
      if ((a === null || a === undefined) && (b === null || b === undefined)) return 0;
      if (a === null || a === undefined) return 1;
      if (b === null || b === undefined) return -1;

      let comp = 0;
      if (typeof a === 'number' && typeof b === 'number') {
        comp = a - b;
      } else if (typeof a === 'boolean' && typeof b === 'boolean') {
        comp = (a ? 1 : 0) - (b ? 1 : 0);
      } else {
        // Natural alphanumeric comparison
        comp = String(a).localeCompare(String(b), undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      }

      return direction === 'asc' ? comp : -comp;
    });
  }, [filteredRows, sortConfig]);

  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-500 bg-zinc-950 p-6 select-none">
        <Database className="w-12 h-12 text-zinc-800 mb-3" />
        <p className="text-sm font-medium">Ejecuta una consulta SQL para visualizar los resultados</p>
        <p className="text-xs text-zinc-600 mt-1">Presiona Ctrl + Enter o haz clic en el botón Ejecutar</p>
      </div>
    );
  }

  const handleDownload = async (format: 'csv' | 'excel') => {
    if (!result) return;
    setShowExportMenu(false);
    try {
      const cleanName = tableName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'consulta';
      const defaultFilename = `${cleanName}.${format === 'excel' ? 'xls' : 'csv'}`;

      const savedPath = await invoke<string | null>('export_query_result', {
        defaultFilename,
        format,
        columns: result.columns,
        rows: result.rows,
      });

      if (savedPath) {
        setSavedNotice(`Guardado en: ${savedPath}`);
        setTimeout(() => setSavedNotice(null), 5000);
      }
    } catch (err) {
      console.error('Error al exportar archivo:', err);
    }
  };

  const copyToClipboard = (format: 'csv' | 'json' | 'markdown' | 'sql') => {
    if (!result) return;
    let output = '';

    if (format === 'csv') {
      const headers = result.columns.map((c) => `"${c.name}"`).join(',');
      const rows = result.rows
        .map((r) => r.map((cell) => (cell === null ? '' : `"${String(cell).replace(/"/g, '""')}"`)).join(','))
        .join('\n');
      output = `\uFEFF${headers}\n${rows}`;
    } else if (format === 'json') {
      const records = result.rows.map((r) => {
        const obj: Record<string, unknown> = {};
        result.columns.forEach((c, i) => {
          obj[c.name] = r[i];
        });
        return obj;
      });
      output = JSON.stringify(records, null, 2);
    } else if (format === 'markdown') {
      const headers = `| ${result.columns.map((c) => c.name).join(' | ')} |`;
      const separator = `| ${result.columns.map(() => '---').join(' | ')} |`;
      const rows = result.rows.map((r) => `| ${r.map((c) => (c === null ? 'NULL' : String(c))).join(' | ')} |`).join('\n');
      output = `${headers}\n${separator}\n${rows}`;
    } else if (format === 'sql') {
      const colNames = result.columns.map((c) => c.name).join(', ');
      const rows = result.rows
        .map((r) => {
          const vals = r
            .map((c) => {
              if (c === null) return 'NULL';
              if (typeof c === 'number') return c;
              if (typeof c === 'boolean') return c ? 1 : 0;
              return `'${String(c).replace(/'/g, "''")}'`;
            })
            .join(', ');
          return `INSERT INTO ${tableName} (${colNames}) VALUES (${vals});`;
        })
        .join('\n');
      output = rows;
    }

    navigator.clipboard.writeText(output);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2500);
    setShowExportMenu(false);
  };

  return (
    <div
      className="h-full flex flex-col bg-zinc-950 text-zinc-200 select-none overflow-hidden relative"
      onClick={() => setShowExportMenu(false)}
    >
      {/* Grid Toolbar */}
      <div className="h-10 px-3 bg-zinc-900/70 border-b border-zinc-800 flex items-center justify-between gap-3 text-xs shrink-0">
        {/* Search Filter */}
        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1 w-64 focus-within:border-emerald-500">
          <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filtrar datos en memoria..."
            className="bg-transparent border-none outline-none text-zinc-100 placeholder-zinc-500 w-full text-xs"
          />
          {filterText && (
            <button onClick={() => setFilterText('')} className="text-zinc-500 hover:text-zinc-300">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Performance & Row Counter Stats */}
        <div className="flex items-center gap-4 text-zinc-400">
          {sortConfig && (
            <button
              onClick={() => setSortConfig(null)}
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-300 rounded border border-zinc-700 transition"
              title="Restablecer orden original"
            >
              <span>
                Orden: <strong>{result.columns[sortConfig.colIndex]?.name}</strong> ({sortConfig.direction === 'asc' ? 'A-Z' : 'Z-A'})
              </span>
              <X className="w-3 h-3" />
            </button>
          )}

          <div className="flex items-center gap-1.5" title="Tiempo de ejecución de la consulta en el motor">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-emerald-300 font-medium">
              {result.execution_time_ms} ms
            </span>
          </div>

          <div className="flex items-center gap-1.5" title="Filas retornadas">
            <Rows className="w-3.5 h-3.5 text-zinc-400" />
            <span>
              <strong className="text-zinc-200 font-mono">{sortedAndFilteredRows.length}</strong>
              {sortedAndFilteredRows.length !== result.rows.length && ` de ${result.rows.length}`} filas
            </span>
          </div>

          {/* Export Dropdown Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowExportMenu(!showExportMenu);
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded border border-emerald-500/40 font-medium transition shadow-sm"
              title="Descargar o copiar resultados"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar</span>
              <ChevronDown className="w-3 h-3 text-emerald-400" />
            </button>

            {showExportMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1.5 w-60 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl py-1.5 z-40 text-xs"
              >
                {/* Download section */}
                <div className="px-3 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800 mb-1">
                  Descargar a tu Equipo
                </div>
                <button
                  onClick={() => handleDownload('excel')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-800 text-left text-zinc-200 group transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-medium text-emerald-300">Descargar como Excel (.xls)</span>
                    <span className="text-[10px] text-zinc-400">Seleccionar carpeta de destino</span>
                  </div>
                </button>
                <button
                  onClick={() => handleDownload('csv')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-800 text-left text-zinc-200 group transition border-b border-zinc-800/80 mb-1"
                >
                  <FolderDown className="w-4 h-4 text-blue-400 group-hover:scale-110 transition shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-medium text-blue-300">Descargar como CSV (.csv)</span>
                    <span className="text-[10px] text-zinc-400">Compatible con Excel UTF-8</span>
                  </div>
                </button>

                {/* Copy section */}
                <div className="px-3 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Copiar al Portapapeles
                </div>
                <button
                  onClick={() => copyToClipboard('csv')}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800 text-left text-zinc-300"
                >
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copiar como CSV</span>
                </button>
                <button
                  onClick={() => copyToClipboard('json')}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800 text-left text-zinc-300"
                >
                  <FileCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copiar como JSON</span>
                </button>
                <button
                  onClick={() => copyToClipboard('markdown')}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800 text-left text-zinc-300"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Copiar como Markdown</span>
                </button>
                <button
                  onClick={() => copyToClipboard('sql')}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800 text-left text-zinc-300"
                >
                  <Database className="w-3.5 h-3.5 text-purple-400" />
                  <span>Copiar como SQL INSERT</span>
                </button>
              </div>
            )}
          </div>

          {copiedFormat && (
            <div className="flex items-center gap-1 text-emerald-400 animate-fade-in font-medium">
              <Check className="w-3.5 h-3.5" />
              <span className="capitalize">{copiedFormat} copiado!</span>
            </div>
          )}

          {savedNotice && (
            <div
              className="flex items-center gap-1.5 text-emerald-300 bg-emerald-950/80 border border-emerald-600/50 px-2.5 py-0.5 rounded-md animate-fade-in font-medium max-w-xs truncate"
              title={savedNotice}
            >
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{savedNotice}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid Viewport */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left font-mono text-xs select-text">
          {/* Header */}
          <thead className="bg-zinc-900 sticky top-0 z-10 border-b border-zinc-800 select-none">
            <tr>
              <th className="px-3 py-2 w-12 text-center text-zinc-600 border-r border-zinc-800/80 font-normal">
                #
              </th>
              {result.columns.map((col, idx) => {
                const isSorted = sortConfig?.colIndex === idx;

                return (
                  <th
                    key={idx}
                    onClick={() => toggleSort(idx)}
                    className={`px-3 py-2 border-r border-zinc-800/80 font-medium group cursor-pointer transition select-none ${
                      isSorted ? 'bg-zinc-800 text-emerald-300' : 'text-zinc-300 hover:bg-zinc-800/60'
                    }`}
                    title="Clic para ordenar (Ascendente / Descendente / Quitar orden)"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 truncate">
                        <span className="font-semibold text-zinc-100 truncate">{col.name}</span>
                        {isSorted ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 font-normal uppercase bg-zinc-950/60 px-1 rounded border border-zinc-800 shrink-0">
                        {col.data_type}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-zinc-900">
            {sortedAndFilteredRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-zinc-900/60 transition group">
                {/* Row Number */}
                <td className="px-3 py-1.5 text-center text-zinc-600 bg-zinc-950/80 border-r border-zinc-800/80 text-[11px] select-none">
                  {rIdx + 1}
                </td>

                {/* Cells */}
                {row.map((cell, cIdx) => {
                  const isNull = cell === null || cell === undefined;
                  const isSelected = selectedCell?.row === rIdx && selectedCell?.col === cIdx;
                  const isSortedColumn = sortConfig?.colIndex === cIdx;

                  return (
                    <td
                      key={cIdx}
                      onClick={() => setSelectedCell({ row: rIdx, col: cIdx, val: cell })}
                      className={`px-3 py-1.5 border-r border-zinc-800/50 truncate max-w-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/60 outline outline-1 outline-emerald-500'
                          : isSortedColumn
                          ? 'bg-zinc-900/40 hover:bg-zinc-800/40'
                          : 'hover:bg-zinc-800/40'
                      }`}
                    >
                      {isNull ? (
                        <span className="text-zinc-600 italic font-sans text-[11px]">NULL</span>
                      ) : typeof cell === 'boolean' ? (
                        <span className={cell ? 'text-emerald-400' : 'text-rose-400'}>
                          {cell ? 'TRUE' : 'FALSE'}
                        </span>
                      ) : typeof cell === 'number' ? (
                        <span className="text-cyan-400">{cell}</span>
                      ) : (
                        <span className="text-zinc-200">{String(cell)}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cell Value Inspector Drawer (DataGrip style value viewer) */}
      {selectedCell && (
        <div className="absolute right-0 bottom-0 top-10 w-96 bg-zinc-900/95 backdrop-blur-md border-l border-zinc-700 shadow-2xl flex flex-col z-20 animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inspector de Celda ({result.columns[selectedCell.col]?.name})</span>
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-zinc-400 hover:text-zinc-200 p-0.5 rounded hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 flex-1 overflow-auto">
            <div className="text-xs text-zinc-500 mb-2">
              Tipo: <span className="font-mono text-zinc-300">{result.columns[selectedCell.col]?.data_type}</span>
            </div>
            <textarea
              readOnly
              value={
                selectedCell.val === null
                  ? 'NULL'
                  : typeof selectedCell.val === 'object'
                  ? JSON.stringify(selectedCell.val, null, 2)
                  : String(selectedCell.val)
              }
              className="w-full h-64 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 resize-none outline-none focus:border-zinc-700 select-all"
            />
          </div>

          <div className="p-3 border-t border-zinc-800 flex justify-end">
            <button
              onClick={() => {
                navigator.clipboard.writeText(String(selectedCell.val ?? 'NULL'));
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded transition"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Valor</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
