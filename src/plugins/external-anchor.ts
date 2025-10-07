import { visit } from 'unist-util-visit';

const site = 'https://shad.moe';
const draft_site = 'https://blog-preview.shad.moe';
const webring = 'ring.purduehackers.com';

export function externalAnchorPlugin() {
	// biome-ignore lint/suspicious/noExplicitAny: DOM Node
	return (tree: any, _: any) => {
		visit(tree, 'link', (node) => {
			if (
				/^(https?):\/\/[^\s/$.?#].[^\s]*$/i.test(node.url) &&
				!node.url.includes(site) &&
				!node.url.includes(draft_site)
			) {
				if (!node.url.includes(webring)) {
					node.data ??= {};
					node.data.hProperties ??= {};
					node.data.hProperties.target = '_blank';
				}
				node.data.hProperties.dataUmamiEvent = 'outbound-link-click'; // Becomes data-umami-event
				node.data.hProperties.dataUmamiEventUrl = `${node.url}`; // Becomes data-umami-event-url
			}
		});
	};
}
