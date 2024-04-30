---
sidebar_position: 7
description: A guide to managing domain names.
---
# Domain Name Management

Note this document is primarily intended to help you address DNS configuration issues. If you registered your domain name with Route 53 you probably don't have to do anything except maybe your [DNS email configuration](#dns-email-configuration) and can skip the rest of this document.

If you have an existing domain registered with a 3rd party, you can either [transfer the domain to Route 53](#transfer-a-domain-to-route-53) or you can follow the instructions to [configure authoritative name server with a 3rd party registrar](#configure-3rd-party-registered-domains).

## Terminology

- _Authoritative name server_ the name server(s) registered with the registrar that gives the authoritative answers to questions regarding a particular domain.
- _Domain name_ generally refers to the bit before the last dot + the TLD. E.g., 'google.com', 'amazon.com', 'liquid-labs.com', etc.
- _Domain name system_ or _DNS_ translates domain names into the IP addresses that browsers actually use to retrieve content.
- _Hosted zone_ refers to a collection of DNS records for a particular domain. For our purposes, the hosted zone creates/configures the domain's authoritative name server.
- _Registrar_ refers to a company where you can register a domain name.
- _Top level domain_ or _TLD_ is the last bit in a domain name. E.g., '.com', '.org', '.us', etc.

## Configure authoritative name servers

When you purchase a domain name, you register _authoritative name servers_ with the _registrar_. The registrar essentially "let's the internet know" that such-and-such name servers are now the authoritative name servers for 'your-domain.com'. Now, when someone comes looking for the IP address of 'your-domain.com', they know where to send the query.

### Configure Route 53 registered domains

If you register your domain name with Route 53, it will automatically configure a _hosted zone_ and push the records to Amazon's own authoritative name servers. As far as using Cloudsite, there's nothing you need to do except to register (or transfer) the domain.

### Configure 3rd party registered domains

If you use(d) another registrar to register the domain name, you could transfer the domain to Route 53 or, if you want to leave the domain with the current registrar, you can and should still use Route 53 to provide authoritative domain name resolution, you just need to tell the registrar which Amazon name servers to point at.

1. In the Route 53 service, under 'Hosted zones', create a new hosted zone.
2. The new zone will automatically populate with NS and SOA records.
3. Inspect the NS record and record the name servers.
4. On the registrar DNS management page, you'll need to enter those name servers (in the same order).

If you want more detail on this process, or you want to transfer the domain for a live website, refer to the AWS document [Making Amazon Route 53 the DNS service for an existing domain](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/MigratingDNS.html).

## Verify NS and SOA records

The hosted zone for each site must define 'NS' and 'SOA' records. These are typically created when the hosted zone is created and there's nothing else for you to as far as this goes. If you're having problems connecting to your site, the hosted zone was deleted, or you just want to double check, then you'll first want to verify the NS and SOA records are in place and correct.

### Verify route 53 registered domains

- The NS record must match the name servers registered as the authoritative name servers registered with the domain's registrar.
  - If the domain is registered with Route 53, you can check the registered authoritative name servers by clicking 'Registered domains' and looking for the 'Name servers' in the 'Details section.'
    <div style={{ display: 'flex', alignItems: 'start', flexWrap: 'wrap' }}>
      <img src="/img/docs/user-guides/domain-names/verify-hosted-zone-01-select-registered-domains.png"
        className="light-shadow-box"
        style={{ width: '140px' }}
      />
      <img src="/img/docs/user-guides/domain-names/verify-hosted-zone-02-select-domain.png" 
        className="light-shadow-box"
        style={{ width: '140px', marginRight: '1rem' }}
      />
      <img src="/img/docs/user-guides/domain-names/verify-hosted-zone-03-name server-details.png"
        className="light-shadow-box"
        style={{ width: '420px' }}
      />
    </div>
- Now, under 'Hosted zones' -> &lt;domain name&gt;, look for a record with 'Type' of 'NS'.<br />
  <img src="/img/docs/user-guides/domain-names/verify-hosted-zone-04-ns-record.png"
    className="light-shadow-box"
    style={{ width: '480px', marginBottom: '3px' }}
  />
  - The record should list the name servers, in the same order, one on each line.
  - Update or create the record as necessary.
- There should be a single record with 'Type' 'SOA'; the value should be the first name server.
  <img src="/img/docs/user-guides/domain-names/verify-hosted-zone-05-soa-record.png"
    className="light-shadow-box"
    style={{ width: '480px', marginBottom: '3px' }}
  />

### Verify third party registered domains

- If the hosted zone doesn't exist, then you'll create and configure it as described in [configure authoritative name servers with a 3rd party registrar](#configure-3rd-party-registered-domains).
- If the hosted zone exists, but the NS record was deleted, the easiest thing to do will be to delete the zone and recreate it. Be sure and take careful notes on any other DNS records so you can re-create them in the new hosted zone.
- If the hosted zone exists and has an NS record, verify that the listed name servers match the authoritative name servers configured with the registrar. If not, update the name servers with the registrar.
- If there the SOA record is missing, then create a new SOA record. The value of the record is the first name server listed in the NS record.

## DNS email configuration

When an email is sent, the email server uses the 'MX' record to determine emails for the domain should go for final processing and delivery. While Cloudsite handles setting up DNS records for Cloudsite managed websites, you'll want to make sure the MX records are properly configured if there are email addresses that use the domain name.

For newly created domains, just create the MX record according to the mail provider's instructions. If you're transferring a live domain and switching DNS to Route 53, you'll want to make sure your MX record is set up prior to the transfer to avoid any service interruptions.[^1]

[^1]: The good news is that email is a fairly robust system and even if the MX records disappear for a while or there's a problem with configuring your DNS, email will generally keep retrying delivery for a couple days before giving up completely.

Instructions for popular providers are below:

- [Gmail MX configuration](https://apps.google.com/supportwidget/articlehome?hl=en&article_url=https%3A%2F%2Fsupport.google.com%2Fa%2Fanswer%2F174125%3Fhl%3Den&assistant_event=welcome&assistant_id=gsuitemxrecords-gixvmm&product_context=174125&product_name=UnuFlow&trigger_context=a)
- [Proton Mail domain verification and MX record](https://proton.me/support/custom-domain-aws)
- [Zoho mail MX configuration](https://www.zoho.com/mail/help/adminconsole/configure-email-delivery.html#alink2)
- [Neo mail MX configuration](https://support.neo.space/hc/en-us/articles/14009678176921-Setup-Neo-for-your-domain)
- [Tital mail MX configuratino](https://support.titan.email/hc/en-us/articles/360036853934-Setup-Titan-for-your-domain)

To create the record, go to the [Route 53 console](https://console.aws.amazon.com/route53/) and select 'Hosted zones' -> &lt;domain name&gt; and select and edit the existing MX record or create a new record.

## Transfer a domain to Route 53

While we don't have specific instructions for different registrars, the transfer process is always more or less the same. 

1. Navigate to the domain name management page.
2. Look for a 'transfer' section or tab. Make sure the domain is unlocked. This will probably be called something like 'transfer lock' or 'domain lock'.
3. If this is a live domain, you'll need to [transfer DNS service to Route 53](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/MigratingDNS.html). If the domain isn't currently live (or can go down for awhile), then you can skip this step.
4. Disable DNSSEC if enabled. This may be under 'security' or 'advanced' settings.
5. Back in the 'transfer' section, look for an 'authorization' or 'transfer' code.
6. Request the transfer. The transfer is requested by the receiving registrar, which is Route 53 in this case.
   1. Open the [Route 53 console](https://console.aws.amazon.com/route53/).
   2. In the navigation pane, choose Registered domains.
   3. On the Registered domains page, choose 'Single' or 'Multiple' domains from the 'Transfer in' drop-down.
   4. Amazon will let you know whether the domain is available for transfer or not. If there are any issues, it should provide details if there are any issues.
   5. Review the DNS service information.
   6. Enter the authorization code from earlier.
   7. Select the length of time for which you want to register the domain.
   8. Fill out the contact information and indicate whether you want privacy protection (you almost certainly do).
   9. Review and submit the request.
7. You may receive an verification email from AWS to verify the contact/owner email associated with the domain. You must verify any new email.
8. You should receive a separate verification email from the original registrar. Follow the instructions to verify the transfer.[^2]
9. Wait. The process can take a few days.

[^2]: The transfer will still happen even if you don't verify it, it just takes longer.

You can always check the status of the transfer from the [Route 53 console](https://console.aws.amazon.com/route53/), by selecting 'Domains' -> 'Requests'.