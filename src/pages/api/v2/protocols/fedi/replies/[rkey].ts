import { safeFetch } from '@utils/content-utils';
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (Astro) => {
	try {
		const user = Astro.params.rkey?.split('-')[0];
		const rkey = Astro.params.rkey?.split('-')[1];
		const instance = user?.replace('^@', '').split('@')[2];

		// https://infosec.exchange/api/v1/statuses/115981504902066653

		if (user && rkey) {
			const postResponse = await safeFetch(
				`https://${instance}/api/v1/statuses/${rkey}/context`
			);

			if (!postResponse.error) {
				return new Response(JSON.stringify(postResponse));
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
