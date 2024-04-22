---
sidebar_position: 2
---

# Quickstart

## Installation

Install using:
```bash
npm i -g cloudsite # or yarn i -g cloudsite
```

For [instructions on installing NPM, refer here](/docs/user-guides/installing-npm).

## Setup & deploy

1. Sign up for a free [AWS account](https://aws.amazon.com/).
2. Create API access keys:
   1. Follow the instructions to [Install or update to the latest version of the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).
   2. From the root or super-admin account, click on the account name in the upper right-hand corner and select 'Security credentials'.
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

## Secure your account

We used API access keys above to get our site up and running quickly. The problem with API access keys is that if anyone ever got access to them, they would gain control of your AWS account. To prevent this, we setup time limited credentials using AWS single sign on (SSO). Don't worry, the tool does most of the work for you.

1. Execute:
  ```
  cloudsite configuration setup-sso --user-email your-email@foo.com --defaults
  ```
  Once complete, this will by default delete the API access keys from AWS to prevent further usage.
2. Once the above command completes, go back to the AWS console (as the root or a super-admin user) and select the IAM service.
3. Find the newly created user under 'Users' and select 'Send verification email'.
4. Finally, to create local credentials the cloudsite tool can use, execute:
  ```
  aws sso login --profile cloudsite-manager
  ```

These credentials will last for 4 hours by default are renewed as needed using the `aws sso login` command.