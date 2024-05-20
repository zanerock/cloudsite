---
sidebar_position: 1
description: Documents available Cloudsite commands.
---
# Command Line Reference

## Usage

`cloudsite <options> <command>`

## Main options

|Option|Description|
|------|------|
|`<command>`|(_main argument_,_optional_) The command to run or a sub-command group.|
|`--format`|Sets the format for the output. May be 'terminal' (default), 'text', 'json', or 'yaml'.|
|`--help`, `-?`|Prints general or command specific help.|
|`--no-color`|Disables terminal colorization.|
|`--no-reminders`, `-R`|Suppresses any reminders. Particularly useful for programmatic usage where the extra output might break things.|
|`--quiet`, `-q`|Makes informational output less chatty.|
|`--sso-profile`|The AWS local SSO profile to use for authentication.|
|`--throw-error`|In the case of an exception, the default is to print the message. When --throw-error is set, the exception is left uncaught.|
|`--verbose`|Activates verbose (non-quiet mode) even in situations where quiet would normally be implied.|

## Commands

- [`cleanup`](#cloudsite-cleanup): Attempts to fully delete partially deleted sites in the 'needs to be cleaned up' state.
- [`configuration`](#cloudsite-configuration): Command group for managing the cloudsite CLI configuration.
- [`create`](#cloudsite-create): Creates a new website, setting up infrastructure and copying content.
- [`destroy`](#cloudsite-destroy): Destroys the named site.
- [`detail`](#cloudsite-detail): Prints details for the indicated site.
- [`document`](#cloudsite-document): Generates self-documentation in Markdown format.
- [`get-iam-policy`](#cloudsite-get-iam-policy): Prints an IAM policy suitable for operating cloudsite.
- [`import`](#cloudsite-import): Generates a site database based on currently deployed site stacks.
- [`list`](#cloudsite-list): Lists the sites registered in the local database.
- [`plugin-settings`](#cloudsite-plugin-settings): Command group for managing plugin settings.
- [`reminders`](#cloudsite-reminders): Command group for managing reminders.
- [`update`](#cloudsite-update): Updates a website content and/or infrastructure.
- [`verify`](#cloudsite-verify): Verifies the site is up and running and that the stack and content are up-to-date.

<span id="cloudsite-cleanup"></span>
### `cleanup`

`cloudsite cleanup <options> <apex-domain>`

Attempts to fully delete partially deleted sites in the 'needs to be cleaned up' state.

#### `cleanup` options

|Option|Description|
|------|------|
|`<apex-domain>`|(_main argument_,_optional_) Specifies the site to clean up rather than trying to cleanup all pending sites.|
|`--list`|Lists the sites in need of cleaning up.|

<span id="cloudsite-configuration"></span>
### `configuration`

`cloudsite configuration [subcommand]`

Command group for managing the cloudsite CLI configuration.

#### `configuration` options

|Option|Description|
|------|------|
|`[subcommand]`|(_main argument_,_required_) The configuration action to perform.|


#### Subcommands

- [`setup-local`](#cloudsite-configuration-setup-local): Runs the local setup wizard and updates all options.
- [`setup-sso`](#cloudsite-configuration-setup-sso): Runs the SSO wizard and sets up the SSO user authentication in the IAM Identity Center.
- [`show`](#cloudsite-configuration-show): Displays the current configuration.

<span id="cloudsite-configuration-setup-local"></span>
##### `setup-local`

`cloudsite configuration setup-local`

Runs the local setup wizard and updates all options. This should be used after the SSO account has been created (see 'cloudsite configuration setup-sso').

<span id="cloudsite-configuration-setup-sso"></span>
##### `setup-sso`

`cloudsite configuration setup-sso <options>`

Runs the SSO wizard and sets up the SSO user authentication in the IAM Identity Center.

###### `setup-sso` options

|Option|Description|
|------|------|
|`--defaults`|Use the defaults were possible and skip unnecessary interactive setup.|
|`--delete`|Confirms deletion of the Access keys after setting up the SSO access. If neither '--delete' nor '--no-delete' are set, then deletion will be interactively confirmed.|
|`--group-name`|The name of the group to create or reference. This group will be associated with the permission set and user. It is highly recommended to use the default name or certain operations, like 'import', may be complicated.|
|`--instance-name`|The name to assign to the newly created identity center, if needed.|
|`--instance-region`|The region in which to set up the identity center if no identity center currently set up. Defaults to 'us-east-1'.|
|`--no-delete`|Retains the Access keys after setting up SSO access.|
|`--policy-name`|The name of the policy and permission set to create or reference. It is highly recommended to use the default name or certain operations, like 'import', may be complicated.|
|`--sso-profile-name`|The name of the local SSO profile to create.|
|`--user-email`|The primary email to associate with the user.|
|`--user-family-name`|The family name of the cloudsite management user.|
|`--user-given-name`|The given name of the cloudsite management user.|
|`--user-name`|The name of the user account to create or reference.|

<span id="cloudsite-configuration-show"></span>
##### `show`

`cloudsite configuration show`

Displays the current configuration.

<span id="cloudsite-create"></span>
### `create`

`cloudsite create <options> <apex-domain>`

Creates a new website, setting up infrastructure and copying content.

The first time you launch a new domain, Cloudsite will create an SSL certificate for the domain as necessary. If a new SSL certificate is created, the creation process will exit and you'll be given instructions on how to verify the SSL certificate. Once verification is complete, re-run the create command.

You can use `--no-interactive` to guarantee headless operation, though you must be sure to specify all primary options. Any un-specified `--option` for an active plugin will take its default value and any required without a default value will raise an error. See `--option` and `--no-interactive` documentation and/or [the plugins overview guide](/docs/user-guides/plugins/overview) for further details.

#### `create` options

|Option|Description|
|------|------|
|`<apex-domain>`|(_main argument_,_optional_) The site apex domain.|
|`--no-build`|Supresses the default behavior of building before uploading the site content.|
|`--no-delete-on-failure`|When true, does not delete the site stack after setup failure.|
|`--no-interactive`|Suppresses activation of the interactive setup where it would otherwise be activated. Any options for activated plugins not set on the command line by an `--option` will take their default value.|
|`--option`|A combined name-value pair of plugin options in the form of: &lt;name&gt;:&lt;value&gt;. Can be used multiple times. Setting any option activates the associated plugin and any unset options are queried unless `--no-interactive` is also set, in which case the options take their default value.|
|`--region`|The region where to create the site resources. Defaults to 'us-east-1'.|
|`--site-bucket-name`|The name of the bucket where website content is stored. If no option is given, Cloudsite will generate a random bucket name.|
|`--source-path`|Local path to the static site root.|
|`--source-type`|May be either 'vanilla' or 'docusaurus', otherwise process will attempt to guess.|
|`--stack-name`|Specify the name of the stack to be created and override the default name.|

<span id="cloudsite-destroy"></span>
### `destroy`

`cloudsite destroy <options> [apex-domain]`

Destroys the named site. I.e., deletes all cloud resources associated with the site.

#### `destroy` options

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The domain of the site to delete.|
|`--confirmed`|Skips the interactive confirmation and destroys the resources without further confirmation.|

<span id="cloudsite-detail"></span>
### `detail`

`cloudsite detail [apex-domain]`

Prints details for the indicated site.

#### `detail` options

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The domain of the site to detail.|

<span id="cloudsite-document"></span>
### `document`

`cloudsite document <options>`

Generates self-documentation in Markdown format.

#### `document` options

|Option|Description|
|------|------|
|`--section-depth`|An integer indicating initial header 'depth', where '1' means start with an 'H1/#' section header, '2' means start with an 'H2/##' section header, etc. This is useful when the documentation is embedded in other docs.|
|`--title`|The title of the top level section header.|

<span id="cloudsite-get-iam-policy"></span>
### `get-iam-policy`

`cloudsite get-iam-policy <options>`

Prints an IAM policy suitable for operating cloudsite.

#### `get-iam-policy` options

|Option|Description|
|------|------|
|`--with-instructions`|When set, will print instructions for creating the policy along with the policy.|

<span id="cloudsite-import"></span>
### `import`

`cloudsite import <options> [domain-and-stack]`

Generates a site database based on currently deployed site stacks.

#### `import` options

|Option|Description|
|------|------|
|`[domain-and-stack]`|(_main argument_,_required_) The domain and stack are specified as positional parameters, in either order.|
|`--common-logs-bucket`|Specifies the common logs bucket name. This is only necessary if there are multiple candidates, otherwise cloudsite can usually guess. Set to 'NONE' to suppress guessing and assume there is on common logs bucket.|
|`--confirmed`|If set, will overwrite any group or policy name in the DB if a new group or policy name is provided. Will otherwise initiate interactive confirmation.|
|`--group-name`|The name to record for the SSO group. It will record the given name if no name is currently in the DB. With '--confirmed' set, this will override any existing name. Otherwise, it will initiate interactive confirmation if a name is already in the DB.|
|`--policy-name`|The name to record for the Cloudsite policy. It will record the given name if no name is currently in the DB. With '--confirmed' set, this will override any existing name. Otherwise, it will initiate interactive confirmation if a name is already in the DB.|
|`--refresh`|By defaualt, cloudsite will refuse to overwrite existing site DB entries. if '--refresh' is true, then it will update/refresh the existing entry.|
|`--region`|Specifies the region where the stack is to be found.|
|`--source-path`|Local path to the static site root.|
|`--source-type`|May be either 'vanilla' or 'docusaurus', otherwise process will attempt to guess.|

<span id="cloudsite-list"></span>
### `list`

`cloudsite list <options>`

Lists the sites registered in the local database.

#### `list` options

|Option|Description|
|------|------|
|`--all-fields`|Includes all fields in the output.|

<span id="cloudsite-plugin-settings"></span>
### `plugin-settings`

`cloudsite plugin-settings [subcommand]`

Command group for managing plugin settings.

#### `plugin-settings` options

|Option|Description|
|------|------|
|`[subcommand]`|(_main argument_,_required_) The subcommand to execute.|


#### Subcommands

- [`set`](#cloudsite-plugin-settings-set): Sets and deletes the specified options.
- [`show`](#cloudsite-plugin-settings-show): Displays the plugin settings for the specified site.

<span id="cloudsite-plugin-settings-set"></span>
##### `set`

`cloudsite plugin-settings set <options> [apex-domain]`

Sets and deletes the specified options.

###### `set` options

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The apex domain of the site to configure.|
|`--confirmed`|When entirely deleting (disabling) a plugin, you must either confirm interactively or provide the '--confirmed' option.|
|`--delete`|When set, then deletes the setting. Incompatible with the '--value' option. To delete all plugin settings (disable the plugin), set '--name' or '--option' to the bare plugin name; e.g.: --value aPlugin.|
|`--name`|The option name.|
|`--option`|A combined name-value pair of plugin options in the form of: &lt;name&gt;:&lt;value&gt;. Can be used multiple times. When `--delete` is set, then the value is ignored and can be left blank.|
|`--value`|The setting value. Incompatible with the '--delete' option.|

<span id="cloudsite-plugin-settings-show"></span>
##### `show`

`cloudsite plugin-settings show [apex-domain]`

Displays the plugin settings for the specified site.

###### `show` options

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The apex domain of the site whose settings are to be displayed.|

<span id="cloudsite-reminders"></span>
### `reminders`

`cloudsite reminders [subcommand]`

Command group for managing reminders.

#### `reminders` options

|Option|Description|
|------|------|
|`[subcommand]`|(_main argument_,_required_) The subcommand to execute.|


#### Subcommands

- [`list`](#cloudsite-reminders-list): List currently active reminders.

<span id="cloudsite-reminders-list"></span>
##### `list`

`cloudsite reminders list`

List currently active reminders.

<span id="cloudsite-update"></span>
### `update`

`cloudsite update <options> [apex-domain]`

Updates a website content and/or infrastructure.

#### `update` options

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The apex domain identifying the site.|
|`--do-billing`|Limits updates to billing related matters (cost allocation tags) and other other specified updates.|
|`--do-content`|Limits update to site content and any other specified updates.|
|`--do-dns`|Limits update to DNS entries and any other specified updates.|
|`--do-stack`|Limits update to stack infrastructure and any other specified updates.|
|`--no-build`|Supresses the default behavior of building before updating the site.|
|`--no-cache-invalidation`|Suppresses the default behavior of invalidating the CloudFront cache after the files are updated. Note that invalidation events are chargeable thought at the time of this writing, each account gets 1,000 free requests per year.|

<span id="cloudsite-verify"></span>
### `verify`

`cloudsite verify <options> [apex-domain]`

Verifies the site is up and running and that the stack and content are up-to-date.

#### `verify` options

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The domain of the site to verify.|
|`--check-content`|If set, then checks content and skips other checks unless also specifically specified.|
|`--check-site-up`|If set, then checks that the site is up and skips other checks unless also specifically specified.|
|`--check-stack`|If set, then checks for stack drift and skips other checks unless also specifically specified.|



