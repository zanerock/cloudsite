# Cloudsite

Low cost, high performance cloud based website hosting manager. Cloudsite features CDN integration, DoS protection, free SSL certificates, and contact forms. In addition, since Cloudsite use "pay as you go" cloud infrastructure, hosting costs are generally well below typical market rates.

## Installation

```bash
npm i -g cloudsite
```

## Usage

```bash
aws sso login --profile your-sso-profile # authenticate with AWS

cloudsite configuration initialize # walks you through setup questions

cloudsite create your-domain.com --source-path . # deploys your site in the cloud
cloudsite update your-domain.com # updates site content
cloudsite destroy your-domain.com # destroys site infrastructure
```
## Command reference

### Usage

`cloudsite <options> <command>`

### Main options

|Option|Description|
|------|------|
|`<command>`|(_main argument_,_optional_) The command to run or a sub-command group.|
|`--quiet`, `-q`|Makes informational output less chatty.|
|`--throw-error`|In the case of an exception, the default is to print the message. When --throw-error is set, the exception is left uncaught.|

### Commands

- [`configuration`](#cloudsite-configuration): Command group for managing the Cloudsite CLI configuration.
- [`create`](#cloudsite-create): Creates a new website, setting up infrastructure and copying content.
- [`destroy`](#cloudsite-destroy): Destroys the named site. I.e., deletes all cloud resources associated with the site.
- [`plugin-settings`](#cloudsite-plugin-settings): Sets (or deletes) a site option.
- [`update`](#cloudsite-update): Updates a website content and/or infrastructure.

<span id="cloudsite-configuration"></span>
#### `cloudsite configuration [subcommand]`

Command group for managing the Cloudsite CLI configuration.

##### `configuration` options

|Option|Description|
|------|------|
|`[subcommand]`|(_main argument_,_required_) The configuration action to perform.|


##### Subcommands

- [`initialize`](#cloudsite-configuration-initialize): Runs the initialization wizard and updates all options.
- [`show`](#cloudsite-configuration-show): Displays the current configuration.

<span id="cloudsite-configuration-initialize"></span>
###### `cloudsite configuration initialize`

Runs the initialization wizard and updates all options.

<span id="cloudsite-configuration-show"></span>
###### `cloudsite configuration show`

Displays the current configuration.

<span id="cloudsite-create"></span>
#### `cloudsite create <options> [apex-domain]`

Creates a new website, setting up infrastructure and copying content.

##### `create` options

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The site apex domain.|
|`--bucket-name`|The name of the bucket to be used. If no option is given, cloudsite will generate a bucket name based on the apex domain.|
|`--no-build`|Supresses the default behavior of building before uploading the site content.|
|`--no-delete-on-failure`|When true, does not delete the site stack after setup failure.|
|`--region`|The region where to create the site resources. Defaults to 'us-east-1'.|
|`--source-path`|Local path to the static site root.|
|`--source-type`|May be either 'vanilla' or 'docusaurus', otherwise process will attempt to guess.|
|`--stack-name`|Specify the name of the stack to be created and override the default name.|

<span id="cloudsite-destroy"></span>
#### `cloudsite destroy <options> [apex-domain]`

Destroys the named site. I.e., deletes all cloud resources associated with the site.

##### `destroy` options

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The domain of the site to delete.|
|`--confirmed`|Skips the interactive confirmation and destroys the resources without further confirmation.|

<span id="cloudsite-plugin-settings"></span>
#### `cloudsite plugin-settings <options> [apex-domain]`

Sets (or deletes) a site option.

##### `plugin-settings` options

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The apex domain identifying the site.|
|`--delete`|When set, then deletes the setting. Incompatible with the '--value' option.|
|`--name`|The option name.|
|`--option`|A combined name-value paid, separated by ':'. Used to set multiple setting values at one time.|
|`--value`|The setting value. Incompatible with the '--delete' option.|

<span id="cloudsite-update"></span>
#### `cloudsite update <options> [apex-domain]`

Updates a website content and/or infrastructure.

##### `update` options

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The apex domain identifying the site.|
|`--do-content`|Limits update to site content and any other specified updates.|
|`--do-dns`|Limits update to DNS entries and any other specified updates.|
|`--no-build`|Supresses the default behavior of building before updating the site.|
|`--no-cache-invalidation`|Suppresses the default behavior of invalidating the CloudFront cache after the files are updated. Note that invalidation events are chargeable thought at the time of this writing, each account gets 1,000 free requests per year.|



## Contributing

Plase feel free to submit any [bug reports or feature suggestions](https://github.com/liquid-labs/cloudsite/issues). You're also welcome to submit patches of course. We don't have a full contributors policy yet, but you can post questions on [our discord channel](https://discord.gg/QWAav6fZ5C). It's not monitored 24/7, but you should hear back from us by next business day generally.

## Support and feature requests

The best way to get free support is to [submit a ticket](https://github.com/liquid-labs/cloudsite/issues). You can also become a patron for as little as $1/month and get priority support and request new feature on [all Liquid Labs open source software](https://github.com/liquid-labs). You can get these benefits and [support our work at patreon.com/zanecodes](https://www.patreon.com/zanecodes).
