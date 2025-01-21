import type { Profile, MarkdownPost, Post } from "@/types/posts";
import {
  getProfile,
  safeFetch,
} from "@utils/content-utils";
import { parse } from "@utils/parser";
import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const rkey = params.rkey;

    if (rkey) {
      // https://stackoverflow.com/a/75664821
      const domain = request.url.match(
        /^(?<protocol>https?:\/\/)(?=(?<fqdn>[^:/]+))(?:(?<service>www|ww\d|cdn|ftp|mail|pop\d?|ns\d?|git)\.)?(?:(?<subdomain>[^:/]+)\.)*(?<domain>[^:/]+\.?[a-z0-9]+)(?::(?<port>\d+))?(?<path>\/[^?]*)?(?:\?(?<query>[^#]*))?(?:#(?<hash>.*))?/i
      );

      const cacheURL =
        (domain?.groups?.protocol ?? "") +
        (domain?.groups?.fqdn ?? "") +
        (domain?.groups?.port ? ":" + domain?.groups?.port : "") +
        "/api/cache/";

      // Check if rkey exists
      let response = await safeFetch(cacheURL + rkey);

      if (response.success == true) {
        return new Response(
          JSON.stringify({
            success: true,
            result: JSON.parse(response.result),
          })
        );
      } else {
        const profile: Profile = await getProfile();

        const response = await safeFetch(
          `${profile.pds}/xrpc/com.atproto.repo.getRecord?repo=${profile.did}&collection=com.whtwnd.blog.entry&rkey=${rkey}`
        );

        if (!response.error) {
          let mdposts: Map<string, MarkdownPost> = new Map();
          let post: Map<string, Post>;

          const matches = response["uri"].split("/");
          const rkey = matches[matches.length - 1];
          const record = response["value"];
          if (
            matches &&
            matches.length === 5 &&
            record &&
            (record["visibility"] === "public" || record["visibility"] === "url" || !record["visibility"])
          ) {
            mdposts.set(rkey, {
              title: record["title"],
              createdAt: new Date(record["createdAt"]),
              mdcontent: record["content"],
              rkey,
              visibility: record["visibility"],
              ogp: record["ogp"],
              data: "",
            });

            post = await parse(mdposts);

            if (record["visibility"] === "public") {
              const rkeyPost = await fetch(cacheURL + rkey, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "blogPost",
                  content: post.get(rkey),
                }),
              });
              
              const rkeyPostRes = await rkeyPost.json();

              if (!rkeyPostRes.success) {
                throw (
                  "Error caching the post: " + rkeyPostRes.result
                );
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
