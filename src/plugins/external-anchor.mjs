import { visit } from 'unist-util-visit';

const site = 'https://blog.shad.moe';
const draft_site = 'vercel.app';

export function externalAnchorPlugin() {
  return (tree, file) => {
    visit(tree, 'link', (node) => {
      if (/^(https?):\/\/[^\s/$.?#].[^\s]*$/i.test(node.url) && !node.url.includes(site) && !node.url.includes(draft_site)) {
        node.data ??= {};
        node.data.hProperties ??= {};
        node.data.hProperties.target = '_blank';
      }
    });
  }
}