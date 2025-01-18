"use client";
import {
  BoldItalicUnderlineToggles,
  codeBlockPlugin,
  codeMirrorPlugin,
  InsertCodeBlock,
  listsPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  toolbarPlugin,
  UndoRedo,
  type MDXEditorMethods,
  type MDXEditorProps,
} from "@mdxeditor/editor";
import { headingsPlugin } from "@mdxeditor/editor";

import "@mdxeditor/editor/style.css";
import {
  useRef,
  useState,
  type Ref,
  forwardRef,
  type ForwardedRef,
} from "react";

const MDXEditComponent = ({
  editorRef,
  ...props
}: { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps) => {
  const [markdown, setMarkdown] = useState<string>(
    "*Test Content*\n\nHello world!"
  );

  return (
    <div>
      <div>
        <MDXEditor
          className="dark-theme dark-editor"
          plugins={[
            headingsPlugin(),
            toolbarPlugin({
              toolbarContents: () => (
                <>
                  <UndoRedo />
                  <BoldItalicUnderlineToggles />
                </>
              ),
            }),
            codeBlockPlugin({
              defaultCodeBlockLanguage: "js",
            }),
            listsPlugin(),
            codeMirrorPlugin({
              codeBlockLanguages: {
                js: "JavaScript",
                css: "CSS",
                txt: "text",
                tsx: "TypeScript",
                ts: "TypeScript",
              },
            }),
          ]}
          {...props}
          ref={editorRef}
        />
      </div>
    </div>
  );

  // return (
  //   <MDXEditor
  //     className="dark-theme dark-editor"
  //     ref={mdxEditorRef}
  //     markdown={markdown}
  //     onChange={(markdown: string) => {
  //       setMarkdown(markdown);
  //     }}
  //     plugins={[
  //       headingsPlugin(),
  //       codeBlockPlugin({
  //         defaultCodeBlockLanguage: "js",
  //       }),
  //       listsPlugin(),
  //       codeMirrorPlugin({
  //         codeBlockLanguages: {
  //           js: "JavaScript",
  //           css: "CSS",
  //           txt: "text",
  //           tsx: "TypeScript",
  //           ts: "TypeScript",
  //         },
  //       }),
  //       markdownShortcutPlugin(),
  //     ]}
  //   />
  // );
};

export default MDXEditComponent;
