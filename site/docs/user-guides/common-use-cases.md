---
sidebar_position: 3
description: Shows commands for common use cases.
---
# Common Use Cases

## Create/deploy a new site

```bash
cloudisite create your-domain.com --source-path ./path/to/source/folder
```

## Update site content

```bash
cloudisite update your-domain.com --do-content
```

## Upgrade site infrastructure

Such as after the release of a new version of Cloudsite:
```bash
cloudsite update your-domain.com --do-stack
```
Note, some updates will require the site be [destroyed](#destroy-a-site) and re-[created](#create-deploy-a-new-site)

## List sites managed by Cloudsite

```bash
cloudisite list
```

## List todo reminders

```bash
cloudsite reminders list
```

## Verify site infrastructure and content are up-to-date

```bash
cloudisite verify your-domain.com
```

## Retrieve technical details

```bash
cloudisite detail your-domain.com
```

## Rebuild the local site database

This can be useful if you've changed computers or the local Cloudsite database has been lost for whatever reason. It can also be helpful when adding multiple Cloudsite managers.

```bash
cloudsite import your-domain.com site-stack-name --region us-east-1 --source-path ./path/to/site/source/folder
```

## Destroy a site

```bash
cloudisite destroy your-domain.com
```

This will ask for confirmation or you can include the `--confirmed` option when executing.