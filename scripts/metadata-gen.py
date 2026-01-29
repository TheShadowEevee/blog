# <!-- ### ADDITIONAL DATA FIELD ### { 'description': 'Test Post', 'published': '2025-01-03', 'tags': ["Test", "Tester"], 'authors': ["did:plc:krbzbucjaj76xjob6ju47ilo", "did:plc:ydqca4swumogifimt3zjswbd"], 'category': 'Test', 'pinned': 'true' } ### solutions.konpeki.post.extendedData ### --->

import json
import re

# Setup Variables
metadata_json = {
    "description": "Unset",
    "published": "Unset",
    "updated": "Unset",
    "category": "Unset",
    "tags": [],
    "authors": [],
    "pinned": "false",
    "linkedPost": {
        "user": "Unset",
        "post": "Unset",
    },
}
currentStep = 0

# Intro


# Post Description
def setDescription():
    print()
    if metadata_json["description"] != "":
        print("The Description is currently set to: " + metadata_json["description"])
    print("Type a Description, or type !mainmenu to return.")
    userChoice = input("> ")
    match userChoice:
        case "!mainmenu":
            return mainMenu()
        case _:
            metadata_json["description"] = userChoice
            return mainMenu()


# Published Date
def setPublished():
    print()
    print("Unimplemented")


# Updated Date?
def setUpdated():
    print()
    print("Unimplemented")


# Category
def setCategory():
    print()
    if metadata_json["category"] != "":
        print("The Category is currently set to: " + metadata_json["category"])
    print("Type a Category Name, or type !mainmenu to return.")
    userChoice = input("> ")
    match userChoice:
        case "!mainmenu":
            return mainMenu()
        case _:
            metadata_json["category"] = userChoice
            return mainMenu()


# Tags
# 1) Add Another Tag
# 2) Remove a Tag
# 3) Continue to Next Step
def setTags():
    print()
    print("Unimplemented")


# Authors
# 1) Add an Author
# 2) Remove an Author
# 3) Continue to Next Step
def setAuthors():
    print()
    print("Unimplemented")


# Pinned Post?
def setPinned():
    print()
    if metadata_json["pinned"] == "false":
        print("This post is currently: Unpinned")
    else:
        print("This post is currently: Pinned")
    print("Would you like to pin this post? [Y]es/[N]o/[R]eturn to Menu")
    userChoice = input("> ")
    match userChoice.lower():
        case "y":
            metadata_json["pinned"] = "true"
            return mainMenu()
        case "n":
            metadata_json["pinned"] = "false"
            return mainMenu()
        case "r":
            return mainMenu()
        case _:
            print("Please enter 'Y', 'N', or 'R' as your response")
            setPinned()


# Linked Post
def setLinked():
    print()
    print(
        "1) Automatically Set Using the Post's URL (i.e. https://bsky.app/profile/{user}/post/{did} )"
    )
    print(
        f"2) Set BlueSky Post Author   Currently {metadata_json['linkedPost']['user']}"
    )
    print(
        f"3) Set BlueSky Post rkey     Currently {metadata_json['linkedPost']['post']}"
    )
    print("4) Return to Main Menu")
    userChoice = input("> ")
    match userChoice:
        case "1":
            print("\nPlease paste the URL of the post.")
            userChoice = input("> ")
            match = re.search(r"https*:\/\/.*?\/profile\/(.*?)\/post\/(.*)", userChoice)
            if match:
                metadata_json["linkedPost"]["user"] = match[1]
                metadata_json["linkedPost"]["post"] = match[2]
                setLinked()
            else:
                print(
                    "Unable to match on this URL. Please try again, or set the fields manually."
                )
                setLinked()

        case "2":
            print("\nPlease type the post author's Handle or DID")
            metadata_json["linkedPost"]["user"] = input("> ")
            return setLinked()
        case "3":
            print("\nPlease type the post's rkey")
            metadata_json["linkedPost"]["post"] = input("> ")
            return setLinked()
        case "4":
            return mainMenu()
        case _:
            print("Please pick a number 1-4. Pick 4 to return to the Main Menu.")
            return setLinked()


# Main Menu
def mainMenu():
    print()
    print("Pick a number 1-9")
    print(f"1) Set Description    Currently {metadata_json['description']}")
    print(f"2) Set Publish Date   Currently {metadata_json['published']}")
    print(f"3) Set Updated Date   Currently {metadata_json['updated']}")
    print(f"4) Set Category       Currently {metadata_json['category']}")
    print(
        f"5) Set Tags           Currently {', '.join(metadata_json['tags']) if len(metadata_json['tags']) > 0 else 'Unset'}"
    )
    print(
        f"6) Set Authors        Currently {len(metadata_json['authors']) if len(metadata_json['authors']) > 0 else 'Unset'}"
    )
    print(f"7) Set Pinned         Currently {metadata_json['pinned']}")
    print(
        f"8) Set Linked Post    Currently {'Set' if metadata_json['linkedPost']['post'] != 'Unset' else 'Unset'}"
    )
    print("9) Finish and get Metadata")
    userChoice = input("> ")
    match userChoice:
        case "1":
            return setDescription()
        case "2":
            return setPublished()
        case "3":
            return setUpdated()
        case "4":
            return setCategory()
        case "5":
            return setTags()
        case "6":
            return setAuthors()
        case "7":
            return setPinned()
        case "8":
            return setLinked()
        case "9":
            return print(
                "<!-- ### ADDITIONAL DATA FIELD ### "
                + json.dumps(metadata_json)
                + "### solutions.konpeki.post.extendedData ### --->"
            )
        case _:
            print("Please pick a number 1-9. Press 9 or CTRL+C to Quit.")
            return mainMenu()


# Call the Main Menu and Start
mainMenu()
