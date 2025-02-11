import type { Post } from "@/types/posts";
import { safeFetch } from "@utils/content-utils";
import type { APIRoute } from "astro";

export const prerender = false;

export type Category = {
  name: string;
  count: number;
};

export const GET: APIRoute = async () => {
  try {
    const response = await safeFetch(
      `${import.meta.env.NEXT_PUBLIC_URL}/api/posts/fetchAllPosts`,
    );

    let postList: Post[] = [];

    if (response.success == true) {
      postList = response.result;
    }
    let tags: string[] = new Array();

    for (const rkey in postList) {
      for (let tag of postList[rkey].extendedData?.tags ?? []) {
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
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        result: "Failed to get data: " + error,
      }),
    );
  }
};
