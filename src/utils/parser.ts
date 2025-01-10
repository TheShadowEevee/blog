import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeRaw from "rehype-raw";
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeComponents from 'rehype-components' /* Render the custom directive content */
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import remarkDirective from 'remark-directive' /* Handle directives */
import remarkGithubAdmonitionsToDirectives from 'remark-github-admonitions-to-directives'
import remarkMath from 'remark-math'
//import { AdmonitionComponent } from '@/plugins/rehype-component-admonition.mjs'
//import { GithubCardComponent } from '@/plugins/rehype-component-github-card.mjs'
import parseDirectiveNode from 'remark-directive-rehype'
//import remarkExcerpt from 'remark-excerpt'
import remarkReadingTime from 'remark-reading-time'
//import externalAnchorPlugin from '@/plugins/external-anchor.js'
import type { Schema } from '../../node_modules/rehype-sanitize/lib'
import { unified } from 'unified'
import type { Node } from 'unist'
import type { Root, Element } from 'hast'
import type { Plugin } from "unified";

export interface Ogp {
    url: string
    width?: number
    height?: number
    [k: string]: unknown
}

export interface Post {
    title: string,
    rkey: string,
    createdAt: Date,
    content: string // content parsed to html
    visibility: boolean
    ogp: Ogp
    extendedData?: PostExtended
    nextPost?: PostRef
    prevPost?: PostRef
}

export interface MarkdownPost {
    title: string,
    rkey: string,
    createdAt: Date,
    mdcontent: string // markdown content
    visibility: string
    ogp: Ogp
}

interface PostExtended {
    title?: string
    published?: string
    updated?: Date
    description?: string
    image?: string
    tags?: string[]
    category?: string
    lang?: string
}

interface PostRef {
    title?: string
    slug?: string
}

// WhiteWind's own custom schema:
// https://github.com/whtwnd/whitewind-blog/blob/7eb8d4623eea617fd562b93d66a0e235323a2f9a/frontend/src/services/DocProvider.tsx#L122
const customSchema = {
    ...defaultSchema,
    attributes: {
        ...defaultSchema.attributes,
        font: [...(defaultSchema.attributes?.font ?? []), 'color'],
        blockquote: [
            ...(defaultSchema.attributes?.blockquote ?? []),
            // bluesky
            'className',
            'dataBlueskyUri',
            'dataBlueskyCid',
            // instagram
            'dataInstgrmCaptioned',
            'dataInstgrmPermalink',
            'dataInstgrmVersion'
        ],
        iframe: [
            'width', 'height', 'title', 'frameborder', 'allow', 'referrerpolicy', 'allowfullscreen', 'style', 'seamless',
            ['src', /https:\/\/(www.youtube.com|bandcamp.com)\/.*/]
        ],
      section: ['dataFootnotes', 'className']
    },
    tagNames: [...(defaultSchema.tagNames ?? []), 'font', 'mark', 'iframe', 'section']
  }

// Automatically enforce https on PDS images. Heavily inspired by WhiteWind's blob replacer:
// https://github.com/whtwnd/whitewind-blog/blob/7eb8d4623eea617fd562b93d66a0e235323a2f9a/frontend/src/services/DocProvider.tsx#L90
// In theory we could also use their cache, but I'd like to rely on their API as little as possible, opting to pull from the PDS instead.
const upgradeImage = (child: Node): void => {
    if (child.type !== 'element') {
        return
    }
    const elem = child as Element
    if (elem.tagName === 'img') {
        // Ensure https
        const src = elem.properties.src
        if (src !== undefined && typeof src === 'string') {
            elem.properties.src = src.replace(/http\:\/\//, "https://")
        }
    }
    elem.children.forEach(child => upgradeImage(child))
}

const rehypeUpgradeImage: Plugin<any, Root, Node> = () => {
    return (tree) => {
      tree.children.forEach(child => upgradeImage(child))
    }
  }

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

export async function parse(mdposts: Map<string, MarkdownPost>) {
    let posts: Map<string, Post> = new Map()
    for (let [ rkey, post ] of mdposts) {
        posts.set(rkey, {
            title: post.title,
            rkey: post.rkey,
            createdAt: post.createdAt,
            content: String(
                await unified()
                    .use(remarkParse, { fragment: true }) // Parse the MD
                    .use(remarkGfm) // Parse GH specific MD
                    .use(remarkMath)
                    //.use(remarkReadingTime)
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
                          behavior: 'append',
                          properties: {
                            className: ['anchor'],
                          },
                          content: {
                            type: 'element',
                            tagName: 'span',
                            properties: {
                              className: ['anchor-icon'],
                              'data-pagefind-ignore': true,
                            },
                            children: [
                              {
                                type: 'text',
                                value: '#',
                              },
                            ],
                          },
                        })
                    .process(post.mdcontent)
            ),
            visibility: post.visibility != "author",
            ogp: post.ogp,
            extendedData: {
                published: undefined,
                updated: post.createdAt,
                description: undefined,
                image: undefined,
                tags: undefined,
                category: undefined,
                lang: "en"
            },
            nextPost: {
                title: undefined,
                slug: undefined
            },
            prevPost: {
                title: undefined,
                slug: undefined
            }
        })
    }
    return posts
}