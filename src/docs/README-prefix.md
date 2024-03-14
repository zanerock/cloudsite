# Cloudsite

___This is alpha software and currently broken.___ I feel like the universe is gas lighting me a little because not only was it working yesterday, but I had tested it like a dozen times and it was fine. AWS was squirrely earlier, and also I found a long standing bug in my code. I think there was some interaction with my settings file, which I wasn't resetting, and my ability to carry out successful builds. It was skipping some step, wherein my bug resides.

And, Amazon was also giving me weird results earlier. Basic drift detection on like ~18 resources kept failing with "Internal Error"s all over the place. I googled, and there were a few people mentioning "Internal Error"s, but none of them seemed to apply.

And then another thing, the other day I was getting really descriptive messages in the 'Events' tab of my stack instance. But today, there's nothing. All the message data is blank. The weird thing is the events are spaced like the text is there, but then there's just a '-' in the middle.

IDK. I probably would have held off on publishing the thing if I wasn't confident it was working but now that it's out, I don't want to mess around with unpublishing it either... and also I really like 'cloudsite' and I don't want to lose it. I'm working on a logo and everything.

So, it's ___alpha software___. Don't use it right now. If you really like the project, you can support me on [Patreon @zanecodes](https://patreon.com/zanecodes).


♡( •ॢ◡-ॢ)✧˖° ♡

OK, from here on out, is the actual package documentation. For this broken package. :(

------------


Low cost, high performance cloud based website hosting manager. Cloudsite features CDN integration, DoS protection, free SSL certificates, and contact forms. In addition, since Cloudsite use "pay as you go" cloud infrastructure, hosting costs are generally well below typical market rates.

- [Installation](#installation)
- [Usage](#usage)
- [AWS authentication](#aws-authentication)
- [Command reference](#command-reference)
- [Known limitations](#known-limitations)
- [Contributing](#contributing)
- [Support and feature requests](#support-and-feature-requests)

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

cloudsite create your-domain.com --source-path . # deploys your site in the cloud
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

Note the following instructions use the 'PowerUserAccess' permissions policy, which is overbroad for our needs. Refer to the [Known limitations](#known-limitations) section for additional info.

### Sign up for your AWS account

If you don't already have one, the first step is to create your AWS root account.

1. If you are working on behalf of an organization and have the ability to create email aliases, we suggest you first create 'awsroot@your-domain.com' and use that to sign up.
2. Navigate to [aws.amazon.com](https://aws.amazon.com/).
3. Click 'Create an AWS Account' or 'Create a Free Account'.
4. Fill out the required information.

### SSO authentication

SSO authentication uses the new [AWS Identity Center](https://us-east-1.console.aws.amazon.com/singlesignon/home) to enable single-sign on across multiple AWS accounts. SSO is also integrated with the `aws` CLI tool and is the method by which we can create time-limited session credentials.

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
12. Under 'Types', select 'Predefined permission set' and then select the radio button for 'PowerUserAccess'.
13. On the 'Specify permission set details' page, the 'Permission set name' is prefilled and you can leave as is. Increase the 'Session duration' if you like. When done, hit 'Next'.
14. Review and click 'Create'.
15. From the left-hand menu, select 'AWS accounts'.
16. You should see your root account listed. Click the checkbox next to the root account and click 'Assign users or groups'.
17. Select the 'Cloudsite managers' group you just created (or whatever you called it).
18. On the 'Assign permission sets' page, select 'PowerUserAccess' and click 'Next'.
19. Review and click 'Submit'.
20. Just to make things a little nicer, let's rename your SSO access portal page. On the right hand side, in the 'Settings summary' box, click 'Edit' next to 'Instance name'.
21. Choose a (free) instance name; this could be based on your own name or your organization's. We used 'liquid-labs'.
22. You should receive an email titled something like 'Invitation to join AWS IAM Identity Center'. Open that email and click the 'Accept invitation'. This will take you to AWS Identity Center and ask you to create a password for the account.

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
