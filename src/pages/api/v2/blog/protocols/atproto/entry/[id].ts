import type { MarkdownPost, Post, Profile } from '@/types/posts';
import { getProfile, safeFetch } from '@utils/content-utils';
import { parse } from '@utils/parser';
import type { APIRoute } from 'astro';
import { GET as cacheGET } from '../../../cache/blob';

export const prerender = false;

export const GET: APIRoute = async (Astro) => {
	try {
		const rkey = Astro.params.rkey;

		if (rkey) {
			// https://stackoverflow.com/a/75664821
			const domain = Astro.request.url.match(
				/^(?<protocol>https?:\/\/)(?=(?<fqdn>[^:/]+))(?:(?<service>www|ww\d|cdn|ftp|mail|pop\d?|ns\d?|git)\.)?(?:(?<subdomain>[^:/]+)\.)*(?<domain>[^:/]+\.?[a-z0-9]+)(?::(?<port>\d+))?(?<path>\/[^?]*)?(?:\?(?<query>[^#]*))?(?:#(?<hash>.*))?/i
			);

			const cacheURL = `${
				(domain?.groups?.protocol ?? '') +
				(domain?.groups?.fqdn ?? '') +
				(domain?.groups?.port ? `:${domain?.groups?.port}` : '')
			}/api/v2/blog/cache/blob?type=entry&id=${rkey}`;

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
					const mdposts: Map<string, MarkdownPost> = new Map();
					let post: Map<string, Post>;

					const matches = postResponse.uri.split('/');
					const rkey = matches[matches.length - 1];
					const record = postResponse.value;
					if (
						matches &&
						matches.length === 5 &&
						record &&
						(record.visibility === 'public' ||
							record.visibility === 'url' ||
							!record.visibility)
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

						post = await parse(mdposts);

						if (record.visibility === 'public') {
							// It would be nice to get rid of this, but "cachePOST" doesn't seem to work atm.
							const rkeyPost = await fetch(cacheURL, {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify(post.get(rkey)),
							});

							if (!rkeyPost.status == 200) {
								console.log(
									`Error caching the post. Check the logs on the API server for more information.`
								);
							}
						}

						return new Response(
							JSON.stringify({
								success: true,
								result: post.get(rkey),
							})
						);
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
