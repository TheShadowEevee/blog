import { public_handle } from "@/config";
import type { PostList } from "@/types/posts";

export async function getSortedPosts() {
  const response = await safeFetch(`${import.meta.env.NEXT_PUBLIC_URL}/api/posts/fetchAllPosts`);

  let postList = response.result;
  let posts: PostList[] = new Array();

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
    throw new Error(response.status + ":" + response.statusText);
  return await response.json();
}

export function parseExtendedValue(content: string) {
  if (content) {
    let values = content.match(
      new RegExp(
        "<!-- ### ADDITIONAL DATA FIELD ### " +
          "(.*)" +
          " ### solutions.konpeki.post.extendedData ### --->"
      )
    );

    if (values) {
      return JSON.parse(values[1].replaceAll("'", '"'));
    } else {
      return "";
    }
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
    } else {
      return undefined;
    }
  }
}

export async function getProfile(): Promise<Profile> {
  const fetchProfile = await safeFetch(
    `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${public_handle}`
  );
  let split = fetchProfile["did"].split(":");
  let diddoc;
  if (split[0] === "did") {
    if (split[1] === "plc") {
      diddoc = await safeFetch(`https://plc.directory/${fetchProfile["did"]}`);
    } else if (split[1] === "web") {
      diddoc = await safeFetch("https://" + split[2] + "/.well-known/did.json");
    } else {
      throw new Error("Invalid DID, Not blessed method");
    }
  } else {
    throw new Error("Invalid DID, malformed");
  }
  let pdsurl;
  for (let service of diddoc["service"]) {
    if (service["id"] === "#atproto_pds") {
      pdsurl = service["serviceEndpoint"];
    }
  }
  if (!pdsurl) {
    throw new Error("DID lacks #atproto_pds service");
  }
  return {
    avatar: fetchProfile["avatar"],
    banner: fetchProfile["banner"],
    displayName: fetchProfile["displayName"],
    did: fetchProfile["did"],
    handle: fetchProfile["handle"],
    description: fetchProfile["description"],
    pds: pdsurl,
  };
}
