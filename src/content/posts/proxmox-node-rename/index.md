---
title: "Renaming an Active Node in a Proxmox Cluster"
published: 2024-11-21
description: "Renaming Proxmox Cluster Nodes (or: How not to run a Cluster)"
--image:
tags: [proxmox, homelab]
category: "Homelab"
draft: false
---
:::warning[Draft Post]
This post is still a draft! Some content may change, be added, or be removed.

Todo:
  - Conclusion
:::

:::note[Renaming Instructions]
Are you here for the instructions? [Click here to skip ahead!](#instructions-changing-a-hostname-on-an-active-node)
:::

So, there's a bit of a story here. Back in September of this year, I made an impulsive purchase at the [Purdue Surplus Store](https://www.purdue.edu/surplus/). Specifically, I aquired two [Dell PowerEdge R640 Rack Servers](https://www.dell.com/us-en/work/shop/povw/poweredge-r640) for $100 USD each. I won't go into the specs, but these were a nice upgrade to my Homelab environment from my then current Dell Optiplex 5040 SFF. (Also a Purdue Surplus purchase)

It took some time to get the servers setup and connect to their iDRAC controllers, but once I found a Micro USB cable and the drivers I needed, I was ready to install an operating system! If it wasn't clear, I went with Proxmox.

Each of these machines was loaded up with a fresh install of Proxmox, and following my loose naming scheme of Touhou based hostnames, they were named `moriya-pve1` and `moriya-pve2`, referencing the [Moriya Shrine](https://en.touhouwiki.net/index.php?title=Moriya_Shrine). Then, I installed [Tailscale](https://tailscale.com) on each machine, and clustered them into the `Moriya-Cluster`

## Early Mistakes
If you've worked with Proxmox clusters before, some of these mistakes may seem obvious. But when working on my own environment, I like to do things to see what they do, and clean up the mess later. Let the following mistakes be a warning to those who homelab the same way.

### Joining a remote server to the cluster
Very early on on the first creation of moriya-cluster, I had the bright idea to join my Optiplex to the cluster as well. This was not smart. To quote the [Proxmox Documentation](https://pve.proxmox.com/pve-docs-6/chapter-pvecm.html#pvecm_cluster_network_requirements), "[Corosync] needs a reliable network with latencies under 2 milliseconds [...] to work properly". Corosync is the name of the service that handles cluster management in Proxmox.
The main problem here, is that the Optiplex was over 75 miles north. The latency was... more than two milliseconds. The cluster threw a fit. Since I had no containers yet, this was the cause of the first full Proxmox reinstallation.

### Not planning names ahead of time
My homelab hostnames follow a pattern. The Optiplex is [`Momiji-Server`](https://en.touhouwiki.net/wiki/Momiji_Inubashiri), for example. So, the decision to use `Moriya-PVE1` and `Moriya-PVE2` was a poorly made one. Sure, the names worked, but they were certainly not ideal. For this reason, I opted to rename them on November 14th. This is "the incident" that I'm writing about now.

### Making changes with limited time
I opted to rename my nodes, a major change, with only an hour to work with. At the time, I was sitting in a public space, waiting for a [friend of mine](https://fizzyapple12.com/) to return with a U-Haul carrying a Robot Arm and Controller from a freight company. This is a whole other story, but in the realm of this post, what matters is I only had about 45 minutes to do repairs. This meant the whole cluster was down for many hours until I was free again.

## What actually happened
Renaming a node in Proxmox is not an easy task. There is a [wiki page](https://pve.proxmox.com/wiki/Renaming_a_PVE_node) on how, but it lays out the following requirements.
- The node must be empty (No containers, VMs)
- The node must not be clustered
  - This rule can be ignored, but there is an extra step if you do

I read this, and in my infinite wisdom thought "what's the worst that could happen?". So I renamed my nodes. 
Nodes that were clustered and had multiple LXC containers. That, and I renamed them both simultaneously.

I updated the `/etc/hosts` and `/etc/hostname` files (ignoring the optional files), and restarted the servers. Notably, I didn't update the `corosync.conf` file, but that was only a minor issue compared to what actually went wrong.

After *fifteen minutes*, the servers connected back to my Tailscale network, and I opened the Proxmox webpages. Read-only. Forgetting to edit the `corosync.conf` caused a quorum failure, which I was lucky able to fix using the terminal access provided by my iDRAC controllers (accessible over Tailscale).

Another reboot, and the core of the problem became evident. There were now *four* nodes listed in the Server View. The newly renamed servers [`kanako-server`](https://en.touhouwiki.net/wiki/Kanako_Yasaka) and [`suwako-server`](https://en.touhouwiki.net/wiki/Suwako_Moriya) were there, but they listed no LXC containers. There should have been 7 containers, so this was concerning. Also displayed was `Moriya-PVE1` and `Moriya-PVE2`, the old names. The LXC containers were found under those nodes, and all were offline as the non-existant nodes couldn't be found. Uh oh.

## Investigating
I promptly began searching for solutions. I had about an hour to research, as it was 4pm, and I was joining a group of friends at 5pm to move an industrial robot arm that had just been picked up from the freight company.

My research was conclusive... I should reinstall my server and restore my containers from backups. In a seperate incident that same day, I had made my backups inaccessible as I switched to a new storage system. So I didn't *have* backups. Oops.

One Proxmox forum user, shodan, [then suggested to restore the backup of `/var/lib/pve-cluster/config.db`](https://forum.proxmox.com/threads/how-to-recover-var-lib-pve-cluster-config-db.27393/post-643164). This made me curious, and turned out to be the key to restoration.

## Instructions: Changing a Hostname on an Active Node

<details>
<summary>
Click here to view the instructions!
</summary>

:::caution[Disclaimer]
The following commands can cause irreversible damage and data loss!

It is advised to understand these steps yourself before running them. These commands have only been tested in a sandbox, and vary slightly from my recovery steps.

I am not liable for any issues that may arise from these commands.
:::
:::warning[Version Notice]
These steps were ran on Proxmox VE 8.2.7, and may or may not work on other versions. 
:::
:::tip[Restarting Nodes]
Do not restart any nodes until reaching the restart step! Restarting nodes early can cause a number of issues and junk folders. It is recommended to use the reboot command.
:::
:::tip[Recovering Nodes]
If you need to recover a node that you already renamed, try changing the hostname back. If that doesn't work, you will need to manually change `inode` and `parent` ids in the database for each folder and relevent file.
:::

1. Choose new hostnames for one or more nodes
2. Connect locally to the Proxmox server
    - Do not use the web interface, as the next step will temporarily stop the services it needs to run
3. Change the hostname in `/etc/pve/corosync.conf`
4. Stop all running Proxmox services <sup>[[1]](#references)</sup>
    ```bash
    killall -9 corosync
    systemctl restart pve-cluster
    systemctl restart pvedaemon
    systemctl restart pveproxy
    systemctl restart pvestatsd
    ```
5. Change the hostname in `/etc/hosts` and `/etc/hostname`
6. On the renamed node, run:
    ```bash
    sqlite3 /var/lib/pve-cluster/config.db
    ```
7. Making note of the entries, run:
    ```sql 
    SELECT * FROM tree WHERE type=4;
    ```
    - Alternatively use an online viewer such as [this one](https://inloop.github.io/sqlite-viewer/)
    - The most important fields are `inode` (First Column) and `name` (Seventh Column)
8. Identify the entry for *each* node you are renaming
9. For each node being renamed, run:
    ```sql
    UPDATE tree SET name = "NEW_NAME" WHERE inode=0;
    ```
    - Change `NEW_NAME` to the new hostname, and `0` to the inode number for the entry of the node
10. If the node is in a cluster, repeat steps 2-9 on *each node in the cluster*, even if it's not being renamed
    - This is important, as in a cluster environment corosync can sync the old database to the server, deleting the changes
11. Restart each modified node
    - Ideally, have an alternative access plan for the servers; if there is an error, the web interface may not come back up over the network
12. Edit `/etc/pve/nodes/NEW_NAME/ssh_known_hosts` and correct the hostname on all nodes
    - Replace `NEW_NAME` with the new hostname
</details>

## Conclusion
The clear moral here is to listen to warnings, especially when given by multiple sources. I was clearly warned by the documentation and multiple forum posts, however I opted to do it anyway, as I consider my homelab a breakable environment.

## References
[<sup>[1]</sup> spirit - Stopping all proxmox services on a node](https://forum.proxmox.com/threads/stopping-all-proxmox-services-on-a-node.34318/post-168154)