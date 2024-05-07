---
sidebar_position: 6
description: Details Cloudsite billing management features.
---
# Billing Management

When Cloudsite sets up a site, it also sets up tags and rules so you can track the costs associated with each site independently.

## Cost allocation tags

Cloudsite tags all tag-able[^1] resources with a 'site' tag and a 'function' tag. The value of the site tag is the site domain name and the value of the function tag is a short description of resource's function within the site infrastructure.

[^1]: In general, resources that perform billable actions are tag-able in AWS.

In general, user tags can be made 'cost allocation tags', which simply means they can be used to create '[cost categories](#cost-categories)'. That is, you group and split costs associated with resources with a given tag based on user defined rules.

## Cost categories

Cost categories are used to breakout your AWS bill into different categories so you can track the cost associated with different projects, applications, departments, etc. You can create cost categories using various dimensions such as resource type, application, and—as is the case with Cloudsite—tags.

As part of the setup of a site, Cloudsite will create a cost category for each site. This way, you can easily track the costs associated with each site independently.

When a site is first created with `cloudsite create`, it will attempt to set up the cost allocation tags and cost category rules for the site. As noted in the [cost allocation tags](#cost-allocation-tags) section, the first time you set up a site you'll need to wait till AWS has "discovered" the new tags and then run:

```bash
cloudsite update your-site.com --do-billing
```

This will set up the tags and cost category for the site. It's safe to re-run this command at any time if the cost category is deleted or not created for some reason. After the first site has been set up, the tags will already be set up as cost allocation tags and future cost categories for future sites created after that point should be created immediately.
