import { profileConfig } from "@/config";
import type { MarkdownPost, Profile } from "@/types/posts";
import { getProfile, safeFetch } from "@utils/content-utils";
import { parse } from "@utils/parser";
import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async (Astro) => {
  try {
    const profile: Profile = await getProfile(profileConfig.did, true);

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
        record &&
        (record.visibility === "public" || !record.visibility) // If no visibility field, assume public
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
        result: `Failed to get data: ${error}`,
      })
    );
  }
};
