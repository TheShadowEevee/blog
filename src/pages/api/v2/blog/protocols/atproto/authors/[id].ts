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
					`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${id}`
				);

				if (!profileResponse.error) {
					const split = profileResponse.did.split(':');
					if (split[0] === 'did') {
						if (split[1] === 'plc') {
							const diddoc = await safeFetch(
								`https://plc.directory/${profileResponse.did}`
							);
							for (const service of diddoc.service) {
								if (service.id === '#atproto_pds') {
									const authorPost = await fetch(cacheURL, {
										method: 'POST',
										headers: { 'Content-Type': 'application/json' },
										body: JSON.stringify({
											name: profileResponse.displayName,
											avatar: profileResponse.avatar,
											url: `https://bsky.app/profile/${profileResponse.did}`,
										}),
									});

									if (!authorPost.status == 200) {
										console.log(
											`Error caching the post. Check the logs on the API server for more information.`
										);
									}

									return new Response(
										JSON.stringify({
											name: profileResponse.displayName,
											avatar: profileResponse.avatar,
											url: `https://bsky.app/profile/${profileResponse.did}`,
										})
									);
								}
							}
							throw new Error('DID lacks #atproto_pds service');
						} else if (split[1] === 'web') {
							const diddoc = await safeFetch(
								`https://${split[2]}/.well-known/did.json`
							);
							for (const service of diddoc.service) {
								if (service.id === '#atproto_pds') {
									const authorPost = await fetch(cacheURL, {
										method: 'POST',
										headers: { 'Content-Type': 'application/json' },
										body: JSON.stringify({
											name: profileResponse.displayName,
											avatar: profileResponse.avatar,
											url: `https://bsky.app/profile/${profileResponse.did}`,
										}),
									});

									if (!authorPost.status == 200) {
										console.log(
											`Error caching the post. Check the logs on the API server for more information.`
										);
									}

									return new Response(
										JSON.stringify({
											name: profileResponse.displayName,
											avatar: profileResponse.avatar,
											url: `https://bsky.app/profile/${profileResponse.did}`,
										})
									);
								}
							}
							throw new Error('DID lacks #atproto_pds service');
						}
						throw new Error('Invalid DID, Not blessed method');
					}
					throw new Error('Invalid DID, malformed');
				}
			}
		}
		throw new Error('Missing rkey parameter');
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
