import { safeFetch } from '@utils/content-utils';
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (Astro) => {
	try {
		const id = Astro.params.id;

		if (id) {
			const profileResponse = await safeFetch(
				`https://mastodon.social/api/v1/accounts/lookup?acct=${id.replace('^@', '')}`
			);

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
