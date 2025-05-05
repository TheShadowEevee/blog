import type { Profile, MarkdownPost, Post } from "@/types/posts";
import { getProfile, safeFetch } from "@utils/content-utils";
import { parse } from "@utils/parser";
import type { APIRoute } from "astro";
import { profileConfig } from "@/config";

export const prerender = false;

export const GET: APIRoute = async (Astro) => {
  const rkey = Astro.params.rkey;

  if (rkey) {
    let fetchPost = await safeFetch(
      `${import.meta.env.NEXT_PUBLIC_URL}/api/cache/post-${rkey}`
    );

    if (fetchPost.success) {
      return new Response(
        JSON.stringify({
          success: true,
          result: JSON.parse(fetchPost.result),
        })
      );
    } else {
      const profile: Profile = await getProfile(profileConfig.did);

      const postResponse = await safeFetch(
        `${profile.pds}/xrpc/com.atproto.repo.getRecord?repo=${profile.did}&collection=com.whtwnd.blog.entry&rkey=${rkey}`
      );

      if (!postResponse.error) {
        const mdposts: Map<string, MarkdownPost> = new Map();
        let post: Map<string, Post>;

        const matches = postResponse.uri.split("/");
        const rkey = matches[matches.length - 1];
        const record = postResponse.value;
        if (
          matches &&
          matches.length === 5 &&
          record &&
          (record.visibility === "public" ||
            record.visibility === "url" ||
            !record.visibility)
        ) {
          mdposts.set(rkey, {
            title: record.title,
            createdAt: new Date(record.createdAt),
            mdcontent: record.content,
            rkey,
            visibility: record.visibility,
            ogp: record.ogp,
            data: "",
          });

          post = await parse(mdposts);

          if (record.visibility === "public") {
            const rkeyPost = await fetch(
              `${import.meta.env.NEXT_PUBLIC_URL}/api/cache/post-${rkey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "blogPost",
                  content: post.get(rkey),
                }),
              }
            );

            const rkeyPostRes = await rkeyPost.json();

            if (!rkeyPostRes.success) {
              throw `Error caching the post: ${rkeyPostRes.result}`;
            }
          }

          return new Response(
            JSON.stringify({
              success: true,
              result: post.get(rkey),
            })
          );
        }
      }
      return new Response(
        JSON.stringify({
          success: false,
          result: "Unknown Error Fetching Post",
        }),
        { status: 400 }
      );
    }
    throw "'item' is null or undefined";
  }
};
