import type { VFile } from "node_modules/rehype-raw/lib";
import type { MarkdownHeading } from "astro";

export interface Profile {
  avatar: string;
  banner: string;
  displayName: string;
  did: string;
  handle: string;
  description: string;
  pds: string;
  url: string;
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
  authors?: string[];
  category?: string;
  lang?: string;
  draft?: boolean;
  pinned?: boolean;
  readingTime?: ReadingTime;
  headings?: MarkdownHeading[];
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
