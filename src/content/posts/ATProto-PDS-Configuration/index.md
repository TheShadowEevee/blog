---
title: "Notes for Self-Hosting an ATProto PDS"
published: 2024-12-11
description: "Self-Hosting ATProto PDS Notes"
--image:
tags: [ATProto, Bluesky, Homelab]
category: "ATProto"
draft: false
---

Recently I've started using [Bluesky](https://bsky.social/about), a decentralized social media platform built on the [AT Protocol](https://atproto.com). When I was first looking into Bluesky, something that attracted my interest was the ability to host your own Personal Data Server, or PDS. To quote the AT Protocol Glossary:
> <H3>PDS (Personal Data Server)</H3>
>
>A PDS, or Personal Data Server, is a server that hosts a user. A PDS will always store the user's data repo and signing keys. It may also assign the user a handle and a DID. Many PDSes will host multiple users.
>
>A PDS communicates with AppViews to run applications. A PDS doesn't typically run any applications itself, though it will have general account management interfaces such as the OAuth login screen. PDSes actively sync their data repos with Relays.

All of that boils down to "This is where your user account and associated information is stored". I personally host a private PDS at [konpeki.solutions](https://konpeki.solutions) - my Bluesky handle is `@theshadoweevee.konpeki.solutions`. This is entirely local! Any time someone access my profile or a post, a request is sent to the domain `https://theshadoweevee.konpeki.solutions`.

A lot more goes into this that I haven't touched on (like the [Firehose](https://docs.bsky.app/docs/advanced-guides/firehose)) but I'll stop here for now. It's time to complain a bit.

The AT Protocol has, in my opinion, great documentation on how the protocol works. It's worth browsing through the documentation if you're curious. Where it falls flat, however, is documenting any non-default configuration of the PDS.

## Configuring Email
Configuring an Outgoing SMTP Server is necessary for Email Verification and Password Resets (both nice to haves). There *is* documentation for this now, but at the time I set up my PDS server, it was restricted to a [Pull Request](https://github.com/bluesky-social/pds/pull/86) and even then, the current documentation doesn't really clarify what an SMTP URL is very well.

The trick to this is configuring an environment variable. My environment variable file is located at `/pds/pds.env`, yours will likely be in a similar spot. You'll append the following to the end of your environment variables:
```
PDS_EMAIL_SMTP_URL=smtps://<Username>:<API Key / Password>@smtp.example.com:465/
PDS_EMAIL_FROM_ADDRESS=<Username>@example.com
```
In some configurations for the url, such as mine, the username must be accompanied by the domain. In this case, replace the username with `<Username>%40example.com` where example.com is your domain name.

After configuring, restart your PDS server. If you used the `install.sh` / Official PDS installation method, you can run `systemctl restart pds`.

## Configuring Reverse Proxies
Here's a much more annoying task: Configuring a reverse proxy. The PDS Server runs it's own Caddy instance, but there are many reasons you may want a reverse proxy in front of that. My main reason was that the PDS server should be accessible over [Tailscale](https://tailscale.com) to my Nginx server, which then serves to the world.

On top of this, I wanted to use my username + domain root and not a subdomain (No `theshadoweevee.pds.konpeki.solutions`!). However, this raises the issue of `konpeki.solutions` being the home of my PDS while I still wanted to host content on the domain. I did some... *funky* workarounds to get this working.

Each of the following assumes I've already created an account on my PDS with the username `theshadoweevee.konpeki.solutions` using `pdsadmin account create` and that I know it's DID, `did:plc:krbzbucjaj76xjob6ju47ilo`, from `pdsadmin account list`.

### Setup A/AAAA records for your handle
Your handle *must* be a domain you have control over in some fashion. For all intents, your handle is also a domain. A DNS A/AAAA record needs to be configured for `theshadoweevee.@` which will point to a server you control (where your reverse proxy is hosted, in this case). Ensure the server being pointed to has a valid SSL certificate for your handle, or a wildcard for the domain.

### Verifying your handle via DNS
If you have access to your DNS records, this is the easiest method to verify a handle and requires no setup on the PDS Server or reverse proxy. Head to your domain's DNS records, and create a new TXT record with the following, substituting the Username and DID:
```
Name: _atproto.theshadoweevee
Content: "did=did:plc:krbzbucjaj76xjob6ju47ilo"
```
Note the quotation marks around the content, this is a requirement in TXT records. Wait for your DNS records to propagate, then check your handle with the [Bluesky Debug Page](https://bsky-debug.app/handle).

### Verifying your handle via HTTP
If DNS isn't an option, or if you want to have both verification methods setup, then you can also verify your handle using a file. This file should be at `https://theshadoweevee.konpeki.solutions/.well-known/atproto-did`, where your handle is the domain name. Inside `atproto-did`, the contents should simply be your DID without quotes, such as `did:plc:krbzbucjaj76xjob6ju47ilo`.

### Proxying actual content: Handle
At this point, you aren't actually proxying any data from your PDS. To proxy a handle domain, you only need to proxy one path (that I'm currently aware of). Proxying `/xrpc` to your PDS server will pass through any HTTP API requests made to your handle domain. It is *important* that you correctly proxy websocket requests.

A nice to have you can implement on a handle-only domain is redirecting to your Bluesky profile. You can do this by redirecting or rewriting `/` to `https://bsky.app/profile/did:plc:krbzbucjaj76xjob6ju47ilo`, replacing the DID with your own username or DID (both work, however the DID survives handle changes in the future).

Example Nginx Configuration can be seen [on my Gitea instance](https://git.shad.moe/Konpeki-Solutions/Nginx-Configurations/src/branch/main/http.d/theshadoweevee.konpeki.solutions).

### Proxying actual content: PDS
Proxying your PDS root domain is more complicated, as there's more paths to be aware of. As before, ensure you have a valid SSL configuration and websockets are proxied. Then, you'll need to proxy each of the following to your PDS server:
- `/xrpc`
- `/.well-known/oauth-protected-resource`
- `/.well-known/oauth-authorization-server`
- `/oauth`
- `/@atproto`

Proxying these ensures HTTP API requests get through (`/xrpc`), as well as a few other user management services such as OAuth. When Discord added Bluesky to their connections list, this was an issue I ran into as I hadn't proxied the OAuth endpoints. This resulted in Discord returning an HTTP 500 error when trying to link the accounts.

Example Nginx Configuration can be seen [on my Gitea instance](https://git.shad.moe/Konpeki-Solutions/Nginx-Configurations/src/branch/main/http.d/konpeki.solutions).

## Wrap Up
The AT Protocol is something I hope to see used more in the future, though currently I take some issue with the problematic self-hosting documentation. With enough googling and some investigative work however, there isn't an issue that I haven't deemed unsolvable yet. 

I ended up running into my issue with Bluesky/Discord linking, fixing the issue, and writing the majority of this in one sitting at a campus Starbucks, so I feel I have to give some credit to the baristas who made my drink, and to the people on campus who put up with my complaining. Sometimes the most difficult issues become simpler with something to drink and a friend to vent to.