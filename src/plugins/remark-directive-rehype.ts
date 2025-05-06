import { h } from "hastscript";
import { visit } from "unist-util-visit";
import type { Node } from "unist";
import type { Element, Properties } from "hast";

interface DirectiveNode extends Node {
  type: "containerDirective" | "leafDirective" | "textDirective";
  name: string;
  attributes?: Properties;
  data?: {
    hName?: string;
    hProperties?: Properties;
    directiveLabel?: boolean;
  };
  children?: DirectiveNode[];
}

export function parseDirectiveNode() {
  return (tree: Node, {}: { data: any }) => {
    visit(tree, (node: Node) => {
      if (
        node.type === "containerDirective" ||
        node.type === "leafDirective" ||
        node.type === "textDirective"
      ) {
        const directiveNode = node as DirectiveNode;
        directiveNode.data = directiveNode.data || {};

        directiveNode.attributes = directiveNode.attributes || {};

        if (
          directiveNode.children &&
          directiveNode.children.length > 0 &&
          directiveNode.children[0].data &&
          directiveNode.children[0].data.directiveLabel
        ) {
          directiveNode.attributes["has-directive-label"] = true;
        }

        const hast = h(
          directiveNode.name,
          directiveNode.attributes as Properties
        ) as Element;

        directiveNode.data.hName = hast.tagName;
        directiveNode.data.hProperties = hast.properties;
      }
    });
  };
}
