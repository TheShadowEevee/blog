// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
import { toString } from "mdast-util-to-string";
import getReadingTime from "reading-time";

export function remarkReadingTime() {
<<<<<<< HEAD
  return (tree, { data }) => {
    const textOnPage = toString(tree);
    const readingTime = getReadingTime(textOnPage);
    data.astro.frontmatter.minutes = Math.max(
      1,
      Math.round(readingTime.minutes),
    );
    data.astro.frontmatter.words = readingTime.words;
  };
=======
	return (tree, { data }) => {
		const textOnPage = toString(tree);
		const readingTime = getReadingTime(textOnPage);
		data.astro.frontmatter.minutes = Math.max(
			1,
			Math.round(readingTime.minutes),
		);
		data.astro.frontmatter.words = readingTime.words;
	};
>>>>>>> template/main
}
