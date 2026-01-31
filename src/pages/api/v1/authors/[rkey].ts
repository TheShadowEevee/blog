import { safeFetch } from '@utils/content-utils';
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (Astro) => {
	try {
		const rkey = Astro.params.rkey;

		if (rkey) {
			const profileResponse = await safeFetch(
				`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${rkey}`
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
								return new Response(
									JSON.stringify({
										avatar: profileResponse.avatar,
										banner: profileResponse.banner,
										displayName: profileResponse.displayName,
										did: profileResponse.did,
										handle: profileResponse.handle,
										description: profileResponse.description,
										pds: service.serviceEndpoint,
										url: `https://bsky.app/profile/${profileResponse.did}`,
									})
								);
							}
						}
						throw new Error('DID lacks #atproto_pds service');
					} else if (split[1] === 'web') {
						const diddoc = await safeFetch(`https://${split[2]}/.well-known/did.json`);
						for (const service of diddoc.service) {
							if (service.id === '#atproto_pds') {
								return new Response(
									JSON.stringify({
										avatar: profileResponse.avatar,
										banner: profileResponse.banner,
										displayName: profileResponse.displayName,
										did: profileResponse.did,
										handle: profileResponse.handle,
										description: profileResponse.description,
										pds: service.serviceEndpoint,
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
