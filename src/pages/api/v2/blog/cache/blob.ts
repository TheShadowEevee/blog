import type { APIRoute } from 'astro';
import Redis from 'ioredis';

export const prerender = false;

const redis = new Redis({
	host: import.meta.env.REDIS_IP, // Local Redis server IP
	port: import.meta.env.REDIS_PORT, // Local Redis server port
	password: import.meta.env.REDIS_PASSWORD, // Optional, if your Redis instance requires authentication
	maxRetriesPerRequest: 1,
});

redis.on('error', (err) => {
	console.error('Redis error:', err.message);
	redis.disconnect();
});

export const GET: APIRoute = async ({ url }) => {
	try {
		const blobId = url.searchParams.get('id');
		const blobType = url.searchParams.get('type');

		const result = await redis.get(`moe.shad.api:blog:${blobType}:${blobId}`);

		if (!result) {
			return new Response(
				`Resource '${blobId}' with type '${blobType}' does not exist in the cache.`,
				{ status: 404 }
			);
		} else {
			return new Response(JSON.stringify(result), { status: 200 });
		}
	} catch (error) {
		console.log(error);
		return new Response(
			'An error occurred while processing your query. Please try again later.',
			{ status: 500 }
		);
	}
};

export const POST: APIRoute = async ({ request, url }) => {
	try {
		const blobId = url.searchParams.get('id');
		const blobType = url.searchParams.get('type');

		if (request.headers.get('Content-Type') === 'application/json' && blobId && blobType) {
			const body = await request.json();

			const result = await redis.set(
				`moe.shad.api:blog:${blobType}:${blobId}`,
				JSON.stringify(body),
				'EX',
				import.meta.env.POST_CACHE_SECONDS
			);

			if (result == 'OK') {
				return new Response(
					`Data has been successfully cached for ${import.meta.env.POST_CACHE_SECONDS} seconds.`,
					{
						status: 200,
					}
				);
			} else {
				console.log(`Redis returned unexpected status ${result}`);
				return new Response(
					'An error occurred while processing your query. Please try again later.',
					{ status: 500 }
				);
			}
		} else if (blobId && blobType) {
			return new Response("The parameters 'type' and 'id' must be provided.", {
				status: 400,
			});
		} else if (request.headers.get('Content-Type') === 'application/json') {
			return new Response("Content-Type must be 'application/json'", { status: 400 });
		} else {
			return new Response(null, { status: 400 });
		}
	} catch (error) {
		console.log(error);
		return new Response(
			'An error occurred while processing your query. Please try again later.',
			{ status: 500 }
		);
	}
};
