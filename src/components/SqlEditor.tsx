import React, { useRef, useState, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { getStatementAtLine } from '../utils/sqlParser';
import { Play } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onExecute: (queryToRun?: string) => void;
  onActiveQueryChange?: (query: string) => void;
  isExecuting: boolean;
}

export const SqlEditor: React.FC<Props> = ({
  value,
  onChange,
  onExecute,
  onActiveQueryChange,
  isExecuting,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monacoRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const decorationsRef = useRef<any>([]);
  const [activeStatementInfo, setActiveStatementInfo] = useState<{
    startLine: number;
    endLine: number;
    isSelection: boolean;
    preview: string;
  } | null>(null);

  const getQueryToRun = (): string => {
    if (!editorRef.current) return value;
    const editor = editorRef.current;
    const selection = editor.getSelection();

    // 1. If text is selected, execute only selection
    if (selection && !selection.isEmpty()) {
      const selectedText = editor.getModel()?.getValueInRange(selection)?.trim();
      if (selectedText) return selectedText;
    }

    // 2. Otherwise execute statement at cursor
    const position = editor.getPosition();
    if (position) {
      const stmt = getStatementAtLine(editor.getValue(), position.lineNumber);
      if (stmt && stmt.sql.trim()) {
        return stmt.sql;
      }
    }

    return editor.getValue().trim();
  };

  const updateStatementDecoration = () => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const selection = editor.getSelection();
    const currentSql = editor.getValue();

    if (selection && !selection.isEmpty()) {
      const startLine = selection.startLineNumber;
      const endLine = selection.endLineNumber;
      const preview = editor.getModel()?.getValueInRange(selection)?.trim() || '';

      setActiveStatementInfo({
        startLine,
        endLine,
        isSelection: true,
        preview: preview.slice(0, 60),
      });

      // Clear decorations since selection is already visible
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      onActiveQueryChange?.(preview);
      return;
    }

    const position = editor.getPosition();
    if (!position) return;

    const stmt = getStatementAtLine(currentSql, position.lineNumber);
    if (!stmt) {
      setActiveStatementInfo(null);
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      onActiveQueryChange?.(currentSql.trim());
      return;
    }

    setActiveStatementInfo({
      startLine: stmt.startLine,
      endLine: stmt.endLine,
      isSelection: false,
      preview: stmt.sql.slice(0, 60),
    });

    onActiveQueryChange?.(stmt.sql);

    // Highlight statement lines in Monaco (subtle DataGrip-style statement highlight)
    const newDecorations = [
      {
        range: new monaco.Range(stmt.startLine, 1, stmt.endLine, 1),
        options: {
          isWholeLine: true,
          className: 'active-statement-line-highlight',
          linesDecorationsClassName: 'active-statement-gutter-icon',
        },
      },
    ];

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Command: Ctrl+Enter / Cmd+Enter runs selected or current statement
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      const query = getQueryToRun();
      onExecute(query);
    });

    // Listen to cursor movement to highlight statement under cursor
    editor.onDidChangeCursorPosition(() => {
      updateStatementDecoration();
    });

    editor.onDidChangeCursorSelection(() => {
      updateStatementDecoration();
    });

    // Configure SQL format options
    editor.updateOptions({
      fontSize: 13,
      lineHeight: 20,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      suggestOnTriggerCharacters: true,
      tabSize: 2,
    });

    // Initial decoration
    setTimeout(updateStatementDecoration, 100);
  };

  useEffect(() => {
    updateStatementDecoration();
  }, [value]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#1e1e1e] flex flex-col">
      <div className="flex-1 relative overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="sql"
          theme="vs-dark"
          value={value}
          onChange={(val) => onChange(val || '')}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 13,
            lineHeight: 20,
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            padding: { top: 8, bottom: 8 },
          }}
        />
      </div>

      {/* Active Statement Status Bar (DataGrip style) */}
      {activeStatementInfo && (
        <div className="h-6 px-3 bg-zinc-900 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 select-none shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="font-semibold text-zinc-300">
              {activeStatementInfo.isSelection
                ? 'Selección activa'
                : `Consulta activa (líneas ${activeStatementInfo.startLine}-${activeStatementInfo.endLine}):`}
            </span>
            <span className="font-mono text-zinc-400 truncate max-w-md">
              {activeStatementInfo.preview}...
            </span>
          </div>

          <button
            onClick={() => {
              const query = getQueryToRun();
              onExecute(query);
            }}
            disabled={isExecuting}
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition shrink-0 ml-2"
            title="Ejecutar esta consulta específica"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Ejecutar (Ctrl ↵)</span>
          </button>
        </div>
      )}

      {isExecuting && (
        <div className="absolute top-2 right-4 flex items-center gap-2 px-3 py-1 bg-emerald-950/80 border border-emerald-600/50 rounded-full text-xs text-emerald-300 backdrop-blur shadow-md z-10 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Ejecutando consulta...</span>
        </div>
      )}
    </div>
  );
};
