A clone of [saicaca/fuwari](https://github.com/saicaca/fuwari) modified to support the ATProtocol!

To change the public ATProtocol Handle and other information, edit src\config.ts

## Tags, Categories, Etc.
As part of the design for this ATProto frontend, the `com.whtwnd.blog.entry` schema is used. This results in compatibility with [WhiteWind - whtwnd.com](whtwnd.com). Unfortunatly, this schema doesn't include certain fields for tagging posts.

This is resolved by using a additional "schema" in the blog post itself. This is a fairly terrible solution, but it maintains compatibility with WhiteWind as a result! This is done using HTML comments to hide the extra data. Clean? No. Invisible? Yes.

To use additional Metadata, append the following to the top of a WhiteWind post __on a single line__:
```html
<!-- ### ADDITIONAL DATA FIELD ### { 'description': 'Test Post', 'published': '2025-01-03', 'tags': ["Test", "Tester"], 'authors': ["did:plc:krbzbucjaj76xjob6ju47ilo", "did:plc:ydqca4swumogifimt3zjswbd"], 'category': 'Test', 'pinned': 'true' } ### solutions.konpeki.post.extendedData ### --->
```

This is from a persistent Test Post maintained [here](https://pdsls.dev/at://did:plc:krbzbucjaj76xjob6ju47ilo/com.whtwnd.blog.entry/3lo4yxadqu226) that should contain every available metadata field. It can be used as a reference. Additionally, a table is provided below with each field, it's type, and a description.

| Field       | Type     | Description                                                                                                            |
|-------------|----------|------------------------------------------------------------------------------------------------------------------------|
| description | string   | A short description of the post                                                                                        |
| published   | string   | A publishing date for the post as YYYY-MM-DD                                                                           |
| updated     | string   | Date the post was most recently updated as YYYY-MM-DD                                                                  |
| tags        | string[] | Relevant tags for the post                                                                                             |
| authors     | object[] | A list of authors (One or More) for the post - if no authors or __only__ blog owner is listed, author field is ignored |
| category    | string   | A category for the Post                                                                                                |
| pinned      | string   | Determines if the post is pinned on the home page (Effectively a Boolean)                                              |
| linkedPost  | object   | A linked Bluesky post for the blog post                                                                                |

Additionally, object types are defined as follows.
The ATProto identifier of one or more authors (Handle and DID accepted)

#### authors type reference

| Type    | Description                                                 |
|---------|-------------------------------------------------------------|
| atproto | ATProto Users - requires did - auto-fills name, avatar, url |
| static  | General Author Type - requires name, avatar, url            |

#### authors[]
| Field  | Type   | Description                                                |
|--------|--------|------------------------------------------------------------|
| type   | string | The type of author record this object is                   |
| did    | string | [atproto type only] The author's did                       |
| name   | string | A name/username for the author                             |
| avatar | string | A URL to an avatar for the author                          |
| url    | string | A URL to direct readers to when clicking the author's name |

#### linkedPost
| Field | Type   | Description                                                                            |
|-------|--------|----------------------------------------------------------------------------------------|
| user  | string | The ATProto identifier of the user who made the Bluesky post (Handle and DID accepted) |
| post  | string | The rkey of the BlueSky post                                                           |

This works via `src/utils/parser.ts`. When parsing a post, the parser knows to extract data between the tags `### ADDITIONAL DATA FIELD ###` and `### solutions.konpeki.post.extendedData ###`. It will then take that data and interpret it as JSON. 

## Acknowledgment

This project is a fork of [fuwari](https://github.com/saicaca/fuwari) by
[saicaca](https://github.com/saicaca). The original project is licensed under the MIT License. This
fork includes modifications and enhancements while occasionally rebasing from the upstream
repository.

### Additional Changes

[fix: The banner configuration is not enabled, resulting in console error #293](https://github.com/saicaca/fuwari/pull/293)
by [wsafight](https://github.com/wsafight)
