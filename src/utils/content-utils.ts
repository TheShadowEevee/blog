import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import type { VFile } from "node_modules/rehype-raw/lib";
import { parse } from "./parser";
import { public_handle } from "@/config";

export interface Profile {
  avatar: string;
  banner: string;
  displayName: string;
  did: string;
  handle: string;
  description: string;
  pds: string;
}

export interface Ogp {
  url: string;
  width?: number;
  height?: number;
  [k: string]: unknown;
}

export interface Post {
  title?: string;
  rkey?: string;
  createdAt?: Date;
  content?: string | VFile; // content parsed to html
  visibility?: boolean;
  ogp?: Ogp;
  extendedData?: PostExtended;
  nextPost?: PostRef;
  prevPost?: PostRef;
  readingTime?: string;
}

export interface MarkdownPost {
  title: string;
  rkey: string;
  createdAt: Date;
  mdcontent: string; // markdown content
  visibility: string;
  ogp: Ogp;
  data: any;
}

export interface ReadingTime {
  text: number;
  minutes: number;
  time: number;
  words: number;
}

export interface Headings {
  depth: number;
  value: string;
}

export interface PostExtended {
  title?: string;
  published?: string;
  updated?: Date;
  description?: string;
  image?: string;
  tags?: string[];
  category?: string;
  lang?: string;
  readingTime?: ReadingTime;
  headings?: Headings[];
  nextSlug?: string;
  nextTitle?: string;
  prevSlug?: string;
  prevTitle?: string;
}

interface PostRef {
  title?: string;
  slug?: string;
}

export interface PostList {
  slug?: string;
  body?: string | VFile;
  data?: PostExtended;
  lastUpdate?: Date;
}

export async function getAllTags() {
  let postList = await getPosts();
  let tags: string[] = new Array();
  for (let [_, post] of postList) {
    for (let tag of post.extendedData?.tags ?? []) {
      tags.push(tag);
    }
  }
  return tags;
}

export async function getSortedPosts() {
  let postList = await getPosts();
  let posts: PostList[] = new Array();
  for (let [rkey, post] of postList) {
    posts.push({
      slug: rkey,
      body: post.content,
      data: post.extendedData ?? {},
      lastUpdate: post.createdAt,
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

export type Category = {
  name: string;
  count: number;
};

export async function getCategoryList(): Promise<Category[]> {
  const count: { [key: string]: number } = {};
  let postList = await getPosts();

  for (let [_, post] of postList) {
    if (!post.extendedData?.category) {
      const ucKey = i18n(I18nKey.uncategorized);
      count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
    } else {
      count[post.extendedData?.category] = count[post.extendedData?.category]
        ? count[post.extendedData?.category] + 1
        : 1;
    }
  }

  const lst = Object.keys(count).sort((a, b) => {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });

  const ret: Category[] = [];
  for (const c of lst) {
    ret.push({ name: c, count: count[c] });
  }
  return ret;
}

async function safeFetch(url: string) {
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
          " ### https://blog.shad.moe ### --->"
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

export async function getPosts() {
  let profile: Profile;
  let posts: Map<string, Post>;
  profile = await getProfile();
  const rawResponse = await fetch(
    `${profile.pds}/xrpc/com.atproto.repo.listRecords?repo=${profile.did}&collection=com.whtwnd.blog.entry`
  );
  const response = await rawResponse.json();
  let mdposts: Map<string, MarkdownPost> = new Map();
  for (let data of response["records"]) {
    const matches = data["uri"].split("/");
    const rkey = matches[matches.length - 1];
    const record = data["value"];
    if (
      matches &&
      matches.length === 5 &&
      record &&
      (record["visibility"] === "public" || !record["visibility"])
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
    }
    posts = await parse(mdposts);
  }
  // @ts-ignore : This is totally defined before use, if not womp womp
  return posts;
}

export function getPost(posts: Map<string, Post>, rkey: string) {
  let blogPost: Post | undefined;
  posts.forEach((post, postRkey) => {
    if (
      postRkey == rkey ||
      post.extendedData?.title
        ?.toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^a-zA-Z0-9\-]/g, "") == rkey
    ) {
      blogPost = posts.get(postRkey) as Post;
    }
  });
  return blogPost;
}
