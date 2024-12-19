---
title: "A writeup of KC7's New2Cyber 2023 event"
published: 2023-03-16
description: "KC7 New2Cyber 2023 Writeup"
--image: 
tags: ["kc7", "writeup", "ctf"]
category: "Events"
draft: false
---

:::important[Update 11/20/24]
When reviewing this post, I noticed some changes to the KC7 platform. All links have been updated, but will retain the original name as written. For reference, the old New2Cyber challenge is now called "Envolve Labs - With a twist!".
:::

The KC7 New2Cyber Game was a Cybersecurity challenge hosted on the KC7 platform alongside the SANS New2Cyber Summit on March 14th. It was a "Jeopardy" style challenge, meaning it was broken into sections of questions you could answer at your leisure. This writeup will consider the main part of the event as sections 2 and 3, given they hold the majority of the KQL work and all of the incident discovery.

For more information on this event, you can visit the KC7 page for it at [SANS New2Cyber - KC7 (kc7cyber.com)](https://kc7cyber.com/go/ADVANCE/). This page includes the dataset used, a link to the event leaderboard/submission page, and their training guide. The training guide is a very well written explanation of Module 1 meant to guide you through learning the basics of KQL while completing most of Section 1.

Going forward, the bulk of this event will be referred to as "the security incident" or just "incident". This writeup will both go over the event's main portion giving a narrative of the incident and guiding through many of the steps taken throughout.

:::warning[Warning: Spoilers / Answers Ahead]
*This event has finished, but the organizers at KC7 have said it will stay live indefinitely. If you haven't tried the event yet, give it a go yourself first! This is a good learning tool to go in blind for at first; you can always come back here for guidance along the way.*

*Sections 2 and 3 of this event are discussed to the point of basically giving away solutions below. Sections 4 and 5 are not included and can be mostly found with some googling.*
:::

## The Scenario

*View the KC7 New2Cyber training guide to read the full scenario! [SANS New2Cyber - KC7 (kc7cyber.com)](https://kc7cyber.com/go/ADVANCE/)*

*Paraphrased scenario from the training guide:*  
Today is your first day as a Junior Security Operations Center (SOC) Analyst at Envolve Labs Corporation. Envolve Labs is a (fictional!) 2012 med-tech startup with a goal of designing flexible vaccine tech. Envolve Tech has 4 key partners (listed in the training guide) that will be seen throughout this event.

Envolve Tech has hired you as they realize they need to invest more in Cybersecurity efforts. Envolve Labs collects log data about the activities its employees perform on the corporate network. These audit logs will be the subject of your investigations as you determine whether the company is being targeted by malicious actors.  
<sub>All credit for the above scenario goes to KC7!

## Activity Summary

After receiving the tip on the potential phishing domain, a larger investigation was started. One person had clicked on the malicious domain and investigating this further led to discovery of potentially 2 different potential malicious actors.

Hereby referred to as Actor A and Actor B, these two actors are for now suspected to be different based on their methods and time of intrusion. Actor A used a wide scale phishing campaign to steal credentials and deliver malicious files meant to allow exfiltration of data. Actor B appears to be a different, more advanced actor using more targeted phishing using compromised emails, and more persistent tools on infected systems.

Actor A could potentially be a group of malicious actors, as many domains and IP addresses showed similar methods and similar timing. There were 3 total groups of interconnected IPs and domains that fit the exhibited behavior, and the similarity in their operations are what linked the 3 groups as one larger actor.

## Actor Methods of Operation

### Actor A

Actor A used a simple phishing scheme in order to get a handful of employees to share login information or download malicious files. The extent of this campaign appears to have aimed to gain login credentials, which were used to download files from the email system.

Actor A operated primarily on January 4th, 8th, and 9th.

|||
|---------------------|-------|
| Recon               | Collected Email Addresses of multiple employees, did research on important company figures (i.e., the CEO) |
| Weaponization       | Unknown |
| Delivery            | Shared malicious files and URLs through email via phishing campaign |
| Exploitation        | Unknown |
| Installation        | Unknown |
| Command and Control | N/A |
| Actions             | Used access to user accounts to download critical files over open internet |

### Actor B

Actor B appears to be a more advanced actor than Actor A. Actor B used similar methods of initial infection, sharing malicious files via phishing emails. However, there were less emails suggesting a more targeted approach. On top of this, the infected files were better hidden using file names such as "EnvolveLabs_Research_Tool.7z", and "updater.dll". These files were designed to be stealthy and remain undetected.

The updater.dll file that extracted itself from the .7z file allowed a direct, persistent connection to the malicious actor. Once the updater.dll was installed, it appears to drop the file "infector.exe" and operate it via a Windows Scheduled Task. Together, these two files opened up paths for the actor to control the computers via Ligolo and PuTTY. In total, only 7 employees were infected, again suggesting a more targeted attack.

Actor B operated primarily on January 5th.

|||
|---------------------|-------|
| Recon               | Likely to have researched various positions within the company |
| Weaponization       | Use of common and specialized file names are meant to avoid detection and maximize attack ability |
| Delivery            | Shared malicious files through email via phishing campaign |
| Exploitation        | Extraction of a malicious 7z file resulted in infection |
| Installation        | updater.dll was used to create a persistent infector.exe |
| Command and Control | Actor opened paths for remote control via Ligolo and PuTTY |
| Actions             | Unknown |

## Impact

The impact level of this event is hard to determine. However, this appears to be a Mid-High severity incident (on an arbitrary scale) given what impact we *do* know of.

Actor A has gained access to a large number of employee accounts, compromising security in more ways than they may know how to take advantage of yet. They have already compromised email accounts in order to download seemingly sensitive files (based purely on file name) and may be able to use the compromised accounts to send emails spreading their phishing campaign further.

Actor B on the other hand has direct, persistent access to multiple systems potentially owned by higher ups, putting unknown amounts of information at risk. Actor B's method of infection makes it hard if not impossible to tell what files may have been exfiltrated already using the logs provided here.

## Discovery Process and KQL Examples

The discovery process for this incident will follow the order of the questions asked in the KC7 answer submission page. Not all questions will be explored as there were 39 questions total in Sections 2 and 3, with some being repeats or not closely related enough to others to make a quick narrative from.

The KQL queries used during the discovery process will be shared to show what is happening and make it easy to follow along. This should ideally be understandable if you haven't looked at the KC7 challenge but will be a good guide if you are actively working on it or have completed it.

***Disclaimer: All URLs, IP addresses, Names, Emails, and other data is generated for this event by the KC7 team, and any mention is NOT an endorsement or claim of malicious intent for or against listed entities.***

### Section 2 - Introducing the Hackers

Section 2 has a general focus on identifying the suspicious domain and learning initial information about our first actor.

#### Questions 2.1 - 2.4

The incident discovery begins with a suspicious domain, `immune.tech`. In the training guide, it is stated that the domain was found by a security researcher and publicly shared as a suspicious domain found while looking into phishing activity.

Since this domain was potentially related in phishing activity, we should check to see if any of our employees have received emails with a link to this domain. We can search with the following KQL query.

```sql
Email
| where link has "immune.tech"
```

This query shows all the emails received with a link to `immune.tech`, which will be used to answer the questions. This query checks the Email table, searches all entries in the link column for the text `immune.tech`, and returns any positive results.

#### Questions 2.5 - 2.8

Knowing that multiple employees received an email with the suspicious domain, the next step is to identify if a user clicked on the link at any point. We can search the OutboundBrowsing table to identify any potential clicks.

```sql
OutboundBrowsing
| where url has "immune.tech"
-- One result was returned with a src_ip of 192.168.0.234, we can search the Employee table to see who this was
Employees
| where ip_addr has "192.168.0.234"
```

It appears that "Marissa Stephens" did in fact click the link in one of the emails. It is likely this was a phishing email, and they may have given away their login to the actor behind the domain. We should check logins to their account.

```sql
-- Visible in the Employee table, usernames are first two letters of their first name, and their full last name, all lowercase.
AuthenticationEvents
| where username has "mastephens"
```

As we worried, it appears that there was a login to Marissa's account 9 hours later from IP address `88.150.11.111`. Now, this could be Marissa logging in, we can't be certain yet. Let's check if this IP has been used to log in before.

```sql
AuthenticationEvents
| where src_ip has "88.150.11.111"
```

It appears this issue runs far deeper than anticipated. We can use a new KQL term, count, to get the number of returned results. Running the query again with `| count` added on a new line shows a total of 21 logins from this IP address, all on separate accounts. Not only is this very likely to be a malicious actor, but it also seems they have access to more than expected.

#### Tips for Questions 2.9 - 2.13

- **2.9** - `.gzip` is a file extension, try searching for a URL ending in this extension.
- **2.11** - Searching for this person as a recipient will turn up multiple results, look for a suspicious sender or misspellings!
- **2.13** - Use the `distinct` query on the link field to isolate unique instances.

### Section 3 Examples - Hackers sending malware docs

Section 3 begins to focus on another type of threat. The bad actors have sent multiple malicious documents over email, from a variety of emails, some being compromised emails from partner companies. Our second actor makes an appearance for a short time here.

#### Questions 3.1 - 3.5

The continuation of the discovery process starts with a new suspicious domain, `notice.io`. This domain was called out for having a specific malicious file, "Critical_Security_Path.docx".

Following up on this domain, we need to see if anyone was targeted.

```sql
-- How many emails with this domain were recieved
Email
| where link contains "notice.io"
| count
-- Who sent the emails, and what was the subject line
Email
| where link contains "notice.io"
```

It appears this email has found it's way into some employee's inboxes. Using the same methods as section 2, it's possible to find out that one of the employees clicked the link, and what time the hosted file was downloaded at.

#### Questions 3.7, 3.12, 3.14

Between questions 3.5 and 3.16, the questions are similar to previous questions. These 3 however are new.

```sql
/* 3.7 - What other domains are hosted on the same IPs as notice.io? */
-- Using PassiveDns, we can determine the IP address for notice.io
PassiveDns
| where domain contains "notice.io"
-- Then, we can test the returned IP addresses and see what other domains they might resolve to
PassiveDns
| where ip contains "21.101.248.158"
/* 3.12 - How many IPs does scanverify.com resolve to? */
-- Similar to part one of 3.7, see what IPs scanverify resolves to and count them
PassiveDns
| where domain contains "scanverify.com"
| count
/* 3.14 - What is the name of the file hosted on scanverify.com? */
-- One way to do this is to check OutboundBrowsing for someone who has already navigated to the file, and copy the file name from the end of the link
OutboundBrowsing
| where url contains "scanverify.com"
```

#### Questions 3.16 - 3.26

Starting here, we go deeper into what this actor is doing for recon and how they are infecting machines once their email is clicked on.

First, we can look into what recon the actor may be doing. They may have searched for some systems, and what we're looking for is guided by Q 3.16 and 3.17.

```sql
-- The full query is "helpdesk ticket system", but using just helpdesk works better since we can't use spaces
InboundBrowsing
| where url contains "helpdesk"
-- The next query asks what policy they're looking for. The following returns multiple results, some with the search we're looking for of "Password Expiration Policy"
InboundBrowsing
| where url contains "policy"
```

Now we want to look into what the "EnvolveLabs_Research_Tool.7z" file does. We're told a .dll was dropped on the machine after downloading the 7z file, and we have to find the name of it.

```sql
-- Find IP Addresses that downloaded the file
OutboundBrowsing
| where url contains "EnvolveLabs_Research_Tool.7z"
-- Find the employee to get their computer hostname
Employees
| where ip_addr contains "192.168.1.129"
-- Search for file creations using the computer hostname
FileCreationEvents
| where hostname contains "5RT9-MACHINE"
```

This reveals a .dll file being created about 40 seconds after the .7z file is downloaded, named updater.dll.
We should now check to see if any commands have been run on this computer.

```sql
ProcessEvents
| where hostname contains "5RT9-MACHINE"
```

This reveals the updater.dll file running 2 commands, "whoami" and a command using Windows Task Scheduler.  
<sub>Note: This command (starting with schtasks) is the answer to Q 3.20. Use this information to complete Q 3.21; Q 3.20 does not exist due to an error.  

We can take the task scheduler command and check to see if other systems may have run it.

```sql
-- The full command was omitted here. It is recommended to search using the entire command in most scenarios.
ProcessEvents
| where process_commandline contains "schtasks"
```

Now that we know more machines are infected, we need to check for this file on other machines.

```sql
FileCreationEvents
| where filename contains "updater.dll"
```

Using the sha256 hashes provided, we can see 4 unique files with the same name, on 4 different machines. We can search the hash of one of them on [VirusTotal](https://virustotal.com) to see how many antivirus programs detect it as malicious.
We can search for known tunneling tools to see if they have been used on these infected machines. First we can check for the use of ligolo, as well as see if any other tools are being used.

```sql
-- We're asked to look at a specific employee first
Employees
| where name contains "Michelle Beal"
-- See what IP address is being tunnled to
ProcessEvents
| where hostname contains "UY2V-LAPTOP"
| where process_name contains "ligolo"
-- Check for other systems and programs contacting the found IP address
ProcessEvents
| where process_commandline contains "158.129.161.214"
-- Check to see how many ligolo tunnels are in use across the network
ProcessEvents
| where process_name contains "ligolo"
| count
```

Finishing this, that's the extent of the discovery asked for. If you'd like, feel free to look around more and play with the data, and make your own assumptions on what is going on behind the scenes! Who knows, I may be wrong entirely with my assumptions on the number of actors and their roles. It's up to how you interpret the data in front of you.

## Conclusion

If you are interested in participating in future KC7 events, I recommend checking out their website at <https://kc7cyber.com/>. I had a great time talking with others in the slack channel created for this event, and I can safely say that Question 5.20 has scarred many of us for life with how many attempts were poured into it. (The answer was a `hack and leak` attack by the way! You can read some interesting news stories if you google it.) Question 20 was the last question I had left and was the only question that resulted in me finishing everything second instead of first. Congrats to oclku9rt for pulling that out from under me for the first 100% completion!

All in all, this was a great event, and I had a great time working through some of the problems presented. The KC7 platform seems to be a great learning tool with this hands-on exploration into a realistic environment simulating an actual security event you may encounter as a Security Analyst. As a participant who hasn't done something like this before, KC7 did a great job making this engaging while still keeping everything at a good skill level for those participating in the SANS New2Cyber Summit, from anyone brand new to the Cyber scene as well as long time members of the field.

## Related Resources

- [SANS Summits](https://www.sans.org/cyber-security-training-events/?event-types=summit)
- [KC7](https://kc7cyber.com/)
