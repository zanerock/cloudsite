---
sidebar_position: 2
---

# Quickstart

## Installation

Cloudsite is a [terminal program](/docs/getting-started/installation#terminal-commands) which requires [Node and NPM  to be installed](/docs/getting-started/installation#checking-and-installing-node-and-npm). (Click on the links for help.)

Open a terminal and install using:
```bash
npm i -g cloudsite # or yarn i -g cloudsite
```

## Setup & deploy

1. Sign up for a free [AWS account](https://aws.amazon.com/). ([Click here for more details.](/docs/getting-started/authentication#sign-up-for-an-aws-root-account))
2. Create API access keys:
   1. Follow the instructions to [Install or update to the latest version of the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).
   2. Log into AWS as the root user or, if you have one, a super-admin account.
   3. Click on the account name in the upper right-hand corner and select 'Security credentials'.
   4. Under the 'Access keys' section, select 'Create access key'. Acknowledge and click 'Next' if you get a warning.
   5. Execute:
      ```
      aws configure
      ```
      Copy+paste the access key ID and secret as prompted.
3. Deploy your website by executing:
    ```bash
    cloudsite create your-domain.com --source-path /path/to/website/files
    ```
    Refer to [your first site](/docs/getting-started/your-first-site) for details on deploying your first website.

## Secure your account

We used API access keys above to get our site up and running quickly. The problem with API access keys is that if anyone ever got access to them, they would gain control of your AWS account. To prevent this, we setup time limited credentials using AWS single sign-on (SSO). Don't worry, the tool does most of the work for you.

1. Execute:
   ```bash
   cloudsite configuration setup-sso --defaults
   ```
   You will then be asked for the account email and user family+given names.
2. Once the above command completes, go back to the AWS console (as the root or a super-admin user) and select the IAM service.
3. Find the newly created user under 'Users' and select 'Send verification email'.
4. Finally, to create local credentials the cloudsite tool can use, execute:
  ```bash
  aws sso login --profile cloudsite-manager
  ```

These credentials will last for 4 hours by default are renewed as needed using the `aws sso login` command. After the SSO setup completes, cloudsite deletes the API access keys.