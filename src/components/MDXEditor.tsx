"use client";
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  codeBlockPlugin,
  codeMirrorPlugin,
  CodeToggle,
  CreateLink,
  diffSourcePlugin,
  DiffSourceToggleWrapper,
  directivesPlugin,
  InsertTable,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  quotePlugin,
  Separator,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
  type DirectiveDescriptor,
  type MDXEditorMethods,
  type MDXEditorProps,
} from "@mdxeditor/editor";
import { headingsPlugin } from "@mdxeditor/editor";

import "@mdxeditor/editor/style.css";
import type { RootContent } from "mdast";
import { type ForwardedRef } from "react";

function AdmonitionComponent({
  children,
  type,
}: {
  children: RootContent[];
  type: 'tip' | 'note' | 'important' | 'caution' | 'warning';
}) {

  if (!Array.isArray(children) || children.length === 0) {
    return (
      <div className="hidden">
        Invalid admonition directive. (Admonition directives must be of block type &quot;:::note{name='name'} &lt;content&gt; :::&quot;)
      </div>
    );
  }

  let label = null;
  if (children[0].data?.directiveLabel) {
    label = children[0].children[0].value; // The first child is the label
    children = children.slice(1);
    if (typeof label === 'object' && label?.tagName === 'p') {
      label.tagName = 'div'; // Change <p> to <div> (assumes `label` is mutable)
    }
  }

  // Function to extract text content from AST nodes
  const extractText = (node: any) => {
    if (!node) return '';
    
    if (node.type === 'text') {
      return node.value; // For text nodes, return the value
    } 
    
    // For other node types (like paragraphs), recurse into children and render them
    if (node.children && Array.isArray(node.children)) {
      return node.children.map(extractText).join(''); // Join all child text values
    }

    // Fallback: Render the node as a string for debugging
    return JSON.stringify(node);
  };

  return (
    <blockquote className={`admonition bdm-${type}`}>
      <span className="bdm-title">{label ? label : type.toUpperCase()}</span>
      {children.map((child, index) => {
        const textContent = extractText(child);
        return <p key={index}>{textContent}</p>;
      })}
    </blockquote>
  );
} 

const AdmonitionDirectiveDescriptorSelf: DirectiveDescriptor = {
  name: 'admonition',
  testNode(node) {
    return ['tip', 'note', 'important', 'caution', 'warning'].includes(node.name);
  },
  attributes: ['type', 'has-directive-label'],
  hasChildren: true,
  Editor: (props) => {
    if (!props || !props.mdastNode) {
      return <div style={{ color: 'red' }}>Invalid node</div>; // Fallback rendering
    }
    // Extract children from mdastNode (ensure it's properly structured)
    const children = props.mdastNode.children || [];
    const properties = props.mdastNode.attributes || {}; // Ensure properties are passed correctly
    const type = props.mdastNode.name || 'warning'; // Default to 'warning' if name is missing
    return (
      <AdmonitionComponent
        properties={properties}
        children={children}
        type={type}
      />
    );
  },
};

export const InitializedMDXEditor = ({
  editorRef,
  ...props
}: { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps) => {
  return (
    <div>
      <div>
        <MDXEditor
          className="transition bg-[var(--card-bg)] dark-editor-[var(--card-bg)]"
          contentEditableClassName="prose dark:prose-invert prose-base !max-w-none custom-md mb-6 markdown-content onload-animation"
          plugins={[
            diffSourcePlugin({
              diffMarkdown: "An older version",
              viewMode: "rich-text",
            }),
            directivesPlugin({
              directiveDescriptors: [AdmonitionDirectiveDescriptorSelf],
            }),
            linkPlugin(),
            tablePlugin(),
            headingsPlugin(),
            quotePlugin(),
            markdownShortcutPlugin(),
            toolbarPlugin({
              toolbarContents: () => (
                <>
                  <DiffSourceToggleWrapper>
                    <UndoRedo />
                    <BoldItalicUnderlineToggles />
                    <Separator />
                    <ListsToggle />
                    <InsertTable />
                    <CodeToggle />
                  </DiffSourceToggleWrapper>
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
                sql: "SQL",
                bash: "Bash",
                python: "Python",
              },
            }),
            thematicBreakPlugin(),
          ]}
          {...props}
          ref={editorRef}
        />
      </div>
    </div>
  );
};

export default InitializedMDXEditor;
