---
sidebar_position: 6
description: A brief rundown on configuring Cloudsite.
---
# Configuration

To set the default profile and output preferences, run:
```bash
cloudsite configuration setup-local
```

- The 'AWS SSO profile' should match the profile created in the [SSO authentication setup](/docs/get-started/authentication#single-sign-on-authentication). If you used the default profile name, then just accept the default.
- Cloudsite supports four output formats. The 'json' and 'yaml' are data formats and most useful for programmatic use of the CLI. The 'termnial' and 'text' are intended for humans, with the 'terminal' format just being the colored version of 'text'.
- Select whether you want quite mode or not by default. As the tool explains, quite mode only outputs the results of a command whereas non-quiet mode will output updates along the way. Non-quite mode is aimed at humans and quite mode is more useful for programmatic usage.
