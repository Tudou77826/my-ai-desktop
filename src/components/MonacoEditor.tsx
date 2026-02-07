// ==================== MonacoEditor Component ====================

import { forwardRef } from 'react';
import Editor from '@monaco-editor/react';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language: 'json' | 'markdown';
  height?: string;
  onMount?: () => void;
}

export const MonacoEditor = forwardRef<any, MonacoEditorProps>(
  ({ value, onChange, language, height = '500px', onMount }, ref) => {
    return (
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={onChange}
        onMount={onMount}
        theme="vs-light"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    );
  }
);

MonacoEditor.displayName = 'MonacoEditor';
