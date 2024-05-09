---
sidebar_position: 5
description: A quick example of launching a site.
---
# Your First Site

## Register your domain name

Cloudsite requires a domain name so your website has someplace to live.

If you don't have a domain name already, you'll first need to register a domain name. Refer to our [domain name selection guide](/docs/user-guides/domain-name-selection) for ideas on finding a good name. To keep things simple, we strongly recommend registering your domain name using [Route 53](https://aws.amazon.com/route53/).

If you already have a domain name, then refer to our [domain name configuration guide](/docs/user-guides/domain-name-management) on how to either [transfer a domain to Route 53](/docs/user-guides/domain-name-management#transfer-a-domain-to-route-53) or how to [configure 3rd party registered domains](/docs/user-guides/domain-name-management#configure-3rd-party-registered-domains).

## Prepare your site files

Cloudsite hosts primarily [_static websites_](/docs/user-guides/static-websites), with some support for specific dynamic content and actions via plugins. Basically a static site is one defined entirely by a set of files. There are methods to turn dynamic websites, like a WordPress site, into static sites and we cover a number of specific options in the [website development guides](/docs/category/website-development).

Regardless of the method used to generate the static files, at the end of the day, you end up with a collection of files in a folder. We call those files the _source files_ which are all collected and stored in a single _source folder_. If you don't have site files already, then create a source folder (call it 'website' or something) and create a single `index.html` file in the source folder with the following contents:
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
The first time you launch a particular domain, Cloudsite will create an SSL certificate for the domain if there isn't already one. This SSL certificate must be verified before further setup can happen. Follow the instructions as provided by Cloudsite to verify the SSL certificate and then re-run the create command once the certificate is verified.
:::

:::info
The first time you set up any site, you'll get a message at the end of the process re setting up "cost allocation tags". It takes time for AWS to "discover" the new tags and Cloudsite provides instructions on how to set these up later. Refer to the [billing management guide](/docs/user-guides/billing-management) for further details.
:::

## Updating your site

At some point, your site will probably need to be updated. In our example, let's say we want to add a little international flair and change the content from `Hello world!` to `Hello world!<br />Hallo Welt!`. We would then simply do:

```bash
cloudsite update your-domain.com --do-content
```

## Summary

That's about it. If you don't have a static website already, we suggest you look at the [website development guides](/docs/category/website-development) and go from there. You can also refer to the [common use cases guide](/docs/user-guides/common-use-cases) for an idea of what kinds of things you can do with the tool.