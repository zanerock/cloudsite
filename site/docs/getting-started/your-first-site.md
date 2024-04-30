---
sidebar_position: 4
description: A quick example of launching a site.
---
# Your First Site

## Register your domain name

While there are ways to host a website without a domain name, Cloudsite currently does require a domain name. If you don't have a domain name already, you'll first need to register a domain name. Refer to our [domain name selection guide](/docs/user-guides/domain-name-selection) for ideas on finding a good name. If you register the domain with AWS Route 53, then that should be all you need to do as far as the domain name goes.

If you already have a domain name, then refer to our [domain name configuration guide](/docs/user-guides/domain-name-management) on how to either [transfer a domain to Route 53](/docs/user-guides/domain-name-management#transfer-a-domain-to-route-53) or how to [configure 3rd party registered domains](/docs/user-guides/domain-name-management#configure-3rd-party-registered-domains).

## Prepare your site files

Cloudsite hosts primarily [_static websites_](/docs/user-guides/static-websites), with some support for specific dynamic content and actions via plugins. Basically a static site is one defined entirely by a set of files. There are methods to turn dynamic websites, like a WordPress site, into static sites and we cover a number of specific options in the [website development guides](/docs/category/website-development).

Regardless of the method used to generate the static files, at the end of the day, you end up with a collection of files in a director. We call those files the _source files_. For our example, we'll have a single source file:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Hello world!</title>
  </head>
  <body>
    Hello world!
  </body>
</html>
```

We'll save this file in a file called `index.html` in a folder `website` just under the home folder. So, that looks like:
```
- $HOME
  | 
  - website
    |
    - index.html
```

Obviously your real website will have a lot more files, but the procedure is the same whether we're dealing with one or one thousand files. The important thing is that all the source files be placed in a source folder.

## Deploy your site

Deploying is as simple as:
```bash
# 1. Authenticate with AWS (if needed)
aws sso login --profile cloudsite-manager
# 2. Deploy the site.
cloudsite create your-domain.com --source-path ~/website
```

Where `--source-path` takes the path to your source folder. The path may be relative or absolute.

## Updating your site

At some point, your site will probably need to be updated. In our example, let's say we want to add a little international flair and change the content from `Hello world!` to `Hello world!<br />Hallo Welt!`. We would then simply do:

```bash
cloudsite update your-domain.com --do-content
```


## Summary

That's about it. If you don't have a static website already, we suggest you look at the [website development guides](/docs/category/website-development) and go from there. You can also refer to the [common use cases guide](/docs/user-guides/common-use-cases) for an idea of what kinds of things you can do with the tool.