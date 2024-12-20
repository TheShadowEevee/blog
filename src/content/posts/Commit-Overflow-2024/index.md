---
title: "Commit Overflow 2024 Log - A Purdue Hackers Adventure"
published: 2024-12-18
--updated: 2024-12-18
description: "Purdue Hackers Commit Overflow 2024"
--image:
tags: [Purdue Hackers, ]
category: "Events"
draft: false
---

# Welcome to my Commit Overflow 2024 Log!
Commit Overflow is a [Purdue Hackers](https://purduehackers.com) event that is held yearly over the Winter Recess at Purdue University.

:::note[To Add]
This description to be extended later
:::

The format of this post will be a daily update log of my work, similar to what is being submitted to my Commit Overflow thread.

---

## December 18<sup>th</sup>
#### Day 1, Streak 1
While looking for inspiration to start Commit Overflow, I was going to take a look at my website. However, I was interrupted by a little icon on my GitHub homepage. Turns out, GitHub Copilot Free was announced a mere six hours before I began working.

This annoyed me, as I don't like Copilot much, so my project for the day became the creation of a Firefox Add-on that blocks certain Copilot related requests on `https://github.com` and `https://github.githubassets.com`, as well as removed some elements from the DOM related to Copilot.

See: [Github-Copilot-Blocker on Gitea](https://git.shad.moe/Konpeki-Solutions/Github-Copilot-Blocker)

#### Before
![Before Image](./GhCopi-Before.png)

#### After
![After Image](./GhCopi-After.png)

---

## December 19<sup>th</sup>
#### Day 2, Streak 2
##### Mini Commit
Picking up from the previous day, Github Copilot Blocker received Chromium browser support. This was basically plug-and-play as the code is quite simple to begin with. All that needed to be done was packaging a .crx and updating the Readme.

See: [Commit Comparison](https://git.shad.moe/Konpeki-Solutions/Github-Copilot-Blocker/compare/fec2e87b09..9d16ac8294)

##### Main Commit
My personal website [shad.moe](https://www.shad.moe) has been in disrepair for awhile now, to the point of the entire site being a 404 for much of my recent memory.

Today marks the fourth revival attempt in "[Website But Again The Sequel To The Trilogy](https://git.shad.moe/TheShadowEevee/WebsiteButAgainTheSequelToTheTrilogy)". Today's commit is the creation of a base layout in Astro with Shad/CN. A sidebar with filler information and a site theme was setup and repository was initialized. Vercel was used to stand the site up on my domain.

See: [Commit](https://git.shad.moe/TheShadowEevee/WebsiteButAgainTheSequelToTheTrilogy/commit/6e4955b6a46bbab1e9ea6aa86f197379ecd58e56)
