import type { MarkdownPost, Post, Profile } from '@/types/posts';
import { getProfile, safeFetch } from '@utils/content-utils';
import { parse } from '@utils/parser';
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
	try {
		const profile: Profile = await getProfile();
		let response: any = {};

		const cacheLatestPostResponse = await fetch(
			`${import.meta.env.API_DOMAIN}/api/v2/blog/cache/blob?type=status&id=latestPost`
		);

		if (cacheLatestPostResponse.status == 200) {
			const latestPost = await cacheLatestPostResponse.json();

			let cacheKnownPostsResponse = JSON.parse(
				await (
					await fetch(
						`${import.meta.env.API_DOMAIN}/api/v2/blog/cache/blob?type=status&id=knownPosts`
					)
				).json()
			);

			let newPostsResponse = await safeFetch(
				`${profile.pds}/xrpc/com.atproto.repo.listRecords?repo=${profile.did}&collection=com.whtwnd.blog.entry&cursor=${latestPost.split('"')[1]}&reverse=true`
			);

			if (newPostsResponse.records.length != 0) {
				await fetch(
					`${import.meta.env.API_DOMAIN}/api/v2/blog/cache/blob?type=status&id=latestPost`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(newPostsResponse.records[0].uri.split('/')[4]),
					}
				);

				for (let i = newPostsResponse.records.length - 1; i >= 0; i--) {
					cacheKnownPostsResponse.records.unshift(newPostsResponse.records[i]);

					let post = await parsePost(newPostsResponse.records[i]);

					if (newPostsResponse.records[i].value.visibility === 'public') {
						const cachePost = await fetch(
							`${import.meta.env.API_DOMAIN}/api/v2/blog/cache/blob?type=entry&id=${newPostsResponse.records[i].uri.split('/')[4]}`,
							{
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify(
									post?.get(newPostsResponse.records[i].uri.split('/')[4])
								),
							}
						);

						if (!cachePost.status == 200) {
							console.log(
								`Error caching the post. Check the logs on the API server for more information.`
							);
						}
					}
				}

				await fetch(
					`${import.meta.env.API_DOMAIN}/api/v2/blog/cache/blob?type=status&id=knownPosts`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(cacheKnownPostsResponse),
					}
				);
			}

			response = cacheKnownPostsResponse;
		} else if (cacheLatestPostResponse.status == 404) {
			response = await safeFetch(
				`${profile.pds}/xrpc/com.atproto.repo.listRecords?repo=${profile.did}&collection=com.whtwnd.blog.entry`
			);
			await fetch(
				`${import.meta.env.API_DOMAIN}/api/v2/blog/cache/blob?type=status&id=knownPosts`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(response),
				}
			);
			await fetch(
				`${import.meta.env.API_DOMAIN}/api/v2/blog/cache/blob?type=status&id=latestPost`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(response.records[0].uri.split('/')[4]),
				}
			);
			for (let i in response.records) {
				let post = await parsePost(response.records[i]);

				if (response.records[i].value.visibility === 'public') {
					const cachePost = await fetch(
						`${import.meta.env.API_DOMAIN}/api/v2/blog/cache/blob?type=entry&id=${response.records[i].uri.split('/')[4]}`,
						{
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(post?.get(response.records[i].uri.split('/')[4])),
						}
					);

					if (!cachePost.status == 200) {
						console.log(
							`Error caching the post. Check the logs on the API server for more information.`
						);
					}
				}
			}
		} else {
			response = await safeFetch(
				`${profile.pds}/xrpc/com.atproto.repo.listRecords?repo=${profile.did}&collection=com.whtwnd.blog.entry`
			);
		}
		const allPosts: Map<string, MarkdownPost> = new Map();
		for (const data of response.records) {
			const matches = data.uri.split('/');
			const rkey = matches[matches.length - 1];
			const record = data.value;
			if (
				matches &&
				matches.length === 5 &&
				record &&
				(record.visibility === 'public' || !record.visibility) // If no visibility field, assume public
			) {
				allPosts.set(rkey, {
					title: record.title,
					createdAt: new Date(record.createdAt),
					mdcontent: record.content,
					rkey,
					visibility: record.visibility,
					ogp: record.ogp,
					data: '',
				});
			}
		}
		return new Response(
			JSON.stringify({
				success: true,
				// @ts-ignore : This is totally defined before use, if not womp womp
				result: Object.fromEntries(
					new Map(
						[...(await parse(allPosts)).entries()].sort(
							(a, b) =>
								new Date(b[1].extendedData?.published ?? 0).getTime() -
								new Date(a[1].extendedData?.published ?? 0).getTime()
						)
					)
				),
			}),
			{
				status: 200,
			}
		);
	} catch (error) {
		return new Response(
			JSON.stringify({
				success: false,
				result: `Failed to get data`,
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
