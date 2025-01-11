import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeRaw from "rehype-raw";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeComponents from "rehype-components"; /* Render the custom directive content */
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive"; /* Handle directives */
import remarkGithubAdmonitionsToDirectives from "remark-github-admonitions-to-directives";
import remarkMath from "remark-math";
//import { AdmonitionComponent } from '@/plugins/rehype-component-admonition.mjs'
//import { GithubCardComponent } from '@/plugins/rehype-component-github-card.mjs'
import parseDirectiveNode from "remark-directive-rehype";
//import remarkExcerpt from 'remark-excerpt'
import remarkReadingTime from "remark-reading-time";
//import externalAnchorPlugin from '@/plugins/external-anchor.js'
import type { Schema } from "../../node_modules/rehype-sanitize/lib";
import { unified } from "unified";
import type { Node } from "unist";
import type { Root, Element } from "hast";
import type { Plugin } from "unified";

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
  title: string;
  rkey: string;
  createdAt: Date;
  content: string; // content parsed to html
  visibility: boolean;
  ogp: Ogp;
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
}

interface PostExtended {
  title?: string;
  published?: string;
  updated?: Date;
  description?: string;
  image?: string;
  tags?: string[];
  category?: string;
  lang?: string;
  nextSlug?: string;
  nextTitle?: string;
  prevSlug?: string;
  prevTitle?: string;
}

interface PostRef {
  title?: string;
  slug?: string;
}

interface PostList {
    slug: string;
    body: string;
    data: PostExtended;
    lastUpdate: Date;
}

// WhiteWind's own custom schema:
// https://github.com/whtwnd/whitewind-blog/blob/7eb8d4623eea617fd562b93d66a0e235323a2f9a/frontend/src/services/DocProvider.tsx#L122
const customSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    font: [...(defaultSchema.attributes?.font ?? []), "color"],
    blockquote: [
      ...(defaultSchema.attributes?.blockquote ?? []),
      // bluesky
      "className",
      "dataBlueskyUri",
      "dataBlueskyCid",
      // instagram
      "dataInstgrmCaptioned",
      "dataInstgrmPermalink",
      "dataInstgrmVersion",
    ],
    iframe: [
      "width",
      "height",
      "title",
      "frameborder",
      "allow",
      "referrerpolicy",
      "allowfullscreen",
      "style",
      "seamless",
      ["src", /https:\/\/(www.youtube.com|bandcamp.com)\/.*/],
    ],
    section: ["dataFootnotes", "className"],
  },
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "font",
    "mark",
    "iframe",
    "section",
  ],
};

// Automatically enforce https on PDS images. Heavily inspired by WhiteWind's blob replacer:
// https://github.com/whtwnd/whitewind-blog/blob/7eb8d4623eea617fd562b93d66a0e235323a2f9a/frontend/src/services/DocProvider.tsx#L90
// In theory we could also use their cache, but I'd like to rely on their API as little as possible, opting to pull from the PDS instead.
const upgradeImage = (child: Node): void => {
  if (child.type !== "element") {
    return;
  }
  const elem = child as Element;
  if (elem.tagName === "img") {
    // Ensure https
    const src = elem.properties.src;
    if (src !== undefined && typeof src === "string") {
      elem.properties.src = src.replace(/http\:\/\//, "https://");
    }
  }
  elem.children.forEach((child) => upgradeImage(child));
};

const rehypeUpgradeImage: Plugin<any, Root, Node> = () => {
  return (tree) => {
    tree.children.forEach((child) => upgradeImage(child));
  };
};

//   const site = 'https://blog.shad.moe';
//   const draft_site = 'vercel.app';

//   const fixAnchors = (child: Node): void => {
//       if (child.type !== 'element') {
//           return
//       }
//       const elem = child as Element
//       console.log(elem.tagName)
//       if (elem.tagName === 'a') {
//         console.log(elem.properties.src)
//           const src = elem.properties.src
//           if (/^(https?):\/\/[^\s/$.?#].[^\s]*$/i.test(elem.properties.href) && !elem.properties.href.includes(site) && !elem.properties.href.includes(draft_site)) {
//             elem.properties.target = '_blank';
//           }
//       }
//       elem.children.forEach(child => fixAnchors(child))
//   }

//   const externalAnchorPlugin: Plugin<any, Root, Node> = () => {
//     return (tree) => {
//       tree.children.forEach(child => fixAnchors(child))
//     }
//   }

async function safeFetch(url: string) {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(response.status + ":" + response.statusText);
  return await response.json();
}

function parseExtendedValue(content: string) {
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

function checkUpdated(published: string, latest: Date) {
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
    `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=theshadoweevee.konpeki.solutions`
  );
  //const fetchProfile = await safeFetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${PUBLIC_HANDLE}`)
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
      });
    }
    posts = await parse(mdposts);
  }
  return posts
}

export function getPost(posts: Map<string, Post>, rkey: string) {
  let blogPost: Post | undefined = undefined;
  if (
    posts.has(rkey ?? "") ||
    posts.has(
      blogPost?.title
        ?.toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^a-zA-Z0-9]/g, "") ?? ""
    )
  ) {
    blogPost = posts.get(rkey ?? "") as Post;
  } else {
    for (let v of posts.values()) {
      if (
        v.title
          ?.toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^a-zA-Z0-9]/g, "") ==
        rkey
          ?.toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^a-zA-Z0-9]/g, "")
      ) {
        blogPost = posts.get(v.rkey) as Post;
        break;
      }
    }
  }
  return blogPost
}

export async function parse(mdposts: Map<string, MarkdownPost>) {
  let posts: Map<string, Post> = new Map();
  for (let [rkey, post] of mdposts) {
    posts.set(rkey, {
      title: post.title,
      rkey: post.rkey,
      createdAt: post.createdAt,
      content: String(
        await unified()
          .use(remarkParse, { fragment: true }) // Parse the MD
          .use(remarkGfm) // Parse GH specific MD
          .use(remarkMath)
          .use(remarkReadingTime)
          //.use(remarkExcerpt)
          .use(remarkGithubAdmonitionsToDirectives)
          .use(remarkDirective)
          .use(parseDirectiveNode)
          //.use(externalAnchorPlugin) // See https://tomoviktor.com/posts/astro-external-anchor/
          .use(remarkRehype, { allowDangerousHtml: true }) // Convert to HTML
          .use(rehypeRaw) // Parse HTML that exists as raw text leftover from MD parse
          .use(rehypeUpgradeImage)
          .use(rehypeSanitize, customSchema as Schema) // Sanitize the HTML
          .use(rehypeStringify) // Stringify
          .use(rehypeKatex)
          .use(rehypeSlug)
          //.use(rehypeComponents, {
          //    components: {
          //        github: GithubCardComponent,
          //        note: (x, y) => AdmonitionComponent(x, y, 'note'),
          //        tip: (x, y) => AdmonitionComponent(x, y, 'tip'),
          //        important: (x, y) => AdmonitionComponent(x, y, 'important'),
          //        caution: (x, y) => AdmonitionComponent(x, y, 'caution'),
          //        warning: (x, y) => AdmonitionComponent(x, y, 'warning'),
          //    },
          //})
          .use(rehypeAutolinkHeadings, {
            behavior: "append",
            properties: {
              className: ["anchor"],
            },
            content: {
              type: "element",
              tagName: "span",
              properties: {
                className: ["anchor-icon"],
                "data-pagefind-ignore": true,
              },
              children: [
                {
                  type: "text",
                  value: "#",
                },
              ],
            },
          })
          .process(post.mdcontent)
      ),
      visibility: post.visibility != "author",
      ogp: post.ogp,
      extendedData: {
          title: post.title,
          published: parseExtendedValue(post.mdcontent)?.published,
          updated: checkUpdated(
              parseExtendedValue(post.mdcontent)?.published,
              post.createdAt
          ),
          description: parseExtendedValue(post.mdcontent)?.description,
          image: parseExtendedValue(post.mdcontent)?.image,
          tags: parseExtendedValue(post.mdcontent)?.tags,
          category: parseExtendedValue(post.mdcontent)?.category,
          lang: "en",
          nextSlug: "",
          nextTitle: "",
          prevSlug: "",
          prevTitle: ""
      },
      nextPost: {
        title: undefined,
        slug: undefined,
      },
      prevPost: {
        title: undefined,
        slug: undefined,
      },
    });
  }
  return posts;
}

export function getAllTags(mdposts: Map<string, Post>) {
  //let tags: Map<string, string[]> = new Map();
  let tags: string[] = new Array()
  for (let [rkey, post] of mdposts) {
    for (let tag of post.extendedData?.tags ?? []) {
        tags.push(tag)
    }
  }
  return tags;
}

export async function getSortedPosts() {
    let postList = await getPosts()
    let posts: PostList[] = new Array()
    for (let [rkey, post] of postList) {
        posts.push({
            slug: rkey,
            body: post.content,
            data: post.extendedData ?? {},
            lastUpdate: post.createdAt
        })
    }
    
      const sorted = posts.sort(
        (a: { data: PostExtended }, b: { data: PostExtended }) => {
          const dateA = new Date(a.data.published ?? 0)
          const dateB = new Date(b.data.published ?? 0)
          return dateA > dateB ? -1 : 1
        },
      )
    
      for (let i = 1; i < sorted.length; i++) {
        sorted[i].data.nextSlug = sorted[i - 1].slug
        sorted[i].data.nextTitle = sorted[i - 1].data.title ?? ""
      }
      for (let i = 0; i < sorted.length - 1; i++) {
        sorted[i].data.prevSlug = sorted[i + 1].slug
        sorted[i].data.prevTitle = sorted[i + 1].data.title ?? ""
      }
    
      return sorted
}