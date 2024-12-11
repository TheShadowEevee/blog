import { siteConfig } from '@/config'
import rss from '@astrojs/rss'
import type { APIContext } from 'astro';
import { getSortedPosts } from '@utils/content-utils'
import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'

const parser = new MarkdownIt()

export async function GET(context: APIContext) {
  const blog = await getSortedPosts()

  return rss({
    xmlns: {
      dc: 'http://purl.org/dc/elements/1.1/',
      content: 'http://purl.org/rss/1.0/modules/content/',
      atom: 'http://www.w3.org/2005/Atom',
    },
    title: siteConfig.title,
    description: siteConfig.subtitle || 'No description',
    site: context.site ?? 'https://blog.shad.moe',
    items: blog.map(post => {
      return {
        title: post.data.title,
        pubDate: post.data.published,
        description: post.data.description || '',
        link: `/posts/${post.slug}/`,
        content: sanitizeHtml(parser.render(post.body), {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        }),
      }
    }),
    customData:
      `<language>${siteConfig.lang}</language>` +
      `<lastBuildDate>${blog[0]?.data.published.toUTCString()}</lastBuildDate>` +
      `<atom:link href="${context.site}rss.xml" rel="self" type="application/rss+xml"/>` +
      `<pubDate>${blog[0]?.data.published.toUTCString()}</pubDate>`,
  })
}
