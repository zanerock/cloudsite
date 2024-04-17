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
   ```
   aws configure
   ```
   And copy+paste the access key ID and secret as prompted.

You can test the access keys by executing:
```
aws iam get-account-summary
```

### Set up SSO authentication

Now, with keys in place, we can hand the action over to the tool to set up the more secure SSO based authentication.

1. Execute:
   ```
   cloudsite configuration setup-sso --user-email your-email@foo.com --defaults
   ```
   If you want to tinker around with what enerything is named, just leave off the `--defaults` and you will enter an interactive QnA.
2. Once the above command completes, check your email at the address you provided and look for the user invite email. Click on the confirmation and set up your account password.
3. Finally, to create local credentials the cloudsite tool can use, execute:
   ```
   aws sso login --profile cloudsite-manager
   ```
   You're now ready to use the tool! (Note: if you changed the name of the SSO profile, use that name. 'cloudsite-manager' is the default profile name.)

### Integrating with an existing SSO instance

This section is for users that already have a single sign-on instance. If you're starting fresh, refer to the previous sections. You can still use the tool to set up the specific permission set and then create or tie in with an existing user and group.

1. Execute the base command _without_ the `--defaults` option:
   ```
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
