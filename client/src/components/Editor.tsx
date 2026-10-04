import { useEffect, useRef } from "react";
import {EditorView} from '@codemirror/view';
import {basicSetup} from 'codemirror';
import {javascript} from '@codemirror/lang-javascript';
import {oneDark} from '@codemirror/theme-one-dark';
import {yCollab} from 'y-codemirror.next';
import { ytext } from "../utils/yjs";

export function Editor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const view = new EditorView({
      extensions: [
        basicSetup,
        javascript(),
        oneDark,
        yCollab(ytext, null),
      ],
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

  return (
    <div
      ref={editorRef}
      style={{
        minHeight: '400px',
        border: '1px solid #374151',
        borderRadius: '0.5rem',
        overflow: 'hidden',
      }}
    />
  );
}
