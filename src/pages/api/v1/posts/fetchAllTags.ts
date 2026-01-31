import type { Post } from '@/types/posts';
import type { APIRoute } from 'astro';
import { GET as getPosts } from '../posts/fetchAllPosts';

export const prerender = false;

export type Category = {
	name: string;
	count: number;
};

export const GET: APIRoute = async (Astro) => {
	try {
		const initResponse = await getPosts(Astro);
		const response = await initResponse.json();

		let postList: Post[] = [];

		if (response.success === true) {
			postList = response.result;
		}
		const tags: string[] = new Array();

		for (const rkey in postList) {
			for (const tag of postList[rkey].extendedData?.tags ?? []) {
				tags.push(tag);
			}
		}

		return new Response(
			JSON.stringify({
				success: true,
				result: tags,
			}),
			{
				status: 200,
			}
		);
	} catch (error) {
		return new Response(
			JSON.stringify({
				success: false,
				result: `Failed to get data: ${error}`,
			})
		);
	}
};
