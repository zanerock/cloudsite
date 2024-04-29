---
sidebar_position: 4
description: A quick example of launching a site.
---
# Your First Site

## Register your domain name

While there are ways to host a website without a domain name, Cloudsite currently does require a domain name. If you don't have a domain name already, you'll first need to register a domain name. You can find details on [choosing]/docs/user-guides/domain-names#choosing-a-domain-name) and [registering]/docs/user-guides/domain-names#register-your-domain-name) a domain name in the [domain names guide](/docs/user-guides/domain-names).

## Prepare your site files

Cloudsite hosts primarily _static websites_, with some support for specific dynamic content and actions via plugins. Basically a static site is one defined entirely by a set of files. There are methods to turn dynamic websites, like a WordPress site, into static sites and we cover a number of specific options in the [website development guides](/docs/category/website-development).

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

## Retrieving website information

We can see what websites Cloudsite is managing with:
```bash
cloudsite list
```

In our example, we'd get something like:
```yaml
- 
  apexDomain: your-domain.com
  region:     us-east-1
  sourcePath: /Users/johndoe/website
```

Notice that the `sourcePath` is now absolute regardless of the original format. To get even more technical details on our site, we can dd:

```bash
cloudiset detail your-domain.com
```

Which results in something like:
```yaml
apexDomain:               your-domain.com
bucketName:               your-domain-com
sourcePath:               /Users/johndoe/website
sourceType:               vanilla
region:                   us-east-1
certificateArn:           arn:aws:acm:us-east-1:123456789:certificate/0000000-0000-0000-0000-0000000000
accountID:                123456789
oacName:                  yoru-domain-com-OAC
stackName:                your-domain-com-stack
stackArn:                 arn:aws:cloudformation:us-east-1:123456789:stack/your-domain-com-stack/1111111-1111-1111-1111-111111111
cloudFrontDistributionID: ABCDEFGH12345
```

You typically won't need this information, but it can be useful if you're requesting support or trying to debug something yourself.

## Summary

That's about it. If you don't have a static website already, we suggest you look at the [website development guides](/docs/category/website-development) and go from there. You can also refer to the [common use cases guide](/docs/user-guides/common-use-cases) for an idea of what kinds of things you can do with the tool.