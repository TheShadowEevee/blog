"use client";
// ForwardRefEditor.tsx
import dynamic from "next/dynamic";
// @ts-ignore - "react" can't be found here
import { forwardRef } from "react";
import type { MDXEditorMethods, MDXEditorProps } from "@mdxeditor/editor";

// This is the only place InitializedMDXEditor is imported directly.
const Editor = dynamic(() => import("./MDXEditor"), {
  // Make sure we turn SSR off
  ssr: false,
});

// This is what is imported by other components. Pre-initialized with plugins, and ready
// to accept other props, including a ref.
// @ts-ignore - This has multiple type errors that are fine to ignore. Sorry!
export const ForwardRefEditor = forwardRef<MDXEditorMethods, MDXEditorProps>(
  (props, ref) => <Editor {...props} editorRef={ref} />,
);

// TS complains without the following line
ForwardRefEditor.displayName = "ForwardRefEditor";
