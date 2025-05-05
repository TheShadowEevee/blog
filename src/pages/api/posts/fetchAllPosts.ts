import { profileConfig } from "@/config";
import type { MarkdownPost, Profile } from "@/types/posts";
import { getProfile, safeFetch } from "@utils/content-utils";
import { parse } from "@utils/parser";
import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async (Astro) => {
  try {
    const profile: Profile = await getProfile(profileConfig.did);

    const response = await safeFetch(
      `${profile.pds}/xrpc/com.atproto.repo.listRecords?repo=${profile.did}&collection=com.whtwnd.blog.entry`
    );

    const allPosts: Map<string, MarkdownPost> = new Map();
    for (const data of response.records) {
      const matches = data.uri.split("/");
      const rkey = matches[matches.length - 1];
      const record = data.value;
      if (
        matches &&
        matches.length === 5 &&
        record // If no visibility field, assume public
      ) {
        allPosts.set(rkey, {
          title: record.title,
          createdAt: new Date(record.createdAt),
          mdcontent: record.content,
          rkey,
          visibility: record.visibility,
          ogp: record.ogp,
          data: "",
        });
      }
    }

    let posts = [...(await parse(allPosts)).entries()].sort((a, b) => {
      // First sort by pinned status (pinned posts come first)
      if (a[1].extendedData?.pinned && !b[1].extendedData?.pinned) return -1;
      if (!a[1].extendedData?.pinned && b[1].extendedData?.pinned) return 1;

      // Then sort by date (newest first) for posts with the same pinned status
      const dateA = new Date(a[1].extendedData?.published ?? 0).getTime();
      const dateB = new Date(b[1].extendedData?.published ?? 0).getTime();
      return dateB - dateA;
    });

    return new Response(
      JSON.stringify({
        success: true,
        // @ts-ignore : This is totally defined before use, if not womp womp
        result: Object.fromEntries(posts),
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
