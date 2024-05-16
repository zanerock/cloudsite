---
sidebar_position: 4
description: Everything you need to manage your domain.
---
# Register/Configure a Domain

If you're starting fresh and don't yet have a domain name, then you can simply [register your domain name with Route 53](/docs/user-guides/domain-name-management#register-your-domain-name) and Cloudsite will take care of everything else. Otherwise, use our handy flow chart here to determine what steps to take regarding your domain name.

- <span class="callout">Do you have a domain name?</span>
  - <span class="callout">Yes, I have a domain name</span>: go to [Is your site currently active?](#is-your-site-currently-active)
  - <span class="callout">No, I need a domain name</span>: [Register your domain name](/docs/user-guides/domain-name-management#register-your-domain-name), then continue with [Is your site registered with Route 53?](#is-your-site-registered-with-route-53)
- <span id="is-your-site-currently-active" class="callout">Is your site currently active?</span>
  - <span class="callout">Yes, my site is currently active</span>: continue with [AWS authentication setup](./authentication), [Cloudsite configuration](./configuration), and [setting up your first site](./your-first-site), then go to [Is your site registered with Route 53?](#is-your-site-registered-with-route-53)
  - <span class="callout">No, my site is not currently active</span>: optionally, [consider transferring your domain name to Route 53](./docs/user-guides/domain-name-management#transfer-a-domain-to-route-53), then continue with [AWS authentication setup](./authentication), [Cloudsite configuration](./configuration), and [setting up your first site](./your-first-site), then go to [Is your site registered with Route 53?](#is-your-site-registered-with-route-53)
- <span id="is-your-site-registered-with-route-53" class="callout">Is your site registered with Route 53?</span>
  - <span class="callout">Yes, my site is registered with Route 53</span>: then your all set! Cloudsite will automatically manage your DNS records for you.[^1]
  - <span class="callout">No, my site is registered somewhere else</span>: go to [Do you have a name server?](#do-you-have-a-name-server)
- <span id="do-you-have-a-name-server" class="callout">Do you have a name server?</span>
  - <span class="callout">Yes, I have a name server</span>: go to [Are you using Route 53 for DNS?](#are-you-using-route-53-for-dns)
  - <span class="callout">No, I don't have a name server</span>: then you'll want to [use Route 53 as your name server](/docs/user-guides/domain-name-management#use-route-53-as-the-authoritative-name-server)
- <span id="are-you-using-route-53-for-dns" class="callout">Are you using Route 53 for DNS?</span>
  - <span class="callout">Yes, I am using Route 53 for DNS</span>: continue with [AWS authentication setup](./authentication), [Cloudsite configuration](./configuration), and [setting up your first site](./your-first-site) then, 
    - if your site is registered with Route 53, you're all set. 
    - if your site is registered elsewhere, you'll need to [configure the 3rd party registrar to use Route 53 DNS](/docs/user-guides/domain-name-management#configure-3rd-party-registered-domains-to-use-route-53-dns).
  - <span class="callout">No, I am using a 3rd party for DNS</span>: continue with [AWS authentication setup](./authentication), [Cloudsite configuration](./configuration), and [setting up your first site](./your-first-site), then you'll want to [transfer DNS to Route 53](/docs/user-guides/domain-name-management#transfer-dns-to-route-53).


[^1]: If your site is registered with Route 53, we assume you're using Route 53 for DNS. If not, you will want to look at [transferring your DNS to Route 53](/docs/user-guides/domain-name-management#transfer-dns-to-route-53).

