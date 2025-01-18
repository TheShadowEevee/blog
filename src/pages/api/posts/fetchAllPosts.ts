import type { MarkdownPost, Post, Profile } from "@/types/posts";
import { getProfile, safeFetch } from "@utils/content-utils";
import { parse } from "@utils/parser";
import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async () => {
  try {

    let profile: Profile;
    let posts: Map<string, Post>;

    profile = await getProfile();

    const response = await safeFetch(
        `${profile.pds}/xrpc/com.atproto.repo.listRecords?repo=${profile.did}&collection=com.whtwnd.blog.entry`
    );

    let allPosts: Map<string, MarkdownPost> = new Map();
      for (let data of response["records"]) {
        const matches = data["uri"].split("/");
        const rkey = matches[matches.length - 1];
        const record = data["value"];
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
        posts = await parse(allPosts);
      }
      return new Response(
        JSON.stringify({
          success: true,
          // @ts-ignore : This is totally defined before use, if not womp womp
          result: Object.fromEntries(posts),
        }),
        {
          status: 200,
        })
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        result: "Failed to get data: " + error,
      })
    );
  }
};
