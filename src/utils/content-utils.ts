import { profileConfig, public_handle } from "@/config";
import type { PostList, Profile } from "@/types/posts";

export async function getSortedPosts() {
  const response = await safeFetch(
    `${import.meta.env.NEXT_PUBLIC_URL}/api/posts/fetchAllPosts`
  );

  const postList = response.result;
  const posts: PostList[] = new Array();

  for (const rkey in postList) {
    posts.push({
      slug: rkey,
      body: postList[rkey].content,
      data: postList[rkey].extendedData ?? {},
      lastUpdate: postList[rkey].createdAt,
    });
  }

  posts.sort((a, b) => {
    const dateA = new Date(a.data?.published ?? 0).getTime();
    const dateB = new Date(b.data?.published ?? 0).getTime();
    return dateB - dateA;
  });

  for (let i = 1; i < posts.length; i++) {
    posts[i].data!.nextSlug = posts[i - 1].slug;
    posts[i].data!.nextTitle = posts[i - 1].data?.title ?? "";
  }
  for (let i = 0; i < posts.length - 1; i++) {
    posts[i].data!.prevSlug = posts[i + 1].slug;
    posts[i].data!.prevTitle = posts[i + 1].data?.title ?? "";
  }

  return posts;
}

export async function safeFetch(url: string) {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`${response.status}:${response.statusText}`);
  return await response.json();
}

export function parseExtendedValue(content: string) {
  if (content) {
    const values = content.match(
      new RegExp(
        "<!-- ### ADDITIONAL DATA FIELD ### " +
          "(.*)" +
          " ### solutions.konpeki.post.extendedData ### --->"
      )
    );

    if (values) {
      return JSON.parse(values[1].replaceAll("'", '"'));
    }
    return "";
  }
}

export function removeExtendedValue(content: string) {
  try {
    return content.replace(
      /<!-- ### ADDITIONAL DATA FIELD ### (.*) ### solutions.konpeki.post.extendedData ### --->/gm,
      ""
    );
  } catch {
    return content;
  }
}

export function checkUpdated(published: string, latest: Date) {
  if (published) {
    if (
      new Date(published).getDate().toString() +
        new Date(published).getFullYear().toString() !=
      latest.getDate().toString() + latest.getFullYear().toString()
    ) {
      return latest;
    }
    return undefined;
  }
}

export async function getProfile(did: string): Promise<Profile> {
  const fetchProfile = await safeFetch(
    `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${did}`
  );
  const split = did.split(":");
  let diddoc;
  if (split[0] === "did") {
    if (split[1] === "plc") {
      diddoc = await safeFetch(`https://plc.directory/${did}`);
    } else if (split[1] === "web") {
      diddoc = await safeFetch(`https://${split[2]}/.well-known/did.json`);
    } else {
      throw new Error("Invalid DID, Not blessed method");
    }
  } else {
    throw new Error("Invalid DID, malformed");
  }
  let pdsurl;
  for (const service of diddoc.service) {
    if (service.id === "#atproto_pds") {
      pdsurl = service.serviceEndpoint;
    }
  }
  if (!pdsurl) {
    throw new Error("DID lacks #atproto_pds service");
  }
  return {
    banner: fetchProfile.banner,
    description: fetchProfile.description,
    avatar: fetchProfile.avatar,
    displayName: fetchProfile.displayName,
    handle: fetchProfile.handle,
    url: `https://bsky.app/profile/${did}`,
    pds: pdsurl,
    did: did,
  };
}
