---
sidebar_position: 4
description: Generates detailed CloudFront access logs.
---
# Index Rewriter

This plugin is used where the site structure/links expect directory URLs to resolve to `index.html` files. I.e., the default infrastructure does not implement the 'service index files for directory requests' convention. This plugin rewrites bare directory requests to point the request at the `index.html` file. E.g., a request for `/dir` becomes `/dir/index.html`.

This plugin is included by default for vanilla (non-Docusaurus) sites. In particular, a [statically generated WordPress based site](/docs/user-guides/website-development/build-with-wordpress) would require this plugin for proper operation.

## Known limitations

The plugin does not currently support any sort of mapping and does not support non-HTML index files.

## Compatibility

This plugin is generally compatible with [WordPress](/docs/user-guides/website-development/build-with-wordpress) and [template based]((/docs/user-guides/website-development/build-with-a-template) sites which are usually constructed expecting that `/dir` will resolve to `/dir/index.html`.

This plugin is incompatible with [Docusaurus based]((/docs/user-guides/website-development/build-with-docusaurus) sites.

## Configuration

None.

## Cost and Impact

This plugin relies on a Lambda function and will incur a small runtime cost. The function doesn't do much completes within milliseconds so any cost should be negligible.
