import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeComponents from "rehype-components"; /* Render the custom directive content */
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive"; /* Handle directives */
import remarkGithubAdmonitionsToDirectives from "remark-github-admonitions-to-directives";
import remarkMath from "remark-math";
import { AdmonitionComponent } from "../plugins/rehype-component-admonition";
import { GithubCardComponent } from "../plugins/rehype-component-github-card";
import remarkSectionize from "remark-sectionize";
import { parseDirectiveNode } from "../plugins/remark-directive-rehype";
import remarkReadingTime from "remark-reading-time";
import remarkHeadings from "@vcarl/remark-headings";
import { type Plugin, unified } from "unified";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { checkUpdated, parseExtendedValue } from "./content-utils";
import { externalAnchorPlugin } from "@/plugins/external-anchor";
import type { MarkdownPost, Post, ReadingTime, Headings } from "@/types/posts";
import type { VFile } from "vfile";
import remarkImageCaption from "@/plugins/remark-image-caption.ts";

export async function parse(mdposts: Map<string, MarkdownPost>) {
  const posts: Map<string, Post> = new Map();
  for (const [rkey, post] of mdposts) {
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
        .use(remarkImageCaption, { className: "image-caption" })
        .use(remarkHeadings)
        .use(remarkSectionize)
        .use(parseDirectiveNode)
        .use(externalAnchorPlugin) // See https://tomoviktor.com/posts/astro-external-anchor/
        .use(remarkRehype, { allowDangerousHtml: true }) // Convert to HTML
        .use(rehypeRaw) // Parse HTML that exists as raw text leftover from MD parse
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
      visibility: post.visibility !== "author",
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
        authors: parseExtendedValue(post.mdcontent)?.authors,
        category:
          parseExtendedValue(post.mdcontent)?.category ??
          i18n(I18nKey.uncategorized),
        draft: post.visibility !== "publicr",
        pinned: parseExtendedValue(post.mdcontent)?.pinned,
        readingTime: {
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
        authors: posts.get(rkey)?.extendedData?.authors,
        category: posts.get(rkey)?.extendedData?.category,
        readingTime: (posts.get(rkey)?.content as VFile)?.data
          .readingTime as ReadingTime,
        headings: (posts.get(rkey)?.content as VFile)?.data
          .headings as Headings[],
        lang: posts.get(rkey)?.extendedData?.lang,
        draft: posts.get(rkey)?.extendedData?.draft,
        pinned:
          (posts.get(rkey)?.extendedData?.pinned as unknown as string) ==
          "true",
        nextSlug: posts.get(rkey)?.extendedData?.nextSlug,
        nextTitle: posts.get(rkey)?.extendedData?.nextTitle,
        prevSlug: posts.get(rkey)?.extendedData?.prevSlug,
        prevTitle: posts.get(rkey)?.extendedData?.prevTitle,
      },
    });
  }
  return posts;
}
