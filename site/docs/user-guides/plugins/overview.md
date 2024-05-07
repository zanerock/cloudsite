---
sidebar_position: 1
description: Overview of general plugin concepts, installation, and configuration.
---
# Overview

The basic Cloudsite setup, with no plugins, serves static files quickly and securely, and that's about it. Plugins add additional features to a website. This includes both end-user visible features, such as the [contact form](./contact-form) and internal, operational features such as [CloudFront access logs](./cloudfront-logs).

## Available plugins

- [CloudFront logs](./cloudfront-logs): Logs all CloudFront access.
- [Contact form](./contact-form): Adds support for dynamic form submission.
- [Index rewriter](./index-rewriter): Rewrites bare directory references to add `index.html`.

## Install plugins

### On site creation

When creating a site, the user will, by default, be asked which plugins should be installed. Any selected plugins will be interactively configured as part of the installation process. That is, if neither `--no-interactive` and `--option` options are specified.

You can also specify plugin options via the CLI using the `--option` option. Setting any plugin parameter will cause the plugin to be installed and unset will be interactively queried unless `--no-interactive` is also specified.

In order to support a headless install, users can use the `--no-interactive` [`create` option](/docs/user-guides/command-line-reference#create-options). With `--no-interactive` specified, any un-set optiosn will take their default value and any un-set plugin options with no default value will raise an error.

 Also note, in non-interactive mode, plugins are enabled according to the plugin's own default settings which are in turn dependent on the site type and configuration. E.g., the [index rewrite](./index-rewriter) plugin is installed by default for non-Docusaurus sites.

### After site launch

After a site has been launched, plugins are added by configuring the plugin and then updating the stack. E.g., to add the CloudFront logs plugin, you would do:

```bash
cloudsite plugin-settings set your-site.com --option cloudFrontLogs.enableCookies:false
cloudsite update your-site.com --do-stack
```

## Remove plugins

To remove a plugin, we delete the plugin configuration and update the stack:

```bash
cloudsite plugin-settings set your-site.com --delete --option cloudFrontLogs
cloudsite update your-site.com --do-stack
```

## Default plugins

Some plugins are included by default under certain circumstances. For instance, the [index rewriter](/docs/user-guides/plugins/index-rewriter) plugin is included by default for non-docusaurus websites. Users will be given an opportunity to confirm or change this default behavior during an interactive install. To perform a headless install, the plugin can be explicitly turned off like:

```bash
cloudsite create my-site.com --source-path ./path/to/source --option indexRewriter:false
```

## Plugin configuration

- Review plugin configuration with:
  ```bash
  cloudsite plugin-settings show my-site.com
  ```
- Unless disabled, the install process will walk users through each configuration option not specified by an `--option` option.
- Plugins can be re-configured after launch by executing `cloudsite plugin-settings set` followed by `cloudsite update`.