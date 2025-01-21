import { siteConfig } from "@/config";
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getSortedPosts, removeExtendedValue } from "@utils/content-utils";
import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";

const parser = new MarkdownIt();

export async function GET(context: APIContext) {
  const blog = await getSortedPosts();

  return rss({
    xmlns: {
      dc: "http://purl.org/dc/elements/1.1/",
      content: "http://purl.org/rss/1.0/modules/content/",
      atom: "http://www.w3.org/2005/Atom",
    },
    title: siteConfig.title,
    description: siteConfig.subtitle || "No description",
    site: context.site ?? "https://blog.shad.moe",
    items: blog.map((post) => {
      return {
        title: post.data?.title,
        pubDate: new Date(post.data?.published as string) ?? new Date(),
        description: post.data?.description || "",
        link: `/posts/${post.slug}/`,
        content: sanitizeHtml(parser.render(removeExtendedValue(post.body as string)), {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
        }),
      };
    }),
    customData:
      `<language>${siteConfig.lang}</language>` +
      `<lastBuildDate>${new Date(
        blog[0]?.data?.published as string
      ).toUTCString()}</lastBuildDate>` +
      `<atom:link href="${context.site}rss.xml" rel="self" type="application/rss+xml"/>` +
      `<pubDate>${new Date(
        blog[0]?.data?.published as string
      ).toUTCString()}</pubDate>`,
  });
}
