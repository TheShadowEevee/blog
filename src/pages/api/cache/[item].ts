import type { APIRoute } from "astro";
import { Redis } from "@upstash/redis";

export const prerender = false;

// Initialize Redis
const redis: Redis = new Redis({
  url: import.meta.env.KV_REST_API_URL!,
  token: import.meta.env.KV_REST_API_TOKEN!,
});

export const GET: APIRoute = async ({ params }) => {
  try {
    const item = params.item;

    if (item) {
      const result = await redis.get(item);

      if (!result) {
        return new Response(
          JSON.stringify({
            success: false,
            result: "Item '" + item + "' does not exist",
          })
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          result: result,
        }),
        { status: 200 }
      );
    } else {
      throw "'item' is null or undefined";
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        result: "Failed to get data: " + error,
      })
    );
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const key = params.item;

    if (request.headers.get("Content-Type") === "application/json" && key) {
      const body = await request.json();
      const type = body.type;
      const content = body.content;

      if (type === "blogPost") {
        const result = await redis.set(key, content, {ex: +import.meta.env.POST_CACHE_SECONDS});

        return new Response(
          JSON.stringify({
            success: true,
            message: result,
          }),
          {
            status: 200,
          }
        );
      }
    }
    return new Response(null, { status: 400 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        result: "Failed to post data: " + error,
      }),
      { status: 400 }
    );
  }
};
