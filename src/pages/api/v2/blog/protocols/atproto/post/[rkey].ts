import { safeFetch } from '@utils/content-utils';
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (Astro) => {
	try {
		const user = Astro.params.rkey?.split('-')[0];
		const rkey = Astro.params.rkey?.split('-')[1];

		if (user && rkey) {
			const postResponse = await safeFetch(
				`https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=at://${user}/app.bsky.feed.post/${rkey}`
			);

			if (!postResponse.error) {
				return new Response(
					JSON.stringify({
						postType: 'atproto',
						likeCount: postResponse.thread.post.likeCount,
						replyCount: postResponse.thread.post.replyCount,
						repostCount: postResponse.thread.post.repostCount,
						quoteCount: postResponse.thread.post.quoteCount,
						url: `https://bsky.app/profile/${user}/post/${rkey}`,
					})
				);
			}
		}
		throw new Error('Missing name or rkey parameter');
	} catch (err) {
		return new Response(
			JSON.stringify({
				success: false,
				error: err instanceof Error ? err.message : 'Unknown error',
			}),
			{ status: 500 }
		);
	}
};
