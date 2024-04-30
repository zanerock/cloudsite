---
sidebar_position: 3
description: A brief rundown on using Cloudsite.
---
# Running

## Setting preferences

To set the default profile and output preferences, run:
```bash
cloudsite configuration setup-local
```

- The 'AWS SSO profile' should match the profile created in the [SSO authentication setup](/docs/getting-started/authentication#single-sign-on-authentication). If you used the default profile name, then just acept the default.
- Cloudsite supports four output formats. The 'json' and 'yaml' are data formats and most useful for programmatic use of the CLI. The 'termnial' and 'text' are intended for humans, with the 'terminal' format just being colored text.
- Select whether you want quite mode or not by default. As the tool explains, quite mode only outputs the results of a command whereas non-quiet mode will output updates along the way. Again, non-quite mode is aimed at humans and quite mode is more useful for programmatic usage.

You can override these defaults for any single Cloudsite invocation with the `--format` and `--quiet` options. E.g.:
```bash
cloudsite --format json --quiet some-domain.com create
```

## Creating local credentials

As mentioned before, Cloudsite works by interacting with Amazon Web Services (AWS) and managing your website infrastructure on your behalf. In order to do this, Cloudsite must have access to valid credentials. If you try and use Cloudsite without valid credentials present, it will helpfully tell you what you need to do to create the credentials. Namely, execute:
```bash
aws sso login --profile cloudsite-manager
```
(Replacing 'cloudsite-manager' with the SSO profile name if you're not using the default.)

By default, these credentials last for 4 hours at a time. You will need to refresh the credentials after they expire.

## Running commands

Once credentials are in place, you can execute commands using the Cloudsite tool:
```bash
cloudsite <command> [options]
```
Refer to the [command line reference](/docs/user-guides/command-line-reference) for a comprehensive list of commands.

It is possible for commands to fail mid-way through for various reasons. One common reason is the authorization credentials can expire mid-command. In general, it is safe to re-run all the commands. The commands will mostly recover from partial failures on a second run (after re-authenticating if necessary, of course).