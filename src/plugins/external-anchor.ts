import { visit } from 'unist-util-visit';
import type { Node } from 'unist'
import type { Root, Element } from 'hast'
import type { Plugin } from "unified";

const site = 'https://blog.shad.moe';
const draft_site = 'vercel.app';

const fixAnchors = (child: Node): void => {
    if (child.type !== 'element') {
        return
    }
    const elem = child as Element
    console.log(elem.tagName)
    if (elem.tagName === 'a') {
      console.log("a")
        // Ensure https
        const src = elem.properties.src
        if (/^(https?):\/\/[^\s/$.?#].[^\s]*$/i.test(elem.properties.href) && !elem.properties.href.includes(site) && !elem.properties.href.includes(draft_site)) {
          elem.properties.target = '_blank';
        }
    }
    elem.children.forEach(child => fixAnchors(child))
}