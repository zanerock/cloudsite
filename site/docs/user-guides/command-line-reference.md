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

- [`billing`](#cloudsite-billing): Billing group commands.
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
- [`setup`](#cloudsite-setup): Runs the initial setup wizard.
- [`sso`](#cloudsite-sso): Command group to manage single sign on users, groups, and permissions.
- [`update-contents`](#cloudsite-update-contents): Updates a website content and/or infrastructure.
- [`update-dns`](#cloudsite-update-dns): Updates the DNS entries to match the new site endpoint.
- [`update-stack`](#cloudsite-update-stack): Updates website infrastructure.
- [`users`](#cloudsite-users): Users command group
- [`verify`](#cloudsite-verify): Verifies the site is up and running and that the stack and content are up-to-date.

<span id="cloudsite-billing"></span>
### `billing`

`cloudsite billing [subcommand]`

Billing group commands.

#### `billing` options

|Option|Description|
|------|------|
|`[subcommand]`|(_main argument_,_required_) The subcommand to execute.|


#### Subcommands

- [`configure-tags`](#cloudsite-billing-configure-tags): Configures the global cost allocation tags.

<span id="cloudsite-billing-configure-tags"></span>
##### `configure-tags`

`cloudsite billing configure-tags`

Configures the global cost allocation tags.

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
- [`show`](#cloudsite-configuration-show): Displays the current configuration.

<span id="cloudsite-configuration-setup-local"></span>
##### `setup-local`

`cloudsite configuration setup-local`

Runs the local setup wizard and updates all options. This should be used after SSO accounts have been created (see 'cloudsite permissions sso create').

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

`cloudsite import <options>`

Generates a site database based on currently deployed site stacks.

#### `import` options

|Option|Description|
|------|------|
|`--apex-domain`|The apex domain of the site to import data for. If '--source-path' is not specified, it will be dynamically queried.|
|`--confirmed`|If set, will overwrite any group or policy name in the DB if a new group or policy name is provided. Will otherwise initiate interactive confirmation.|
|`--no-sso`|If set, then the SSO data import is skipped.|
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

<span id="cloudsite-setup"></span>
### `setup`

`cloudsite setup <options>`

Runs the initial setup wizard. This is safe to re-run in order to deal with cases of partial success or mid-setup errors.

#### `setup` options

|Option|Description|
|------|------|
|`--identity-store-name`|The name to assign to the newly created identity center, if needed.|
|`--identity-store-region`|The region in which to set up the identity center if no identity center currently set up. Defaults to 'us-east-1'.|
|`--no-delete-keys`|By default, if 'access keys' are created during the setup process, they will be deleted after the setup is complete. Setting this option suppresses this behavior and retains any created keys. Note that existing keys are never deleted.|
|`--sso-profile-name`|The name of the local SSO profile to create.|
|`--user-email`|The primary email to associate with the user.|
|`--user-family-name`|The family name of the cloudsite management user.|
|`--user-given-name`|The given name of the cloudsite management user.|
|`--user-name`|The name of the user account to create or reference.|
|`--key-delete`|Confirms deletion of the Access keys after setting up the SSO access. If neither '--delete' nor '--no-delete' are set, then deletion will be interactively confirmed.|
|`--no-key-delete`|Retains the Access keys after setting up SSO access.|

<span id="cloudsite-sso"></span>
### `sso`

`cloudsite sso [subcommand]`

Command group to manage single sign on users, groups, and permissions.

#### `sso` options

|Option|Description|
|------|------|
|`[subcommand]`|(_main argument_,_required_) The subcommand to execute.|


#### Subcommands

- [`detail`](#cloudsite-sso-detail): Returns a description of the SSO settings.
- [`groups`](#cloudsite-sso-groups): The SSO groups command group.

<span id="cloudsite-sso-detail"></span>
##### `detail`

`cloudsite sso detail`

Returns a description of the SSO settings.

<span id="cloudsite-sso-groups"></span>
##### `groups`

`cloudsite sso groups [subcommand]`

The SSO groups command group.

###### `groups` options

|Option|Description|
|------|------|
|`[subcommand]`|(_main argument_,_required_) The subcommand to execute.|


###### Subcommands

- [`create`](#cloudsite-sso-groups-create): Creates a new group with access to the specific domains.
- [`list`](#cloudsite-sso-groups-list): Lists the groups and their domains.

<span id="cloudsite-sso-groups-create"></span>
___`create`___

`cloudsite sso groups create <options>`

Creates a new group with access to the specific domains.

__`create` options__

|Option|Description|
|------|------|
|`--prefix`|The prefix to use for the created admin and content manager groups. E.g., a prefix of 'Foo' yields group names 'CS:Foo admins' and 'CS:Foo content managers'.|
|`--domains`|Specifies a domain to which the group has access. May be specified multiple times.|

<span id="cloudsite-sso-groups-list"></span>
___`list`___

`cloudsite sso groups list`

Lists the groups and their domains.

<span id="cloudsite-update-contents"></span>
### `update-contents`

`cloudsite update-contents <options> [apex-domain]`

Updates a website content and/or infrastructure.

#### `update-contents` options

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The apex domain identifying the site to update.|
|`--no-build`|Suppresses the default behavior of building before updating the site.|
|`--no-cache-invalidation`|Suppresses the default behavior of invalidating the CloudFront cache after the files are updated. Note that invalidation events are chargeable thought at the time of this writing, each account gets 1,000 free requests per year.|

<span id="cloudsite-update-dns"></span>
### `update-dns`

`cloudsite update-dns [apex-domain]`

Updates the DNS entries to match the new site endpoint.

#### `update-dns` options

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The apex domain identifying the site.|

<span id="cloudsite-update-stack"></span>
### `update-stack`

`cloudsite update-stack [apex-domain]`

Updates website infrastructure.

#### `update-stack` options

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The apex domain identifying the site.|

<span id="cloudsite-users"></span>
### `users`

`cloudsite users`

Users command group


#### Subcommands

- [`create`](#cloudsite-users-create): Creates a new user.

<span id="cloudsite-users-create"></span>
##### `create`

`cloudsite users create <options>`

Creates a new user. Any unspecified properties will be interactively queried.

###### `create` options

|Option|Description|
|------|------|
|`--no-error-on-existing`|Simply exits rather than raising an error if the user already exists.|
|`--group-name`|The authorization group to assign to this user.|
|`--key-delete`|Confirms deletion of the Access keys after setting up the SSO access. If neither '--delete' nor '--no-delete' are set, then deletion will be interactively confirmed.|
|`--no-key-delete`|Retains the Access keys after setting up SSO access.|
|`--user-email`|The primary email to associate with the user.|
|`--user-family-name`|The family name of the cloudsite management user.|
|`--user-given-name`|The given name of the cloudsite management user.|
|`--user-name`|The name of the user account to create or reference.|

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



hey
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

- [`billing`](#cloudsite-billing): Billing group commands.
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
- [`setup`](#cloudsite-setup): Runs the initial setup wizard.
- [`sso`](#cloudsite-sso): Command group to manage single sign on users, groups, and permissions.
- [`update-contents`](#cloudsite-update-contents): Updates a website content and/or infrastructure.
- [`update-dns`](#cloudsite-update-dns): Updates the DNS entries to match the new site endpoint.
- [`update-stack`](#cloudsite-update-stack): Updates website infrastructure.
- [`users`](#cloudsite-users): Users command group
- [`verify`](#cloudsite-verify): Verifies the site is up and running and that the stack and content are up-to-date.

<span id="cloudsite-billing"></span>
### `billing`

`cloudsite billing [subcommand]`

Billing group commands.

#### `billing` options

|Option|Description|
|------|------|
|`[subcommand]`|(_main argument_,_required_) The subcommand to execute.|


#### Subcommands

- [`configure-tags`](#cloudsite-billing-configure-tags): Configures the global cost allocation tags.

<span id="cloudsite-billing-configure-tags"></span>
##### `configure-tags`

`cloudsite billing configure-tags`

Configures the global cost allocation tags.

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
- [`show`](#cloudsite-configuration-show): Displays the current configuration.

<span id="cloudsite-configuration-setup-local"></span>
##### `setup-local`

`cloudsite configuration setup-local`

Runs the local setup wizard and updates all options. This should be used after SSO accounts have been created (see 'cloudsite permissions sso create').

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

`cloudsite import <options>`

Generates a site database based on currently deployed site stacks.

#### `import` options

|Option|Description|
|------|------|
|`--apex-domain`|The apex domain of the site to import data for. If '--source-path' is not specified, it will be dynamically queried.|
|`--confirmed`|If set, will overwrite any group or policy name in the DB if a new group or policy name is provided. Will otherwise initiate interactive confirmation.|
|`--no-sso`|If set, then the SSO data import is skipped.|
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

<span id="cloudsite-setup"></span>
### `setup`

`cloudsite setup <options>`

Runs the initial setup wizard. This is safe to re-run in order to deal with cases of partial success or mid-setup errors.

#### `setup` options

|Option|Description|
|------|------|
|`--identity-store-name`|The name to assign to the newly created identity center, if needed.|
|`--identity-store-region`|The region in which to set up the identity center if no identity center currently set up. Defaults to 'us-east-1'.|
|`--no-delete-keys`|By default, if 'access keys' are created during the setup process, they will be deleted after the setup is complete. Setting this option suppresses this behavior and retains any created keys. Note that existing keys are never deleted.|
|`--sso-profile-name`|The name of the local SSO profile to create.|
|`--user-email`|The primary email to associate with the user.|
|`--user-family-name`|The family name of the cloudsite management user.|
|`--user-given-name`|The given name of the cloudsite management user.|
|`--user-name`|The name of the user account to create or reference.|
|`--key-delete`|Confirms deletion of the Access keys after setting up the SSO access. If neither '--delete' nor '--no-delete' are set, then deletion will be interactively confirmed.|
|`--no-key-delete`|Retains the Access keys after setting up SSO access.|

<span id="cloudsite-sso"></span>
### `sso`

`cloudsite sso [subcommand]`

Command group to manage single sign on users, groups, and permissions.

#### `sso` options

|Option|Description|
|------|------|
|`[subcommand]`|(_main argument_,_required_) The subcommand to execute.|


#### Subcommands

- [`detail`](#cloudsite-sso-detail): Returns a description of the SSO settings.
- [`groups`](#cloudsite-sso-groups): The SSO groups command group.

<span id="cloudsite-sso-detail"></span>
##### `detail`

`cloudsite sso detail`

Returns a description of the SSO settings.

<span id="cloudsite-sso-groups"></span>
##### `groups`

`cloudsite sso groups [subcommand]`

The SSO groups command group.

###### `groups` options

|Option|Description|
|------|------|
|`[subcommand]`|(_main argument_,_required_) The subcommand to execute.|


###### Subcommands

- [`create`](#cloudsite-sso-groups-create): Creates a new group with access to the specific domains.
- [`list`](#cloudsite-sso-groups-list): Lists the groups and their domains.

<span id="cloudsite-sso-groups-create"></span>
___`create`___

`cloudsite sso groups create <options>`

Creates a new group with access to the specific domains.

__`create` options__

|Option|Description|
|------|------|
|`--prefix`|The prefix to use for the created admin and content manager groups. E.g., a prefix of 'Foo' yields group names 'CS:Foo admins' and 'CS:Foo content managers'.|
|`--domains`|Specifies a domain to which the group has access. May be specified multiple times.|

<span id="cloudsite-sso-groups-list"></span>
___`list`___

`cloudsite sso groups list`

Lists the groups and their domains.

<span id="cloudsite-update-contents"></span>
### `update-contents`

`cloudsite update-contents <options> [apex-domain]`

Updates a website content and/or infrastructure.

#### `update-contents` options

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The apex domain identifying the site to update.|
|`--no-build`|Suppresses the default behavior of building before updating the site.|
|`--no-cache-invalidation`|Suppresses the default behavior of invalidating the CloudFront cache after the files are updated. Note that invalidation events are chargeable thought at the time of this writing, each account gets 1,000 free requests per year.|

<span id="cloudsite-update-dns"></span>
### `update-dns`

`cloudsite update-dns [apex-domain]`

Updates the DNS entries to match the new site endpoint.

#### `update-dns` options

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The apex domain identifying the site.|

<span id="cloudsite-update-stack"></span>
### `update-stack`

`cloudsite update-stack [apex-domain]`

Updates website infrastructure.

#### `update-stack` options

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The apex domain identifying the site.|

<span id="cloudsite-users"></span>
### `users`

`cloudsite users`

Users command group


#### Subcommands

- [`create`](#cloudsite-users-create): Creates a new user.

<span id="cloudsite-users-create"></span>
##### `create`

`cloudsite users create <options>`

Creates a new user. Any unspecified properties will be interactively queried.

###### `create` options

|Option|Description|
|------|------|
|`--no-error-on-existing`|Simply exits rather than raising an error if the user already exists.|
|`--group-name`|The authorization group to assign to this user.|
|`--key-delete`|Confirms deletion of the Access keys after setting up the SSO access. If neither '--delete' nor '--no-delete' are set, then deletion will be interactively confirmed.|
|`--no-key-delete`|Retains the Access keys after setting up SSO access.|
|`--user-email`|The primary email to associate with the user.|
|`--user-family-name`|The family name of the cloudsite management user.|
|`--user-given-name`|The given name of the cloudsite management user.|
|`--user-name`|The name of the user account to create or reference.|

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



