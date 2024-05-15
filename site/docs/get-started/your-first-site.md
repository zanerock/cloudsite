---
sidebar_position: 5
description: A quick example of launching a site.
---
# Your First Site

## Register your domain name

Cloudsite requires a domain name so your website has someplace to live.

- If don't have a domain name you'll first need to register one.
  - Refer to our [domain name selection guide](/docs/user-guides/domain-name-selection) for ideas on finding a good name.
  - Registering your domain name using [Route 53](https://aws.amazon.com/route53/) will simplify things a bit down the road.
- If you have a domain name you can:
  - [transfer your domain to Route 53](/docs/user-guides/domain-name-management#transfer-a-domain-to-route-53), or
  - [configure a domains registered with a 3rd party to work with Route 53.](/docs/user-guides/domain-name-management#configure-3rd-party-registered-domains).

## Prepare your site files

We go over a few different methods of creating a website using [WordPress](/docs/user-guides/website-development/build-with-wordpress), [Docusaurus](/docs/user-guides/website-development/build-with-docusaurus), or [templates](/docs/user-guides/website-development/build-with-a-template). Regardless of the method used to create your site, at the end of the day, you end up with a collection of _source files_ in a _source folder_. If you don't have site files already, then create a source folder (call it 'website' or something) and create a single `index.html` file in the source folder with the following contents:
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

## Deploy your site

Simply open a terminal, authenticate with AWS and run the create command:
```bash
aws sso login --profile cloudsite-manager
cloudsite create your-domain.com --source-path ~/website
```

Where `--source-path` takes the path to your source folder. The path may be relative or absolute.

:::info
The first time you launch a domain, Cloudsite will create an SSL certificate if there isn't already one. This  certificate must be verified before further setup can happen. The Cloudsite tool will give instructions on how to verify the certificate. Once verified, re-run the create command.
:::

:::info
The first time you set up a site, you'll get a message at the end re setting up "cost allocation tags". This is an optional step that will help you track costs across multiple sites or projects. The Cloudsite tool will provide instructions. You can refer to the [billing management guide](/docs/user-guides/billing-management) for details.
:::

## Updating your site

At some point, your site will probably need to be updated. In our example, let's say we want to add a little international flair and change the content from `Hello world!` to `Hello world!<br />Hallo Welt!`. We would then simply do:

```bash
cloudsite update your-domain.com --do-content
```

## Summary

That's about it. If you don't have a static website already, we suggest you look at the [website development guides](/docs/category/website-development) and go from there. You can also refer to the [common use cases guide](/docs/user-guides/common-use-cases) for an idea of what kinds of things you can do with the tool and the [Command Line Reference](/docs/user-guides/command-line-reference) for documentation on all the Cloudsite commands and options.