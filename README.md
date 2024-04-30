# Cloudsite

Low cost, high performance cloud based website hosting manager. Cloudsite features CDN integration, DoS protection, free SSL certificates, and contact forms. In addition, since Cloudsite use "pay as you go" cloud infrastructure, hosting costs are generally well below typical market rates.

- [Installation](#installation)
- [Usage](#usage)
- [AWS authentication](#aws-authentication)
- [Plugins](#plugins)
- [Updating your site](#updating-your-site)
- [Command reference](#command-reference)
- [Known limitations](#known-limitations)
- [Contributing](#contributing)
- [Support and feature requests](#support-and-feature-requests)

If you appreciate this project, you can support us on [Patreon @liquidlabs](https://patreon.com/liquidlabs). We also provide support on [our discord channel](https://discord.gg/QWAav6fZ5C).

## Installation

### CLI installation

```bash
npm i -g cloudsite
```

### Library installation

```bash
npm i --omit peer cloudsite
```

All the peer dependencies are specific to the CLI, so if you're not using the CLI, you can omit them.

## Usage

### CLI usage

```bash
# authenticate with AWS; see below for options
aws sso login --profile your-sso-profile 

cloudsite configuration initialize # walks you through setup questions
# deploys a robust, high performance static site in the cloud
cloudsite create your-domain.com --source-path . # see 'Plugins' for additional options
cloudsite update your-domain.com # updates site content
cloudsite destroy your-domain.com # destroys site infrastructure
```

See [Command reference](#command-reference) for all the CLI commands.

### Library usage

```javascript
import { create } from 'cloudsite'

const siteInfo = {
  "apexDomain": "your-website-domain.com",
  "sourceType": "docusaurus", // or 'vanilla'
  "sourcePath": "/Users/your-home-dir/path/to/website/source"
  "plugins": {
    "contactHandler": {
      "settings": {
        "path": "/contact-handler",
        "emailFrom": "contactform@your-website-domain.com"
      }
    }
  }
}

create({ siteInfo }) // siteInfo gets updated with additional info as the site is created

console.log('Final site info:\n' + JSON.stringify(siteInfo))
// you'll probably want to save 'siteInfo' somewhere for future operations on the same site
```

## AWS authentication

Cloudsite works by setting up AWS infrastructure within your own AWS account. We set up authentication in two steps. First, we use API access keys to quickly set up access and then we use the tool to set up a dedicated account with limited authorizations using the recommended single sign-on (SSO) method.

### Create your AWS root account

If you don't already have one, the first step is to create your AWS root account.

1. If you are working on behalf of an organization and have the ability to create email aliases, we suggest you first create 'awsroot@your-domain.com' and use that to sign up.
2. Navigate to [aws.amazon.com](https://aws.amazon.com/).
3. Click 'Create an AWS Account' or 'Create a Free Account'.
4. Fill out the required information.

### Set up access keys

The access keys will allow the tool to operate under your root (or super-admin) account in order to set up SSO operation. At the end of it all, the tool can delete the access keys for you.

1. Follow the instructions to [Install or update to the latest version of the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).
2. Log into your root account (or super-admin account if you have one).
3. Click on the account name in the upper right-hand corner and select 'Security credentials'.
4. Under the 'Access keys' section, select 'Create access key'. You may get a warning; if you do, acknowledge and click next.
5. Execute:
   ```bash
   aws configure
   ```
   And copy+paste the access key ID and secret as prompted.

You can test the access keys by executing:
```bash
aws iam get-account-summary
```

### Set up SSO authentication

Now, with keys in place, we can hand the action over to the tool to set up the more secure SSO based authentication.

1. Execute:
   ```bash
   cloudsite configuration setup-sso --user-email your-email@foo.com --defaults
   ```
   If you want to tinker around with what enerything is named, just leave off the `--defaults` and you will enter an interactive QnA.
2. Once the above command completes, go back to the AWS console (as the root or a super-admin user) and select the IAM service.
3. Find the newly created user under 'Users' and select 'Send verification email'.
4. Finally, to create local credentials the cloudsite tool can use, execute:
   ```
   aws sso login --profile cloudsite-manager
   ```
   Note: if you changed the name of the SSO profile, use that name. 'cloudsite-manager' is the default profile name.

You're now ready to use the tool! From the CLI:
```bash
cloudsite create your-domain.com --source-path /path/to/website/files
```

### Integrating with an existing SSO instance

This section is for users that already have a single sign-on instance. If you're starting fresh, refer to the previous sections. You can still use the tool to set up the specific permission set and then create or tie in with an existing user and group.

1. Execute the base command _without_ the `--defaults` option:
   ```bash
   cloudsite configuration setup-sso --user-email your-email@foo.com
   ```
2. When asked about the group, you can name an existing group and the tool will tie the cloudsite permissions set to that group.
3. When asked about the user name, you can name an existing user and the tool will add that user to the previously specified group.

You can also create a new group and user in your existing identity store instance.

## Plugins

Cloudsite uses a simple plugin system and at the moment, it's more like "optional features" than full plugins, but it'll get there. There are currently two plugins supported: contact form and CloudFront logging.

### Contact form

Supports a single contact with set fields. [User defined fields will be supported in a future version.](https://github.com/liquid-labs/cloudsite/issues/69). Currently, the supported fields are:

- `given_name`,
- `family_name`,
- `email`,
- `topics`, and
- `message`.

When submitted, the form data will be saved in a DynamoDB table and the information will be optionally mailed to a user defined email address. The form processing routine supports both base64 form encoded data and a JSON body.

<span id="contact-form-configuration-options"></span>
#### Configuration options

- `contactHandler.emailFrom` _(string)_: The SES verified email to use when sending a submission notification email.
- `contactHandler.emailTo` _(string)_: The optional target email. If not provided, `emailFrom` will be used for both the sender and target.
- `contactHandler.path` _(string)_: The absolute URL path (beginning with `/`) where the form submission handler is called. Use this path in the form action, or JS `fetch` call and the `POST` method.

<span id="contact-form-usage"></span>
#### Usage

1. Set up the form on your website. Set the submit handler to whatever you like (we use '/contact-handler'). We will provide at least one template site for this soon. Until then, if you want immediate support, hit us up [on discord](https://discord.gg/QWAav6fZ5C).
2. Activate AWS Simple Email Service (SES).
   - Sign in to the AWS Management Console and open the Amazon SES console at https://console.aws.amazon.com/ses/.
   - ___Make sure you're setting up SES in the same region as your site.___ This will be `us-east-1` unless you specified a different `--region` option when you create/created the site.
   - Select 'Get started' (or 'Get set up' maybe) from the SES console home page and the wizard will walk you through the steps of setting up your SES account.
3. It is recommended that you not use your personal email directly and instead create an alias your account. Then use the alias as the destination account.
4. To create a site infrastructure with contact form support, you must at a minimum define `contactHandler.emailFrom` and `contacteHandler.path`. This can be done during site creation like so (can be combined with other options):
   ```bash
   cloudsite create your-domain.com --source-path . \
     --option contactHandler.path:/contact-handler \
     --option contactHandler.emailFrom:contactform@your-domain.com
   ```
5. Include the optional `contactHandler.emailTo` setting if you want to send the email to a different address than the "from" email.

See also [Updating your site](#updating-your-site).

### CloudFront logging

Enables logging of CloudFront events to an S3 bucket. The infrastructure will create a common logging bucket to receive the logs. Currently, the bucket name is hard coded and will be something like 'your-domain-com-common-logs'.

<span id="cloudfront-logging-configuration-options"></span>
#### Configuration options

- `cloudfrontLogs.includeCookies` _(boolean)_: Indicates whether to include cookie data in the logs.

<span id="cloudfront-logging-usage"></span>
#### Usage

To create infrastructure that includes CloudFront event logs, use the following command (can be combined with other options):
```bash
cloudsite create your-domain.com --source-path . \
  --option cloudfrontLogs.includeCookies:true # or false
```

Setting the option, to either 'true' or 'false' is what enables the CloudFront logs.

See also [Updating your site](#updating-your-site)

## Updating your site

You can update your site, to add, remove, or reconfigure plugins/options with the 'pluggin-settings' command. For instance, to activate contact form support, you could execute:

```bash
cloudite plugin-settings your-domain.com \
  --option contactHandler.path:/contact-handler \
  --option contactHandler.emailFrom:contactform@your-domain.com
```

and then run:

```bash
cloudsite update your-domain.com
```

## Command reference

### Usage

`cloudsite <options> <command>`

### Main options

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

### Commands

- [`cleanup`](#cloudsite-cleanup): Attempts to fully delete partially deleted sites in the 'needs to be cleaned up' state.
- [`configuration`](#cloudsite-configuration): Command group for managing the cloudsite CLI configuration.
- [`create`](#cloudsite-create): Creates a new website, setting up infrastructure and copying content.
- [`destroy`](#cloudsite-destroy): Destroys the named site. I.e., deletes all cloud resources associated with the site.
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
#### `cleanup`

`cloudsite cleanup <options> <apex-domain>`

Attempts to fully delete partially deleted sites in the 'needs to be cleaned up' state.

##### `cleanup` options

|Option|Description|
|------|------|
|`<apex-domain>`|(_main argument_,_optional_) Specifies the site to clean up rather than trying to cleanup all pending sites.|
|`--list`|Lists the sites in need of cleaning up.|

<span id="cloudsite-configuration"></span>
#### `configuration`

`cloudsite configuration [subcommand]`

Command group for managing the cloudsite CLI configuration.

##### `configuration` options

|Option|Description|
|------|------|
|`[subcommand]`|(_main argument_,_required_) The configuration action to perform.|


##### Subcommands

- [`setup-local`](#cloudsite-configuration-setup-local): Runs the local setup wizard and updates all options. This should be used after the SSO account has been created (see 'cloudsite configuration setup-sso').
- [`setup-sso`](#cloudsite-configuration-setup-sso): Runs the SSO wizard and sets up the SSO user authentication in the IAM Identity Center.
- [`show`](#cloudsite-configuration-show): Displays the current configuration.

<span id="cloudsite-configuration-setup-local"></span>
###### `setup-local`

`cloudsite configuration setup-local`

Runs the local setup wizard and updates all options. This should be used after the SSO account has been created (see 'cloudsite configuration setup-sso').

<span id="cloudsite-configuration-setup-sso"></span>
###### `setup-sso`

`cloudsite configuration setup-sso <options>`

Runs the SSO wizard and sets up the SSO user authentication in the IAM Identity Center.

___`setup-sso` options___

|Option|Description|
|------|------|
|`--defaults`|Use the defaults were possible and skip unnecessary interactive setup.|
|`--delete`|Confirms deletion of the Access keys after setting up the SSO access. If neither '--delete' nor '--no-delete' are set, then deletion will be interactively confirmed.|
|`--group-name`|The name of the group to create or reference. This group will be associated with the permission set and user.|
|`--instance-name`|The name to assign to the newly created identity center, if needed.|
|`--instance-region`|The region in which to set up the identity center if no identity center currently set up. Defaults to 'us-east-1'.|
|`--no-delete`|Retains the Access keys after setting up SSO access.|
|`--policy-name`|The name of the policy and permission set to create or reference.|
|`--sso-profile`|The name of the local SSO profile to create.|
|`--user-email`|The primary email to associate with the user.|
|`--user-family-name`|The family name of the cloudsite management user.|
|`--user-given-name`|The given name of the cloudsite management user.|
|`--user-name`|The name of the user account to create or reference.|

<span id="cloudsite-configuration-show"></span>
###### `show`

`cloudsite configuration show`

Displays the current configuration.

<span id="cloudsite-create"></span>
#### `create`

`cloudsite create <options> <apex-domain>`

Creates a new website, setting up infrastructure and copying content.

##### `create` options

|Option|Description|
|------|------|
|`<apex-domain>`|(_main argument_,_optional_) The site apex domain.|
|`--bucket-name`|The name of the bucket to be used. If no option is given, cloudsite will generate a bucket name based on the apex domain.|
|`--no-build`|Supresses the default behavior of building before uploading the site content.|
|`--no-delete-on-failure`|When true, does not delete the site stack after setup failure.|
|`--no-interactive`|Suppresses activation of the interactive setup where it would otherwise be activated.|
|`--option`|A combined name-value pair: &lt;name&gt;:&lt;value&gt;. Can be used multiple times. With '--delete', the value portion is ignored and can be omitted, e.g.: '--option &lt;name&gt;'.|
|`--region`|The region where to create the site resources. Defaults to 'us-east-1'.|
|`--source-path`|Local path to the static site root.|
|`--source-type`|May be either 'vanilla' or 'docusaurus', otherwise process will attempt to guess.|
|`--stack-name`|Specify the name of the stack to be created and override the default name.|

<span id="cloudsite-destroy"></span>
#### `destroy`

`cloudsite destroy <options> [apex-domain]`

Destroys the named site. I.e., deletes all cloud resources associated with the site.

##### `destroy` options

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The domain of the site to delete.|
|`--confirmed`|Skips the interactive confirmation and destroys the resources without further confirmation.|

<span id="cloudsite-detail"></span>
#### `detail`

`cloudsite detail [apex-domain]`

Prints details for the indicated site.

##### `detail` options

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The domain of the site to detail.|

<span id="cloudsite-document"></span>
#### `document`

`cloudsite document <options>`

Generates self-documentation in Markdown format.

##### `document` options

|Option|Description|
|------|------|
|`--prefix`|A string to prefix to the standard output.|
|`--section-depth`|An integer indicating initial header 'depth', where '1' means start with an 'H1/#' section header, '2' means start with an 'H2/##' section header, etc. This is useful when the documentation is embedded in other docs.|
|`--title`|The title of the top level section header.|

<span id="cloudsite-get-iam-policy"></span>
#### `get-iam-policy`

`cloudsite get-iam-policy <options>`

Prints an IAM policy suitable for operating cloudsite.

##### `get-iam-policy` options

|Option|Description|
|------|------|
|`--with-instructions`|When set, will print instructions for creating the policy along with the policy.|

<span id="cloudsite-import"></span>
#### `import`

`cloudsite import <options> [domain-and-stack]`

Generates a site database based on currently deployed site stacks.

##### `import` options

|Option|Description|
|------|------|
|`[domain-and-stack]`|(_main argument_,_required_) The domain and stack are specified as positional parameters, in either order.|
|`--common-logs-bucket`|Specifies the common logs bucket name. This is only necessary if there are multiple candidates, otherwise cloudsite can usually guess. Set to 'NONE' to suppress guessing and assume there is on common logs bucket.|
|`--refresh`|By defaualt, cloudsite will refuse to overwrite existing site DB entries. if '--refresh' is true, then it will update/refresh the existing entry.|
|`--region`|Specifies the region where the stack is to be found.|
|`--source-path`|Local path to the static site root.|
|`--source-type`|May be either 'vanilla' or 'docusaurus', otherwise process will attempt to guess.|

<span id="cloudsite-list"></span>
#### `list`

`cloudsite list <options>`

Lists the sites registered in the local database.

##### `list` options

|Option|Description|
|------|------|
|`--all-fields`|Includes all fields in the output.|

<span id="cloudsite-plugin-settings"></span>
#### `plugin-settings`

`cloudsite plugin-settings [subcommand]`

Command group for managing plugin settings.

##### `plugin-settings` options

|Option|Description|
|------|------|
|`[subcommand]`|(_main argument_,_required_) The subcommand to execute.|


##### Subcommands

- [`set`](#cloudsite-plugin-settings-set): Sets and deletes the specified options.
- [`show`](#cloudsite-plugin-settings-show): Displays the plugin settings for the specified site.

<span id="cloudsite-plugin-settings-set"></span>
###### `set`

`cloudsite plugin-settings set <options> [apex-domain]`

Sets and deletes the specified options.

___`set` options___

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The apex domain of the site to configure.|
|`--confirmed`|When entirely deleting (disabling) a plugin, you must either confirm interactively or provide the '--confirmed' option.|
|`--delete`|When set, then deletes the setting. Incompatible with the '--value' option. To delete all plugin settings (disable the plugin), set '--name' or '--option' to the bare plugin name; e.g.: --value aPlugin.|
|`--name`|The option name.|
|`--option`|A combined name-value pair: &lt;name&gt;:&lt;value&gt;. Can be used multiple times. With '--delete', the value portion is ignored and can be omitted, e.g.: '--option &lt;name&gt;'.|
|`--value`|The setting value. Incompatible with the '--delete' option.|

<span id="cloudsite-plugin-settings-show"></span>
###### `show`

`cloudsite plugin-settings show [apex-domain]`

Displays the plugin settings for the specified site.

___`show` options___

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The apex domain of the site whose settings are to be displayed.|

<span id="cloudsite-reminders"></span>
#### `reminders`

`cloudsite reminders [subcommand]`

Command group for managing reminders.

##### `reminders` options

|Option|Description|
|------|------|
|`[subcommand]`|(_main argument_,_required_) The subcommand to execute.|


##### Subcommands

- [`list`](#cloudsite-reminders-list): List currently active reminders.

<span id="cloudsite-reminders-list"></span>
###### `list`

`cloudsite reminders list`

List currently active reminders.

<span id="cloudsite-update"></span>
#### `update`

`cloudsite update <options> [apex-domain]`

Updates a website content and/or infrastructure.

##### `update` options

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
#### `verify`

`cloudsite verify <options> [apex-domain]`

Verifies the site is up and running and that the stack and content are up-to-date.

##### `verify` options

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The domain of the site to verify.|
|`--check-content`|If set, then checks content and skips other checks unless also specifically specified.|
|`--check-site-up`|If set, then checks that the site is up and skips other checks unless also specifically specified.|
|`--check-stack`|If set, then checks for stack drift and skips other checks unless also specifically specified.|



## Known limitations

- The permissions used by the 'ContactHandler' Lambda function are overly broad and need to be narrowed. See [issue #34](https://github.com/liquid-labs/cloudsite/issues/34).

## Contributing

Plase feel free to submit any [bug reports or feature suggestions](https://github.com/liquid-labs/cloudsite/issues). You're also welcome to submit patches of course. We don't have a full contributors policy yet, but you can post questions on [our discord channel](https://discord.gg/QWAav6fZ5C). It's not monitored 24/7, but you should hear back from us by next business day generally.

## Support and feature requests

The best way to get free support is to [submit a ticket](https://github.com/liquid-labs/cloudsite/issues). You can also become a patron for as little as $1/month and get priority support and request new feature on [all Liquid Labs open source software](https://github.com/liquid-labs). You can get these benefits and [support our work at patreon.com/liquidlabs](https://www.patreon.com/liquidlabs).
