import type { MarkdownPost, Post, Profile } from "@/types/posts";
import { getAuthorProfile, safeFetch } from "@utils/content-utils";
import { parse } from "@utils/parser";
import type { APIRoute } from "astro";
import { GET as cacheGET, POST as cachePOST } from "../cache/[rkey]";

export const prerender = false;

export const GET: APIRoute = async (Astro) => {
  try {
    const rkey = Astro.params.rkey;

    if (rkey) {
      // https://stackoverflow.com/a/75664821
      const domain = Astro.request.url.match(
        /^(?<protocol>https?:\/\/)(?=(?<fqdn>[^:/]+))(?:(?<service>www|ww\d|cdn|ftp|mail|pop\d?|ns\d?|git)\.)?(?:(?<subdomain>[^:/]+)\.)*(?<domain>[^:/]+\.?[a-z0-9]+)(?::(?<port>\d+))?(?<path>\/[^?]*)?(?:\?(?<query>[^#]*))?(?:#(?<hash>.*))?/i
      );

      const cacheURL = `${
        (domain?.groups?.protocol ?? "") +
        (domain?.groups?.fqdn ?? "") +
        (domain?.groups?.port ? `:${domain?.groups?.port}` : "")
      }/api/cache/`;

      const initResponse = await cacheGET(Astro);
      const response = await initResponse.json();

      if (response.success === true) {
        return new Response(
          JSON.stringify({
            success: true,
            result: JSON.parse(response.result),
          })
        );
      }

      const profileResponse = await safeFetch(
        `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${rkey}`
      );

      if (!profileResponse.error) {
        const split = profileResponse.did.split(":");
        if (split[0] === "did") {
          if (split[1] === "plc") {
            const diddoc = await safeFetch(
              `https://plc.directory/${profileResponse.did}`
            );
            for (const service of diddoc.service) {
              if (service.id === "#atproto_pds") {
                return new Response(
                  JSON.stringify({
                    avatar: profileResponse.avatar,
                    banner: profileResponse.banner,
                    displayName: profileResponse.displayName,
                    did: profileResponse.did,
                    handle: profileResponse.handle,
                    description: profileResponse.description,
                    pds: service.serviceEndpoint,
                  })
                );
              }
            }
            throw new Error("DID lacks #atproto_pds service");
          } else if (split[1] === "web") {
            const diddoc = await safeFetch(
              `https://${split[2]}/.well-known/did.json`
            );
            for (const service of diddoc.service) {
              if (service.id === "#atproto_pds") {
                return new Response(
                  JSON.stringify({
                    avatar: profileResponse.avatar,
                    banner: profileResponse.banner,
                    displayName: profileResponse.displayName,
                    did: profileResponse.did,
                    handle: profileResponse.handle,
                    description: profileResponse.description,
                    pds: service.serviceEndpoint,
                  })
                );
              }
            }
            throw new Error("DID lacks #atproto_pds service");
          }
          throw new Error("Invalid DID, Not blessed method");
        }
        throw new Error("Invalid DID, malformed");
      }
    }
    throw new Error("Missing rkey parameter");
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
};
