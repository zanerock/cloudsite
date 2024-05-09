# Cloudsite

Low cost, high performance cloud based website hosting manager. Cloudsite features CDN integration, DoS protection, free SSL certificates, and support for contact forms. In addition, since Cloudsite uses AWS's "pay as you go" cloud infrastructure, hosting costs are generally free or well below typical market rates.

Refer to the [Cloudsite homepage](https://cloudsitehosting.org) for additional documentation.

If you appreciate this project, you can support us on [Patreon @liquidlabs](https://patreon.com/liquidlabs). We also provide support on [our discord channel](https://discord.gg/QWAav6fZ5C).

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

For initial setup, you must [sign up for an AWS root account](https://cloudsitehosting.org/docs/get-started/authentication#sign-up-for-an-aws-root-account) and then [create a set of access keys](https://cloudsitehosting.org/docs/get-started/authentication#initial-authentication-with-access-keys). Once that's done, you can hand over everything else to Cloudsite.

```bash
cloudsite configuration setup-sso # setup single sign on (SSO) for increased security
cloudiste configuration setup-local # configure your local account
aws sso login --profile cloudsite-manager # authenticate with AWS SSO

# now deploy a website; you can deploy as many as you like
cloudsite create your-domain.com --source-path . # see 'Plugins' for additional options
cloudsite update your-domain.com # updates site content
cloudsite destroy your-domain.com # destroys site infrastructure
```

Refer to the [homepage documentation for a complete CLI reference](https://cloudsitehosting.org/docs/user-guides/command-line-reference).

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

## Contributing

Plase feel free to submit any [bug reports or feature suggestions](https://github.com/liquid-labs/cloudsite/issues). You're also welcome to submit patches of course. We don't have a full contributors policy yet, but you can post questions on [our discord channel](https://discord.gg/QWAav6fZ5C). It's not monitored 24/7, but you should hear back from us by next business day.

## Support and feature requests

- The best way to get free support is to post a question tagged 'cloudsite' on [StackOverflow](https://stackoverflow.com).
- To get bugs fixed, [submit a ticket](https://github.com/liquid-labs/cloudsite/issues).
- You can also support our work, get priority support, communicate directly with us, and request new features by [becoming a patron](https://www.patreon.com/liquidlabs).
