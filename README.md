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

If you appreciate this project, you can support us on [Patreon @zanecodes](https://patreon.com/zanecodes). We also provide support on [our discord channel](https://discord.gg/QWAav6fZ5C).

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
  "pluginSettings": {
    "contactHandler": {
      "path": "/contact-handler",
      "emailFrom": "contactform@your-website-domain.com"
    }
  }
}

create({ siteInfo }) // siteInfo gets updated with additional info as the site is created

console.log('Final site info:\n' + JSON.stringify(siteInfo))
// you'll probably want to save 'siteInfo' somewhere for future operations on the same site
```

## AWS authentication

Cloudsite works by setting up AWS infrastructure within your own AWS account. There are two basic methods to authenticate: access keys and SSO login. Of the two, SSO login is recommended by AWS and is generally the safer alternative; access keys are a less secure method in that the access keys persist on your hard drive so if your computer is compromised, your AWS account would be vulnerable. Access keys, however, are a little easier/quicker to set up.

If you aren't in a hurry, you might want to set up SSO authentication to start with. Otherwise, you can [setup access key authentication](#authenticating-with-api-keys) to get started quickly and then set up [SSO authentication](#sso-authentication) later (and then delete + disable your access keys).

### Sign up for your AWS account

If you don't already have one, the first step is to create your AWS root account.

1. If you are working on behalf of an organization and have the ability to create email aliases, we suggest you first create 'awsroot@your-domain.com' and use that to sign up.
2. Navigate to [aws.amazon.com](https://aws.amazon.com/).
3. Click 'Create an AWS Account' or 'Create a Free Account'.
4. Fill out the required information.

### SSO authentication

SSO authentication uses the new [AWS Identity Center](https://us-east-1.console.aws.amazon.com/singlesignon/home) to enable single-sign on across multiple AWS accounts. SSO is also integrated with the `aws` CLI tool and is the method by which we can create time-limited session credentials.

#### Set up the CloudSiteManager policy

1. Log into your AWS root account in the [AWS console](https://aws.amazon.com).
2. In the 'Services' bar up top, search for 'IAM' and select that service or [click here](https://us-east-1.console.aws.amazon.com/iam/home).
3. Select 'Policies' from the left hand menu options.
4. Select 'Create policy'.
5. Select the 'JSON' option.
6. From the command line, execute:
   ```bash
   cloudsite get-iam-policy
   ```
7. Copy the output from the terminal and replace the JSON text in the Policy editor with the text from the terminal.
8. Click 'Next'.
9. Under 'Policy name' enter 'CloudSiteManager' and click 'Create policy'.

#### Create SSO user, group, and set permissions

First, we need to create your SSO user. It's considered best practice to assign permissions to groups and then add users those groups, so that's what we're going to do.

1. Log into your AWS root account in the [AWS console](https://aws.amazon.com).
2. In the 'Services' bar up top, search for 'IAM Identity Center' and select that service or [click here](https://us-east-1.console.aws.amazon.com/singlesignon/home).
3. From the left-hand menu of AWS Identity Center, select 'Users'.
4. Select 'Add user'.
5. Fill out the 'Primary information'. This is your account, so choose your own username and use your personal email address. You're welcome to fill out additional fields if you like. When finished, click 'Next'.
6. We'll create the group in a second, so just click 'Next' on the 'Add users to groups' page.
7. Review the information and click 'Add user'.
8. From the left-hand menu, select 'Groups'.
9. Select 'Create group'.
10. For group name, enter 'cloudsite-managers' (or whatever you prefer). In the 'Add users to group' section, click the checkmark by the user you just created.
11. From the left-hand menu, select 'Permission sets'.
12. Under 'Types', select 'Custom permission set' and then hit 'Next'.
13. Expand the 'Customer Managed Policies' section and click 'Attach policies'.
14. Where it says 'Enter policy names', enter 'CloudSiteManager' and hit next.
15. On the 'Specify permission set details' page, under 'Permission set name', enter 'CloudSiteManager'. When done, hit 'Next'.
16. Review and click 'Create'.
17. From the left-hand menu, select 'AWS accounts'.
18. You should see your root account listed. Click the checkbox next to the root account and click 'Assign users or groups'.
19. Select the 'Cloudsite managers' group you just created (or whatever you called it).
20. On the 'Assign permission sets' page, select 'PowerUserAccess' and click 'Next'.
21. Review and click 'Submit'.
22. Just to make things a little nicer, let's rename your SSO access portal page. On the right hand side, in the 'Settings summary' box, click 'Edit' next to 'Instance name'.
23. Choose a (free) instance name; this could be based on your own name or your organization's. We used 'liquid-labs'.
24. You should receive an email titled something like 'Invitation to join AWS IAM Identity Center'. Open that email and click the 'Accept invitation'. This will take you to AWS Identity Center and ask you to create a password for the account.

#### Local SSO configuration and authentication

1. Follow the instructions to [Install or update to the latest version of the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).
2. You can follow [Configure the AWS CLI to use IAM Identity Center token provider credentials with automatic authentication refresh](https://docs.aws.amazon.com/cli/latest/userguide/sso-configure-profile-token.html#sso-configure-profile-token-auto-sso), which is summarized in the following steps.
3. Have your [IAM Identity Center](https://us-east-1.console.aws.amazon.com/singlesignon/home) page open.[^1]
4. Run the command `aws configure sso`
   1. Choose a 'session name', we called ours 'liquid-labs-sso'.
   2. For the 'SSO Start URL', copy your 'AWS access portal URL' from IAM Identity Center 'Settings summary' on the right hand side of the dashboard page.
   3. For the 'SSO region', copy the value from 'Region' ID from the 'Settings summary' section. It'll be something like 'us-east-1'.
   4. For 'SSO registration scopes', accept the default 'sso:account:access'.
   5. At this point, a browser window should open and ask you to log in as the SSO user we created earlier. Log in and start your SSO session.
   6. You should get a message that you will be using the 'PowerUserAccess' role we created earlier.
   7. Next, you should be asked for the 'CLI default client Region'. We recommend 'us-east-1' (regardless of the region where your IAM Identity Center instance resides).[^2]
   8. For the 'CLI default output format', you can accept the default of 'None'.
   9. For the 'CLI profile name', enter something memorable. We used 'll-power-user'.
5. Now you're all set. From now on, just execute the following to create temporary session credentials `cloudsite` can use:
   ```bash
   aws sso login --profile your-profile-name
   ```
   Replace 'your-profile-name' with the name of the profile created in the previous step.

You're now ready to use the `cloudsite` CLI tool. In future, you need only execute the `aws sso login --profile your-profile-name` command prior to using the `cloudsite` command or if your session times out.

[^1]: If you created your IAM Identity Center instance in a different region (than 'us-east-1'), you'll have to select the proper region. AWS provides an explanation and a link to your instance if you're in the wrong region.

[^2]: This is just because the Certificate Manager service—which issues your site's SSL certificates—only operations out of the 'us-east-1' region. It should be possible to create your site in any region, but having all the infrastructure in one region is helpful and with the use of CDN, it shouldn't matter too much which region the rest of the infrastructure resides.

### Authenticating with access keys

As an alternate method to setting up SSO, you can also set up access keys. You don't need to both unless you're setting up SSO authentication to replace access keys authentication.

As mentioned, access keys are considered a bit less safe since anyone that gets ahold of your access keys would have access to your AWS account. For most individuals, access keys are reasonable alternative.

We're going to start by following best practices and creating a group. We'll then add permissions to that group. Next, we create a non-root user and add them to the group we just created. Finally, we'll create access keys which we can use for local authentication.

1. First, navigate to the [AWS console](https://us-east-1.console.aws.amazon.com/console/home) (and log in if necessary).
2. In the 'Services' search in the upper left-hand side, search for 'IAM' and click the service. (Here, you want plain 'IAM', _NOT_ 'IAM Identity Center'.)
3. From the left-hand side, select 'User groups' and click 'Create group'.
4. For the group name, we recommend something like 'website-managers', but feel free to name it whatever you like.
5. In the 'Attach permission policies' section, search for 'PowerUserAccess'. Find the 'PowerUserAccess' policy in the list and click the checkbox next to it.
6. Click 'Create group'.
7. From the left-hand side, select 'Users'. Enter the 'User name'; this could be your own username or something like 'website-manager'.
8. On the 'Set permissions' page, in the 'User groups' section, click the checkbox next to the group we just created. Then click 'Next'.
9. Review and click 'Create user'.
10. Select the 'Users' option from the left-hand menu. (It's probably already selected.)
11. Click on the user we just created.
12. In the details section (below 'Summary'), click the 'Security credentials' tab.
13. Scroll down to 'Access keys' and click 'Create access key'.
14. For 'Use case', select 'Local code'. Click the "I understand" checkbox below and hit 'Next'.
15. Click 'Create access key'. Keep the next page, 'Retrieve access keys' open!
16. Create (or modify) the file `~/.aws/credentials` with the following text:
    ```
    [default]
    aws_access_key_id = ABCDEFGHIJKLMOP
    aws_secret_access_key = abcdefghijk123456789
    ```
    Copy the 'Access key' from the 'Retrieve access keys' page and replace the value for 'aws_access_key_id'. Do the same with 'Secrete access key' from the 'Retrieve access keys' page and replace the value for 'aws_secrete_access_key'.

The `cloudsite` tool will now use your the above configured access key by default.

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
```## Command reference

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
- [`detail`](#cloudsite-detail): Prints details for the indicated site.
- [`get-iam-policy`](#cloudsite-get-iam-policy): Prints an IAM policy suitable for operating cloudsite.
- [`import`](#cloudsite-import): Generates a site database based on currently deployed site stacks.
- [`list`](#cloudsite-list): Lists the sites registered in the local database.
- [`plugin-settings`](#cloudsite-plugin-settings): Sets (or deletes) a site option.
- [`update`](#cloudsite-update): Updates a website content and/or infrastructure.
- [`verify`](#cloudsite-verify): Verifies the site is up and running and that the stack and content are up-to-date.

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
###### `cloudsite configuration show <options>`

Displays the current configuration.

___`show` options___

|Option|Description|
|------|------|
|`--format`|Sets the format for the output. May be 'terminal' (default), 'text', 'json', or 'yaml'.|

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
|`--option`|A combined name-value pair: <name>:<value>. Can be used multiple times. With '--delete', the value portion is ignored and can be omitted, e.g.: '--option <name>'.|
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

<span id="cloudsite-detail"></span>
#### `cloudsite detail <options> [apex-domain]`

Prints details for the indicated site.

##### `detail` options

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The domain of the site to detail.|
|`--format`|Sets the format for the output. May be 'terminal' (default), 'text', 'json', or 'yaml'.|

<span id="cloudsite-get-iam-policy"></span>
#### `cloudsite get-iam-policy <options>`

Prints an IAM policy suitable for operating cloudsite.

##### `get-iam-policy` options

|Option|Description|
|------|------|
|`--with-instructions`|When set, will print instructions for creating the policy along with the policy.|

<span id="cloudsite-import"></span>
#### `cloudsite import <options> [domain-and-stack]`

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
#### `cloudsite list <options>`

Lists the sites registered in the local database.

##### `list` options

|Option|Description|
|------|------|
|`--all-fields`|Includes all fields in the output.|
|`--format`|Sets the format for the output. May be 'terminal' (default), 'text', 'json', or 'yaml'.|

<span id="cloudsite-plugin-settings"></span>
#### `cloudsite plugin-settings <options> [apex-domain]`

Sets (or deletes) a site option.

##### `plugin-settings` options

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The apex domain identifying the site.|
|`--confirmed`|When entirely deleting (disabling) a plugin, you must either confirm interactively or provide the '--confirmed' option.|
|`--delete`|When set, then deletes the setting. Incompatible with the '--value' option. To delete all plugin settings (disable the plugin), set '--name' or '--option' to the bare plugin name; e.g.: --value aPlugin.|
|`--name`|The option name.|
|`--option`|A combined name-value pair: <name>:<value>. Can be used multiple times. With '--delete', the value portion is ignored and can be omitted, e.g.: '--option <name>'.|
|`--value`|The setting value. Incompatible with the '--delete' option.|

<span id="cloudsite-update"></span>
#### `cloudsite update <options> [apex-domain]`

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
#### `cloudsite verify <options> [apex-domain]`

Verifies the site is up and running and that the stack and content are up-to-date.

##### `verify` options

|Option|Description|
|------|------|
|`[apex-domain]`|(_main argument_,_required_) The domain of the site to verify.|
|`--check-content`|If set, then checks content and skips other checks unless also specifically specified.|
|`--check-site-up`|If set, then checks that the site is up and skips other checks unless also specifically specified.|
|`--check-stack`|If set, then checks for stack drift and skips other checks unless also specifically specified.|
|`--format`|Sets the format for the output. May be 'terminal' (default), 'text', 'json', or 'yaml'.|



## Known limitations

- The permissions used by the 'ContactHandler' Lambda function are overly broad and need to be narrowed. See [issue #34](https://github.com/liquid-labs/cloudsite/issues/34).

## Contributing

Plase feel free to submit any [bug reports or feature suggestions](https://github.com/liquid-labs/cloudsite/issues). You're also welcome to submit patches of course. We don't have a full contributors policy yet, but you can post questions on [our discord channel](https://discord.gg/QWAav6fZ5C). It's not monitored 24/7, but you should hear back from us by next business day generally.

## Support and feature requests

The best way to get free support is to [submit a ticket](https://github.com/liquid-labs/cloudsite/issues). You can also become a patron for as little as $1/month and get priority support and request new feature on [all Liquid Labs open source software](https://github.com/liquid-labs). You can get these benefits and [support our work at patreon.com/zanecodes](https://www.patreon.com/zanecodes).
