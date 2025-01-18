import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
//import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeRaw from "rehype-raw";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeComponents from "rehype-components"; /* Render the custom directive content */
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive"; /* Handle directives */
import remarkGithubAdmonitionsToDirectives from "remark-github-admonitions-to-directives";
import remarkMath from "remark-math";
import { AdmonitionComponent } from "@/plugins/rehype-component-admonition";
import { GithubCardComponent } from "@/plugins/rehype-component-github-card";
import remarkSectionize from "remark-sectionize";
import { parseDirectiveNode } from "@/plugins/remark-directive-rehype";
import remarkReadingTime from "remark-reading-time";
import remarkHeadings from "@vcarl/remark-headings";
//import type { Schema } from "../../node_modules/rehype-sanitize/lib";
import { unified } from "unified";
import type { Node } from "unist";
import type { Root, Element } from "hast";
import type { Plugin } from "unified";
import type { VFile } from "node_modules/rehype-raw/lib";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import {
  checkUpdated,
  parseExtendedValue,
} from "./content-utils";
import { externalAnchorPlugin } from "@/plugins/external-anchor";
import type { MarkdownPost, Post, ReadingTime, Headings } from "@/types/posts";

// Disabled as rehypeSanitize is disabled
// WhiteWind's own custom schema:
// https://github.com/whtwnd/whitewind-blog/blob/7eb8d4623eea617fd562b93d66a0e235323a2f9a/frontend/src/services/DocProvider.tsx#L122
// const customSchema = {
//   ...defaultSchema,
//   attributes: {
//     ...defaultSchema.attributes,
//     font: [...(defaultSchema.attributes?.font ?? []), "color"],
//     blockquote: [
//       ...(defaultSchema.attributes?.blockquote ?? []),
//       // bluesky
//       "className",
//       "dataBlueskyUri",
//       "dataBlueskyCid",
//       // instagram
//       "dataInstgrmCaptioned",
//       "dataInstgrmPermalink",
//       "dataInstgrmVersion",
//     ],
//     iframe: [
//       "width",
//       "height",
//       "title",
//       "frameborder",
//       "allow",
//       "referrerpolicy",
//       "allowfullscreen",
//       "style",
//       "seamless",
//       ["src", /https:\/\/(www.youtube.com|bandcamp.com)\/.*/],
//     ],
//     section: ["dataFootnotes", "className"],
//   },
//   tagNames: [
//     ...(defaultSchema.tagNames ?? []),
//     "font",
//     "mark",
//     "iframe",
//     "section",
//   ],
// };

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

export async function parse(mdposts: Map<string, MarkdownPost>) {
  let posts: Map<string, Post> = new Map();
  for (let [rkey, post] of mdposts) {
    posts.set(rkey, {
      title: post.title,
      rkey: post.rkey,
      createdAt: post.createdAt,
      content: await unified()
        .use(remarkParse, { fragment: true }) // Parse the MD
        .use(remarkGfm) // Parse GH specific MD
        .use(remarkMath)
        .use(remarkReadingTime, {}) // Empty second param to appease Typescript while leaving defaults
        .use(remarkGithubAdmonitionsToDirectives)
        .use(remarkDirective)
        .use(remarkHeadings)
        .use(remarkSectionize)
        .use(parseDirectiveNode)
        .use(externalAnchorPlugin) // See https://tomoviktor.com/posts/astro-external-anchor/
        .use(remarkRehype, { allowDangerousHtml: true }) // Convert to HTML
        //.use(rehypeSanitize, customSchema as Schema) // Sanitize the HTML || Honestly? This is good to have but causes some annoying issues. I trust the content I put out. I could update the Schema but that's a pain in itself.
        .use(rehypeRaw) // Parse HTML that exists as raw text leftover from MD parse
        .use(rehypeUpgradeImage)
        .use(rehypeStringify)
        .use(rehypeKatex)
        .use(rehypeSlug)
        .use(rehypeComponents, {
          components: {
            github: GithubCardComponent,
            note: (x, y) => AdmonitionComponent(x, y, "note"),
            tip: (x, y) => AdmonitionComponent(x, y, "tip"),
            important: (x, y) => AdmonitionComponent(x, y, "important"),
            caution: (x, y) => AdmonitionComponent(x, y, "caution"),
            warning: (x, y) => AdmonitionComponent(x, y, "warning"),
          },
        })
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
            },
            children: [
              {
                type: "text",
                value: "#",
              },
            ],
          },
        })
        .process(post.mdcontent),
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
        category:
          parseExtendedValue(post.mdcontent)?.category ??
          i18n(I18nKey.uncategorized),
        draft: post.visibility != "publicr",
        readingTime: {
          text: 0,
          minutes: 0,
          time: 0,
          words: 0,
        },
        headings: [],
        lang: "en",
        nextSlug: "",
        nextTitle: "",
        prevSlug: "",
        prevTitle: "",
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
    posts.set(rkey, {
      content: String(posts.get(rkey)?.content),
      extendedData: {
        title: posts.get(rkey)?.extendedData?.title,
        published: posts.get(rkey)?.extendedData?.published,
        updated: posts.get(rkey)?.extendedData?.updated,
        description: posts.get(rkey)?.extendedData?.description,
        image: posts.get(rkey)?.extendedData?.image,
        tags: posts.get(rkey)?.extendedData?.tags,
        category: posts.get(rkey)?.extendedData?.category,
        readingTime: (posts.get(rkey)?.content as VFile)?.data
          .readingTime as ReadingTime,
        headings: (posts.get(rkey)?.content as VFile)?.data
          .headings as Headings[],
        lang: posts.get(rkey)?.extendedData?.lang,
        draft: posts.get(rkey)?.extendedData?.draft,
        nextSlug: posts.get(rkey)?.extendedData?.nextSlug,
        nextTitle: posts.get(rkey)?.extendedData?.nextTitle,
        prevSlug: posts.get(rkey)?.extendedData?.prevSlug,
        prevTitle: posts.get(rkey)?.extendedData?.prevTitle,
      },
    });
  }
  return posts;
}
