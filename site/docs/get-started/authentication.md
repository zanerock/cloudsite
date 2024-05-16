---
sidebar_position: 5
description: Instructions on authenticating Cloudsite with AWS.
---
# Authentication

Cloudsite must be authenticated with AWS to do its work. We set up the necessary credentials in a two step process.

First, we create _access keys_. Cloudsite then uses the access keys and your AWS root account to set up a dedicated account with limited permissions using _single sign-on (SSO) authentication_. This is much more secure, and once set up, Cloudsite will delete the access keys.

The time limited SSO credentials are only valid for a set period of time (4 hours by default). This means that even if your computer is compromised, your AWS account is still safe so long as the credentials have expired. And even if an attacker manages to get ahold of valid SSO credentials, their access will still end when the SSO session times out.

## Initial authentication with access keys

As [discussed up top](#top), we start by creating access keys. Access keys are easier to setup than SSO authentication, but because they grant permanent access to your account, they are less secure. These keys will be deleted once [single sign-on authentication](#single-sign-on-authentication) is set up.

1. Follow the instructions to [Install or update to the latest version of the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/get-started-install.html).
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