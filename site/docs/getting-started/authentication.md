---
sidebar_position: 2
description: Instructions on authenticating Cloudsite with AWS.
---
# Authentication

Cloudsite works by setting up and managing infrastructure on the AWS cloud. In order to do this, Cloudsite uses local _credentials_ which allow it to act on your behalf.

We work with two kinds of credentials. Initially, we create _access keys_ because it's easy. Cloudsite then uses those access keys to set up _single sign-on (SSO) authentication_ which creates much more secure time limited credentials. The original access keys are then deleted.

The time limited SSO credentials are only valid for a set period of time (4 hours by default). This means that even if your computer is compromised, your AWS account is still safe so long as the credentials have expired. And even if an attacker manages to get ahold of valid SSO credentials, their access will still end when the SSO session times out.

## Sign up for an AWS root account

Amazon Web Services (AWS) is a multi-user environment, so when you sign up you're creating the "root" account. If you ever need to, you could add additional users, each with different permissions and roles.

### Create a dedicated email address (optional)

If you are using Cloudsite for your own websites, it's fine to use your personal email address for the root account. If you're setting things up for a company, you'll want to create an email alias or that can be assigned (and potentially re-assigned later) to the root account manager. E.g.: 'awsroot@your-domain.com'.

- [Create an email alias in Google Workspace.](https://apps.google.com/supportwidget/articlehome?hl=en&article_url=https%3A%2F%2Fsupport.google.com%2Fa%2Fanswer%2F33327%3Fhl%3Den&assistant_event=welcome&assistant_id=usermasterbot&product_context=33327&product_name=UnuFlow&trigger_context=a)
- [Create an email alias in Microsoft Outlook.](https://support.microsoft.com/en-us/office/add-or-remove-an-email-alias-in-outlook-com-459b1989-356d-40fa-a689-8f285b13f1f2)
- [Create an email alias in Zoho.](https://www.zoho.com/mail/how-to/create-email-alias.html)
- [Create an email alias in ProtonMail.](https://proton.me/support/creating-aliases#:~:text=1.,ending%20from%20the%20dropdown%20menu.)

### Create the root account

1. Navigate to the [Amazon Web Services (AWS) homepage](https://aws.amazon.com/free/).
2. Click 'Create a Free Account'.
3. Click 'Create a new AWS account'.
4. Enter the email address to use for the root account and fill out the required information.

## Initial authentication with access keys

As [discussed up top](#top), we start by creating access keys. Access keys are easier to setup than SSO authentication, but because they grant permanent access to your account, they are less secure. So we use access keys for the initial setup, and then Cloudsite will delete them once [single sign-on authentication](#single-sign-on-authentication) is set up.

1. Follow the instructions to [Install or update to the latest version of the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).
2. Log into AWS as the root user or, if you have one, a super-admin account.
3. Click on the account name in the upper right-hand corner and select 'Security credentials'.
4. Under the 'Access keys' section, select 'Create access key'. Acknowledge and click 'Next' if you get a warning.
5. [From a terminal](./installation#terminal-commands), execute:
   ```
   aws configure
   ```
   Copy+paste the access key ID and secret as prompted.

## Single sign-on authentication

The single sign-on (SSO) setup process creates a new account with limited permissions specifically for Cloudsite to use. Unlike with access keys, SSO authentication is time limited. The limited access and time limited authentication make the SSO account far more secure.

### Basic setup

For a basic setup, simply execute:

```bash
cloudsite configuration setup-sso --defaults
```

You will then be asked for the account email and user family+given names. These would typically be your own email and names.

### SSO setup options

If you want a little more control over things, you can set the setup options two ways:

1. Leave off the `--defaults` option and the tool will ask you to provide values for all the setup options.
2. Refer to the [`cloudsite configuration setup-sso` command line reference](/docs/user-guides/command-line-reference#cloudsite-configuration-setup-sso) and set the options on the command line.

You can combine these two approaches; Cloudsite will query you for any options not set on the command line.

### Authenticate with SSO

Once SSO authentication is set up, you actually authenticate by executing:
```bash
aws sso login --profile cloudsite-manager # replace with the name of the SSO profile if non-default
```

This will create a set of time-limited SSO session credentials that Cloudsite can use.