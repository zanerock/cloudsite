This is a placeholder file. We want to capture these instructions somewhere and reference them maybe.

### SSO authentication

SSO authentication uses the new [AWS Identity Center](https://us-east-1.console.aws.amazon.com/singlesignon/home). SSO is integrated with the `aws` CLI tool and is the method by which we can create time-limited session credentials.

In general, you can still use the tool to set up the correct permissions





#### Set up the CloudsiteManager policy

1. Log into your AWS root account in the [AWS console](https://aws.amazon.com). Refer to [this section](#sign-up-for-your-aws-root-account) if you need to create a root account.
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
9. Under 'Policy name' enter 'CloudsiteManager' and click 'Create policy'.

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
14. Where it says 'Enter policy names', enter 'CloudsiteManager' and hit next.
15. On the 'Specify permission set details' page, under 'Permission set name', enter 'CloudsiteManager'. When done, hit 'Next'.
16. Review and click 'Create'.
17. From the left-hand menu, select 'AWS accounts'.
18. You should see your root account listed. Click the checkbox next to the root account and click 'Assign users or groups'.
19. Select the 'Cloudsite managers' group you just created (or whatever you called it).
20. On the 'Assign permission sets' page, select 'CloudsiteManager' and click 'Next'.
21. Review and click 'Submit'.
22. Just to make things a little nicer, let's rename your SSO access portal page. On the right hand side, in the 'Settings summary' box, click 'Edit' next to 'Instance name'.
23. Choose an available instance name; this could be based on your own name or your organization's. We used 'liquid-labs'.
24. You should receive an email titled something like 'Invitation to join AWS IAM Identity Center'. Open that email and click the 'Accept invitation'. This will take you to AWS Identity Center and ask you to create a password for the account.

#### Local SSO configuration and authentication


2. Have your [IAM Identity Center](https://us-east-1.console.aws.amazon.com/singlesignon/home) page open.[^1][^2]
3. Run the command `aws configure sso`
   1. Choose a 'session name', we called ours 'liquid-labs-sso'.
   2. For the 'SSO Start URL', copy your 'AWS access portal URL' from IAM Identity Center 'Settings summary' on the right hand side of the dashboard page.
   3. For the 'SSO region', copy the value from 'Region' ID from the 'Settings summary' section. It'll be something like 'us-east-1'.
   4. For 'SSO registration scopes', accept the default 'sso:account:access'.
   5. At this point, a browser window should open and ask you to log in as the SSO user we created earlier. Log in and start your SSO session.
   6. You should get a message that you will be using the 'CloudsiteManager' role we created earlier.
   7. Next, you should be asked for the 'CLI default client Region'. We recommend 'us-east-1' (regardless of the region where your IAM Identity Center instance resides).[^3]
   8. For the 'CLI default output format', you can accept the default of 'None'.
   9. For the 'CLI profile name', enter something memorable. We used 'll-power-user'.
4. Now you're all set. From now on, just execute the following to create temporary session credentials `cloudsite` can use:
   ```bash
   aws sso login --profile your-profile-name
   ```
   Replace 'your-profile-name' with the name of the profile created in the previous step.

You're now ready to use the `cloudsite` CLI tool. In future, you need only execute the `aws sso login --profile your-profile-name` command prior to using the `cloudsite` command or if your session times out.

[^1]: If you created your IAM Identity Center instance in a different region (than 'us-east-1'), you'll have to select the proper region. AWS provides an explanation and a link to your instance if you're in the wrong region.

[^2]: These instructions are summarized from [Configure the AWS CLI to use IAM Identity Center token provider credentials with automatic authentication refresh](https://docs.aws.amazon.com/cli/latest/userguide/sso-configure-profile-token.html#sso-configure-profile-token-auto-sso), which you can reference for the most up-to-date instructions.

[^3]: This is just because the Certificate Manager service—which issues your site's SSL certificates—only operations out of the 'us-east-1' region. It should be possible to create your site in any region, but having all the infrastructure in one region is helpful and with the use of CDN, it shouldn't matter too much which region the rest of the infrastructure resides.

### Authenticating with access keys

As an alternate method to setting up SSO, you can also set up access keys. You don't need to both unless you're setting up SSO authentication to replace access keys authentication.

As mentioned, access keys are considered a bit less safe since anyone that gets ahold of your access keys would have access to your AWS account. For most individuals, access keys are reasonable alternative.

We're going to start by following best practices and creating a group. We'll then add permissions to that group. Next, we create a non-root user and add them to the group we just created. Finally, we'll create access keys which we can use for local authentication.

1. First, navigate to the [AWS console](https://us-east-1.console.aws.amazon.com/console/home) (and log in if necessary).
2. In the 'Services' search in the upper left-hand side, search for 'IAM' and click the service. (Here, you want plain 'IAM', _NOT_ 'IAM Identity Center'.)
3. From the left-hand side, select 'User groups' and click 'Create group'.
4. For the group name, we recommend something like 'website-managers', but feel free to name it whatever you like.
5. In the 'Attach permission policies' section, search for 'CloudsiteManager'. Find the 'CloudsiteManager' policy in the list and click the checkbox next to it.
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