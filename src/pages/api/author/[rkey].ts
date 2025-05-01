import type { Profile, MarkdownPost, Post } from "@/types/posts";
import { getProfile } from "@utils/content-utils";
import { parse } from "@utils/parser";
import type { APIRoute } from "astro";
import { GET as cacheGET, POST as cachePOST } from "../cache/[rkey]";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const rkey = params.rkey;
  try {
    if (rkey) {
      const authorProfile = await getProfile(rkey);
      return new Response(
        JSON.stringify({
          success: true,
          result: authorProfile,
        })
      );
    }
    throw "'item' is null or undefined";
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        result: `Failed to get data: ${error}`,
      })
    );
  }
};
