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
    // First sort by pinned status (pinned posts come first)
    if (a.data?.pinned && !b.data?.pinned) return -1;
    if (!a.data?.pinned && b.data?.pinned) return 1;

    // Then sort by date (newest first) for posts with the same pinned status
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
  let pdsurl = null;

  let fetchProfile = await safeFetch(
    `${import.meta.env.NEXT_PUBLIC_URL}/api/cache/author-${did}`
  );

  if (fetchProfile.success) {
    fetchProfile = JSON.parse(fetchProfile.result);
  } else {
    fetchProfile = await safeFetch(
      `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${did}`
    );

    const rkeyPost = await fetch(
      `${import.meta.env.NEXT_PUBLIC_URL}/api/cache/author-${did}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "authorProfile",
          content: fetchProfile,
        }),
      }
    );

    const rkeyPostRes = await rkeyPost.json();

    if (!rkeyPostRes.success) {
      throw `Error caching the post: ${rkeyPostRes.result}`;
    }
  }

  let fetchPDS = await safeFetch(
    `${import.meta.env.NEXT_PUBLIC_URL}/api/cache/authorPDS-${did}`
  );

  if (fetchPDS.success) {
    pdsurl = JSON.parse(fetchPDS.result);
  } else {
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
    for (const service of diddoc.service) {
      if (service.id === "#atproto_pds") {
        pdsurl = service.serviceEndpoint;
      }
    }
    if (!pdsurl) {
      throw new Error("DID lacks #atproto_pds service");
    }
    const pdsPost = await fetch(
      `${import.meta.env.NEXT_PUBLIC_URL}/api/cache/authorPDS-${did}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "authorPDS",
          content: pdsurl,
        }),
      }
    );

    const pdsPostRes = await pdsPost.json();

    if (!pdsPostRes.success) {
      throw `Error caching the post: ${pdsPostRes.result}`;
    }
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
