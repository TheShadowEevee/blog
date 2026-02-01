import { safeFetch } from '@utils/content-utils';
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (Astro) => {
	try {
		const id = Astro.params.id;

		if (id) {
			const cacheURL = `${import.meta.env.API_DOMAIN}/api/v2/blog/cache/blob?type=author&id=${id}`;

			const cacheResponse = await fetch(cacheURL);

			if (cacheResponse.status == 200) {
				const response = await cacheResponse.json();

				return new Response(response);
			} else {
				const profileResponse = await safeFetch(
					`https://mastodon.social/api/v1/accounts/lookup?acct=${id.replace('^@', '')}`
				);

				const authorPost = await fetch(cacheURL, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: profileResponse.display_name,
						avatar: profileResponse.avatar,
						url: profileResponse.url,
					}),
				});

				if (authorPost.status != 200) {
					console.log(
						`Error caching the post. Check the logs on the API server for more information.`
					);
				}

				if (!profileResponse.error) {
					return new Response(
						JSON.stringify({
							name: profileResponse.display_name,
							avatar: profileResponse.avatar,
							url: profileResponse.url,
						})
					);
				}
			}
		}
		throw new Error('Missing id parameter');
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
