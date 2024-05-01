---
sidebar_position: 5
description: Shows commands for common use cases.
---
# Common Use Cases

## Prerequisites

The use cases enumerated here assume:
- There are valid local credentials Cloudsite can use. Meaning either:
  - you have [API access keys set up](/docs/get-started/authentication#initial-authentication-with-access-keys), or
  - (recommended) you have [setup single sign-on (SSO) authentication](/docs/get-started/authentication#single-sign-on-authentication) and [authenticated with SSO](/docs/get-started/authentication#single-sign-on-authentication); e.g.:
    ```bash
    aws sso login --profile cloudsite-manager
    ```
- You have the static website source files in some directory. We use `./site/source/folder/path` in our examples, but you would of course change this to the actual path.
- You have a domain name registered and are using Route 53 for domain name resolution. We use 'your-domain.com' in the examples, but you would of course change this to your actual domain name.[^1]

[^1]: If you've registered your domain with Route 53, and/or you've [set up DNS on Route 53](/docs/user-guides/domain-name-management) you should be good to go.

## Use Cases

### Create/deploy a new site

Creating a new site sets up the AWS infrastructure, configures the DNS, and uploads the site contents.

```bash
cloudisite create your-domain.com --source-path ./site/source/folder/path
```

### Update site content

When you have changes to your website content/files:
```bash
cloudisite update your-domain.com --do-content
```

### Install a plugin

To install a plugin, you just add configuration for the plugin and then update the stack. Of course, the options you need to set vary by plugin.
```bash
cloudsite plugin-settings set your-domain.com --option cloudFrontLogs.includeCookies:false
cloudsite update your-domain.com --do-stack
```

### Remove a plugin

To remove a plugin, we delete the configuration and then update the stack. Note, the entire configuration must be removed.
```bash
cloudsite plugin-settings set your-domain.com --delete --option cloudFrontLogs
cloudsite update your-domain.com --do-stack
```

### Upgrade site infrastructure

Such as after the release of a new version of Cloudsite or after changing configuration values:
```bash
cloudsite update your-domain.com --do-stack
```
Note, some updates will require the site be [destroyed](#destroy-a-site) and re-[created](#createdeploy-a-new-site)

### List sites managed by Cloudsite

Need a reminder of what sites you've created?
```bash
cloudisite list
```

### List todo reminders

Cloudsite creates reminders for operations that could not fully complete at the time they were first executed. To review outstanding reminders:
```bash
cloudsite reminders list
```

### Verify site infrastructure and content are up-to-date

For when you want to make sure everything is up-to-date:
```bash
cloudisite verify your-domain.com
```

### Retrieve technical details

Useful primarily for debugging or making manual changes to the site infrastructure:
```bash
cloudisite detail your-domain.com
```

### Rebuild the local site database

This can be useful if you've changed computers or the local Cloudsite database has been lost for whatever reason. It can also be helpful when adding multiple Cloudsite managers.

```bash
cloudsite import your-domain.com site-stack-name --region us-east-1 --source-path ./site/source/folder/path
```

### Destroy a site

When 
```bash
cloudisite destroy your-domain.com
```

This will ask for confirmation or you can include the `--confirmed` option when executing.