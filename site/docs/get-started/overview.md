---
sidebar_position: 1
description: An overview of getting started.
---

# Overview

To get going with Cloudsite:

1. [Install Node and NPM](./installation#install-node-and-npm) if necessary, then [install Cloudsite](./installation#install-cloudsite).
2. [Get an AWS account](./aws-sign-up)
3. (conditional) [Get](/docs/user-guides/domain-name-management#register-your-domain-name) or, optionally, [transfer](/docs/user-guides/domain-name-management#transfer-a-domain-to-route-53) a domain name.
4. [Set up AWS authentication.](./authentication)
5. [Configure Cloudsite.](./configuration)
6. [Launch your first site.](./your-first-site)
7. (conditional) If using a 3rd party registrar or name server:
   - Configure your 3rd party registrar to [use Route 53 DNS](/docs/user-guides/domain-name-management#when-your-domain-is-registered-elsewhere)
   - Configure your [3rd party name server](/docs/user-guides/domain-name-management#use-3rd-party-dns-with-cloudsite) if not using Route 53 at all.

If you're are registering or have registered your domain name with Route 53, then you can skip steps 3 and 7. Otherwise, refer to our [domain name registration and configuration flow chart](./register-configure-a-domain) for guidance on what steps you'll need to take to configure your domain name to work with Cloudsite.