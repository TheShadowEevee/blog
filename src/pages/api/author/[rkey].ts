import { getProfile } from "@utils/content-utils";
import type { APIRoute } from "astro";

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
    return new Response(
      JSON.stringify({
        success: false,
        result: "No rkey provided.",
      })
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
