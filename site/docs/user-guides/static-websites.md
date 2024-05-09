---
sidebar_position: 9
description: An explanation of what makes a website 'static'.
---
# Static Websites

## Overview

- A static website is a site defined entirely by a set of files.
- A static website may include dynamic pages and even dynamic content through the use of Javascript.
- A hybrid site maps specific URLs to dynamic content and/or actions. Cloudsite adds some dynamic features via plugins.
- Static websites are _fast_.
- Static websites are more secure because there's no admin features to hijack; the content just is.

## Content creation

There are two basic ways to create a static site. The first is to create (or [copy from a template](/docs/user-guides/website-development/build-with-a-template)) the HTML, CSS, and Javascript files directly. The second is to use some platform running locally on your computer (like [WordPress](/docs/user-guides/website-development/build-with-wordpress) or [Docusaurus](/docs/user-guides/website-development/build-with-docusaurus)) to manage your content an then to generate the static files from the dynamic site.

When you generate the static site, you're effectively taking a snapshot of the dynamic site at that point in time. So, let's say you're using WordPress as the local _content management system_ (_CMS_) and you want to add a blog post. You would author the post like you would with any WordPress host. When you're done, the static site plugin generates the static files that now includes your new blog entry.