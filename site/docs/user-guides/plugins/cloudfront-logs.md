---
sidebar_position: 2
description: Generates detailed CloudFront access logs.
---
# CloudFront Logs

The CloudFront logs plugin logs all CloudFront access. This is primarily useful for Cloudsite developers who need more detailed insight into operations.

## Compatibility

The CloudFront logs plugin is compatible with any website or plugin.

## Configuration

| Option | Default | Description |
|----|--|--|
|`includeCookies`|`false`|_(req.)_ Indicates whether or not cookies should be included in the logs. Not, unless cookies are used by another plugin, static sites like Cloudsite do not themselves use cookies.|

## Cost and Impact

Enabling logs uses S3 storage space. In practice, any cost or performance impact is expected to be negligible.