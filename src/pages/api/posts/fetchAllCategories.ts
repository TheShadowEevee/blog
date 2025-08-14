import type { Post } from "@/types/posts";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import type { APIRoute } from "astro";
import { GET as getPosts } from "../posts/fetchAllPosts";

export const prerender = false;

export type Category = {
	name: string;
	count: number;
};

export const GET: APIRoute = async (Astro) => {
	try {
		const count: { [key: string]: number } = {};

		const initResponse = await getPosts(Astro);
		const response = await initResponse.json();

		let postList: Post[] = [];

		if (response.success === true) {
			postList = response.result;
		}

		for (const rkey in postList) {
			if (!postList[rkey].extendedData?.category) {
				const ucKey = i18n(I18nKey.uncategorized);
				count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
			} else {
				count[postList[rkey].extendedData?.category] = count[
					postList[rkey].extendedData?.category
				]
					? count[postList[rkey].extendedData?.category] + 1
					: 1;
			}
		}

		const lst = Object.keys(count).sort((a, b) => {
			return a.toLowerCase().localeCompare(b.toLowerCase());
		});

		const ret: Category[] = [];
		for (const c of lst) {
			ret.push({ name: c, count: count[c] });
		}

		return new Response(
			JSON.stringify({
				success: true,
				result: ret,
			}),
			{
				status: 200,
			},
		);
	} catch (error) {
		return new Response(
			JSON.stringify({
				success: false,
				result: [{ name: "Failed to get categories.", count: 0 }],
			}),
		);
	}
};
