import React, { useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
  isExecuting: boolean;
}

export const SqlEditor: React.FC<Props> = ({ value, onChange, onExecute, isExecuting }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Add Ctrl+Enter / Cmd+Enter command to run query
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onExecute();
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
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#1e1e1e]">
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
      {isExecuting && (
        <div className="absolute top-2 right-4 flex items-center gap-2 px-3 py-1 bg-emerald-950/80 border border-emerald-600/50 rounded-full text-xs text-emerald-300 backdrop-blur shadow-md z-10 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Ejecutando consulta...</span>
        </div>
      )}
    </div>
  );
};
