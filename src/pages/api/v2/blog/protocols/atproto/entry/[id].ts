import type { MarkdownPost, Post, Profile } from '@/types/posts';
import { getProfile, safeFetch } from '@utils/content-utils';
import { parse } from '@utils/parser';
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (Astro) => {
	try {
		const rkey = Astro.params.rkey;

		if (rkey) {
			const cacheURL = `${import.meta.env.API_DOMAIN}/api/v2/blog/cache/blob?type=entry&id=${rkey}`;

			const cacheResponse = await fetch(cacheURL);

			if (cacheResponse.status == 200) {
				const response = await cacheResponse.json();

				return new Response(response);
			} else {
				const profile: Profile = await getProfile();

				const postResponse = await safeFetch(
					`${profile.pds}/xrpc/com.atproto.repo.getRecord?repo=${profile.did}&collection=com.whtwnd.blog.entry&rkey=${rkey}`
				);

				if (!postResponse.error) {
					let post = await parsePost(postResponse);

					if (postResponse.value.visibility === 'public') {
						const rkeyPost = await fetch(cacheURL, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(post?.get(rkey)),
						});

						if (!rkeyPost.status == 200) {
							console.log(
								`Error caching the post. Check the logs on the API server for more information.`
							);
						}
					}

					return new Response(JSON.stringify(post?.get(rkey)));
				}
			}
			return new Response(
				JSON.stringify({
					success: false,
					result: 'Unknown Error Fetching Post',
				}),
				{ status: 400 }
			);
		}

		throw "Entries 'id' is null or undefined";
	} catch (error) {
		return new Response(
			JSON.stringify({
				success: false,
				result: `Failed to get data: ${error}`,
			})
		);
	}
};

async function parsePost(postResponse: any) {
	const mdposts: Map<string, MarkdownPost> = new Map();

	const matches = postResponse.uri.split('/');
	const rkey = matches[matches.length - 1];
	const record = postResponse.value;
	if (
		matches &&
		matches.length === 5 &&
		record &&
		(record.visibility === 'public' || record.visibility === 'url' || !record.visibility)
	) {
		mdposts.set(rkey, {
			title: record.title,
			createdAt: new Date(record.createdAt),
			mdcontent: record.content,
			rkey,
			visibility: record.visibility,
			ogp: record.ogp,
			data: '',
		});

		return await parse(mdposts);
	}
}
