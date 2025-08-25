import sitemap from "@inox-tools/sitemap-ext";
import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";
import swup from "@swup/astro";
import Compress from "astro-compress";
import icon from "astro-icon";
import { defineConfig } from "astro/config";
import umami from "@yeskunall/astro-umami";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeComponents from "rehype-components"; /* Render the custom directive content */
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive"; /* Handle directives */
import remarkGithubAdmonitionsToDirectives from "remark-github-admonitions-to-directives";
import remarkMath from "remark-math";
import remarkSectionize from "remark-sectionize";
import { AdmonitionComponent } from "./src/plugins/rehype-component-admonition.ts";
import { GithubCardComponent } from "./src/plugins/rehype-component-github-card.ts";
import { parseDirectiveNode } from "./src/plugins/remark-directive-rehype.ts";
import { remarkReadingTime } from "./src/plugins/remark-reading-time.mjs";
import { externalAnchorPlugin } from "./src/plugins/external-anchor.ts";
import { expressiveCodeConfig } from "./src/config.ts";
import { pluginLanguageBadge } from "./src/plugins/expressive-code/language-badge.ts";
import { pluginCustomCopyButton } from "./src/plugins/expressive-code/custom-copy-button.js";

import node from "@astrojs/node";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: "https://shad.moe/",
  base: "/",
  output: "server",
  trailingSlash: "ignore",
  prefetch: false,

  integrations: [
    tailwind({
      nesting: true,
      //applyBaseStyles: false,
    }),
    swup({
      theme: false,
      animationClass: 'transition-swup-',   // see https://swup.js.org/options/#animationselector
                                            // the default value `transition-` cause transition delay
                                            // when the Tailwind class `transition-all` is used
      containers: ['main', '#toc'],
      smoothScrolling: true,
      cache: true,
      preload: true,
      accessibility: true,
      updateHead: true,
      updateBodyClass: false,
      globalInstance: true,
    }),
    icon({
      include: {
        'material-symbols': ['*'],
        'fa6-brands': ['*'],
        'fa6-regular': ['*'],
        'fa6-solid': ['*'],
      },
    }),
    expressiveCode({
      themes: [expressiveCodeConfig.theme, expressiveCodeConfig.theme],
      plugins: [
        pluginCollapsibleSections(),
        pluginLineNumbers(),
        pluginLanguageBadge(),
        pluginCustomCopyButton(),
      ],
      defaultProps: {
        wrap: true,
        overridesByLang: {
          shellsession: {
            showLineNumbers: false,
          },
        },
      },
      frames: {
        showCopyToClipboardButton: false,
      },
    }),
    svelte(),
    sitemap({
      includeByDefault: true,
    }),
    umami({
      id: "492d838f-0aae-4aa8-8b73-c4ea0cd943bd",
      endpointUrl: "https://umami.shad.moe",
      hostUrl: "https://umami.shad.moe",
    }),
  ],
  markdown: {
    remarkPlugins: [
      remarkMath,
      remarkReadingTime,
      remarkGithubAdmonitionsToDirectives,
      remarkDirective,
      remarkSectionize,
      parseDirectiveNode,
      externalAnchorPlugin, // See https://tomoviktor.com/posts/astro-external-anchor/
    ],
    rehypePlugins: [
      rehypeKatex,
      rehypeSlug,
      [
        rehypeComponents,
        {
          components: {
            github: GithubCardComponent,
            note: (x, y) => AdmonitionComponent(x, y, "note"),
            tip: (x, y) => AdmonitionComponent(x, y, "tip"),
            important: (x, y) => AdmonitionComponent(x, y, "important"),
            caution: (x, y) => AdmonitionComponent(x, y, "caution"),
            warning: (x, y) => AdmonitionComponent(x, y, "warning"),
          },
        },
      ],
      [
        rehypeAutolinkHeadings,
        {
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
        },
      ],
    ],
  },
  vite: {
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          // temporarily suppress this warning
          if (
            warning.message.includes('is dynamically imported by') &&
            warning.message.includes('but also statically imported by')
          ) {
            return
          }
          warn(warning)
        },
      },
    },
    css: {
      preprocessorOptions: {
        stylus: {
          define: {
            oklchToHex: oklchToHex,
          },
        },
      },
    },
  },
  adapter: node({
    mode: "standalone",
  }),
});
