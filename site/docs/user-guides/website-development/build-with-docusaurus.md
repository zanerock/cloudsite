---
sidebar_position: 2
description: A rundown on building websites with Docusaurus.
---
# Build with Docusaurus

Docusaurus is an easy to use website building framework with built-in support for blogs and document trees/knowledgebases. Because Docusaurus just works with files, it's a breeze to setup and get going. Docusaurus pages can be created using HTML or simple [Markdown](https://www.markdownguide.org/) and support React components out of the box.

Check out the [Docusaurus website](https://docusaurus.io) for more info.

## Setting up Docusaurus

First, you must have Node+NPM on your system. If you need help checking for and/or installing Node+NPM, refer to the [Node and NPM section of the getting started installation guide](/docs/getting-started/installation#node-and-npm).

Once Node+NPM is installed, open a [terminal](/docs/getting-started/installation#terminal-commands) and type:

```bash
npx create-docusaurus@latest ./my-site classic
```

Where `./my-site` is the folder where Docusaurus will be set up.

That's it, docusaurus is now installed. To view the site, simply cd into the Docusaurus site folder and start the program like:

```bash
cd ./my-site
npm start
```

This should automatically open the initial site in your web browser. If it doesn't, simply point your browser to `http://localhost:3000`. The initial site is itself a quick tutorial on Docusaurus.

## Theming your site

Docusaurus does not currently have any themes beyond the 'classic' theme,[^1] In general you have to mess with the CSS (by modifying `~/src/css/custom.css`[^2]) in order to style Docusaurus. However, the [docusourus-bi-color-themer](https://github.com/liquid-labs/docusaurus-bi-color-themer) tool does provide support for building a clean, minimalist look and feel based on your custom brand colors and fonts. Check out the [docusourus-bi-color-themer](https://github.com/liquid-labs/docusaurus-bi-color-themer) home page for examples and additional details.

[^1]: There are some additional packages which are called 'themes' that you may see referred to in the documentation. These are really just plugins, however, and not "look and feel" themes. The Docusaurus team notes that adding full fledged themes is a goal.

[^2]: `~` is shorthand for 'the folder where you installed the Docusaurus site.

## Managing content

### Blog posts

#### Defining your authors

Before you make your first entry, it's useful to define `~/blog/authors.yml`. This sets up the biographical data of post authors that is used to generate the post entry. This only needs to be done once and updated only when new authors are added or biographical data needs to be changed.

Create a `authors.yml` file in the `~/blog` folder like:
 ```yaml
 author-user-name:
   name: Author Name # required
   title: Founder #optional
   url: https://authors-website.com # optional
   image_url: https://url-to-avatar/image.png # optional
 ```
 As an example, here is the `authors.yml` file for this site:

 ```yaml
zane:
  name: Zane Rockenbaugh
  title: Cloudsite Creator
  url: https://liquid-labs.com
  image_url: https://github.com/zanerock.png
```

#### A simple post

To  add a new file under the `~/blog` folder.

1. Create a new text file named like `YYYY-MM-DD-the-blog-entry-title.md` in the `~/blog` folder.
2. Add front matter meta-data at the top of the file like:
   ```markdown
   ---
   authors: [zane]
   title: Cloudsite 1.0.0-beta.2 Released
   slug: cloudsite-1.0.0-beta.2-released
   ---
   ```
   Where `authors` references the author user name in the `authors.yml` file, `title` is the title of the post, and `slug` is the URL fragment for the page; e.g.: `https://your-site.com/blog/this-is-the-slug`.
3. Write the post content.

#### A post with images or other content

To include images or other content in your blog post, create a folder like `~/blog/YYYY-MM-DD-the-blog-entry-title` instead of a file. Create an `index.md` file in that folder where you enter the metadata and author the post as above. You can then add any images or other content in that folder.

You can reference images (or other content) like: 
- `![alt text](/img/foo.png)` (Markdown image format) or 
- `<img src="/img/foo.png" alt="alt text" />` (HTML format).

#### Update a post

Just open the entry file (like `~/blog/2024-01-01-blog-entry.md` or `~/blog/2024-01-01-blog-entry/index.md`) and make your changes.

#### Additional details and options

For additional details and options, refer to the [Docusaurus blog documentation](https://docusaurus.io/docs/blog).

#### Remove the blog

If you don't want a blog as part of your site, just:

1. Delete the `~/blog` folder.
2. Open `~/docusaurus.config.js`.
3. Delete the 'Blog' entry in the navigation bar configuration by searching for 'Blog' and deleting the entry. It should look something like:
```
{to: '/blog', label: 'Blog', position: 'left'},
```
Delete everything between the `{}` curly braces.

### Adding documentation entries

When you set up your Docusaurus site, you'll see a `~/docs` folder. The initial site is configured to generate a document tree based on the contents of this folder. This is perfect for creating a knowledge base, product documentation, or categorized content in general.

#### Add a category

1. You can add a category by creating a new folder in the `~/docs` folder; e.g. `~/docs/a-new-category`.
2. Create a `_category_.yml` file in the newly created folder and enter the category meta-data like:
   ```yaml
   label: Website development
   position: 3
   link:
     type: generated-index
     description: Guides on developing static websites from scratch and using various platforms.
   ```
   Where `label` is the label that will be displayed in the document tree sidebar, `position` is the position of the category vis-a-vis sibling categories and pages, and `link.description` will be displayed in the parent category summary.

You can nest categories as much as you like.

#### Add a document

1. Create a document file in the `~/docs` folder or the appropriate category folder named like `document-title.md`.
2. Add front matter meta-data at the top of the file like:
   ```
   ----
   position: 1
   description: Description to displayed in parent category summary.
   ----
   ```
3. Write out the document in Markdown format.

#### Include images or other content

For documents, you have to place your images or other assets in the `~/static` folder. These are then referenced from your documents without the `~/static` prefix. So `~/static/img/foo.png` would be referenced like `![alt text](/img/foo.png)` (Markdown image format) or `<img src="/img/foo.png" alt="alt text" />` (HTML format).

You can create other sub-folders under `~/static` like `~/static/videos`, `~/static/audio`, etc. Note that Docusaurus doesn't care what these directories are called and you can organize them by document as well, so if you have lots of documents with lots of images, you might want to do something like `~/static/docs/my-doc-1`, `~/static/docs/some-category/another-doc`, etc.

