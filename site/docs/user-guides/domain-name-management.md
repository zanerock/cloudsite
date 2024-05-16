---
sidebar_position: 8
description: A guide to managing domain names.
---
# Domain Name Management

Note this document is primarily intended to help you address DNS configuration issues. Don't let the size of this document worry you. It addresses many different use cases and you'll only need to reference a the fraction of the document dealing with your particular use case.

If you registered your domain name with Route 53 you probably don't have to do anything except maybe your [DNS email configuration](#dns-email-configuration) and can skip the rest of this document. Otherwise, refer to our handy [domain registration/configuration flow chart](/docs/get-started/register-configure-a-domain) which will determine what you'll need to do in your particular case.

## Terminology

- _Authoritative name server_ the name server(s) registered with the registrar that gives the authoritative answers to questions regarding a particular domain.
- _Domain name_ generally refers to the bit before the last dot + the TLD. E.g., 'google.com', 'amazon.com', 'liquid-labs.com', etc.
- _Domain name system_ or _DNS_ translates domain names into the IP addresses that browsers actually use to retrieve content.
- _Hosted zone_ refers to a collection of DNS records for a particular domain. For our purposes, the hosted zone creates/configures the domain's authoritative name server.
- _Registrar_ refers to a company where you can register a domain name.
- _Top level domain_ or _TLD_ is the last bit in a domain name. E.g., '.com', '.org', '.us', etc.

## Register your domain name

The registration process itself is rather straightforward. You just go to your registrar of choice, tell them the name you want, select a term, and then pay some money. We offer just a few notes.

First, in selecting a registrar remember it can be different than the registrar where you did your searching. Cloudsite is fully integrated with [AWS Route 53](https://aws.amazon.com/route53/) and you won't have to do anything else to set up the domain or name servers when using Route 53 as the registrar. Otherwise, [Namecheap.com](https://namecheap.com) is a good option, or you can just google 'registrar' and find one you like. Personally, I recommend staying away from GoDaddy.

Second, you should sign up for "privacy protection" or "domain privacy". When you register a domain name, you have to provide contact information to establish ownership. By default, this information is publicly available unless you add a privacy protection service. Some registrars (like AWS Route 53) offer this for free, while others may charge a small fee.

Finally, just know that you'll see some difference in pricing for domains from different registrars. Any big difference (like 50% off) is always going to be an initial price only. The prices for domains are more or less set and should pretty much cost the same (in the long run) everywhere. You can save a little by using a registrar that offer privacy protection for free.

## Use Route 53 as the authoritative name server

When you purchase a domain name, you register _authoritative name servers_ with the _registrar_. The registrar essentially "let's the internet know" that such-and-such name servers are now the authoritative name servers for 'your-domain.com'. This is how the browser knows where to look for 'your-domain.com'.

You can use Route 53 as the authoritative name server regardless of where your domain is actually registered. It's a little easier if the domain is registered (or transferred to) Route 53, but that's not necessary.

### When your domain is registered with Route 53

There's nothing special to do. Route 53 will create the 'hosted zone', which stores the DNS records for you. If you accidentally delete the hosted zone, you can refere

### When your domain is registered elsewhere

### Configure Route 53 registered domains

If you register your domain name with Route 53, it will automatically configure a _hosted zone_ and push the records to Amazon's own authoritative name servers. As far as using Cloudsite, there's nothing you need to do except to register (or transfer) the domain.

### Configure 3rd party registered domains to use Route 53 DNS

If you use(d) another registrar to register the domain name, you could transfer the domain to Route 53 or, if you want to leave the domain with the current registrar, you can and should still use Route 53 to provide authoritative domain name resolution. You just need to tell the registrar which Amazon name servers to point at.

1. In the Route 53 service, under 'Hosted zones', create a new hosted zone for your domain.
2. The new zone will automatically populate with NS and SOA records.
3. Inspect the NS record and record the name servers. From the Route 53 service console, click 'Hosted zones' -> &lt;domain name&gt;, look for a record with 'Type' of 'NS'.<br />
   <div>
     <img src="/img/docs/user-guides/domain-names/verify-hosted-zone-01-ns-record.png"
       className="light-shadow-box"
       style={{ width: '480px', marginBottom: '3px' }}
     />
   </div>
4. On the registrar DNS management page, you'll need to enter those name servers (in the same order).

If you're transferring DNS for a live site, refere to [transfer DNS to Route 53](#transfer-dns-to-route-53). If you want more detail on this process refer to the AWS document [Making Amazon Route 53 the DNS service for an existing domain](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/MigratingDNS.html).

## Verify NS and SOA records

The hosted zone for each site must define 'NS' and 'SOA' records. Regardless of where your domain is actually registered, these records should be created for you when you create the hosted zone.

### Verify route 53 registered domains

- The NS record must match the name servers registered as the authoritative name servers registered with the domain's registrar.
  - First, check the NS record in domain's hosted Zone; click 'Hosted zones' -> &lt;domain name&gt;, look for a record with 'Type' of 'NS'.<br />
  <div>
    <img src="/img/docs/user-guides/domain-names/verify-hosted-zone-01-ns-record.png"
      className="light-shadow-box"
      style={{ width: '480px', marginBottom: '3px' }}
    />
  </div>
  - If the domain is registered with Route 53, you can check the registered authoritative name servers by clicking 'Registered domains' and looking for the 'Name servers' in the 'Details section.'
    <div style={{ display: 'flex', alignItems: 'start', flexWrap: 'wrap' }}>
      <img src="/img/docs/user-guides/domain-names/verify-hosted-zone-02-select-registered-domains.png"
        className="light-shadow-box"
        style={{ width: '140px' }}
      />
      <img src="/img/docs/user-guides/domain-names/verify-hosted-zone-03-select-domain.png" 
        className="light-shadow-box"
        style={{ width: '140px', marginRight: '1rem' }}
      />
      <img src="/img/docs/user-guides/domain-names/verify-hosted-zone-04-nameserver-details.png"
        className="light-shadow-box"
        style={{ width: '420px' }}
      />
    </div>
  - The record should list the name servers, in the same order, one on each line. If there is a mismatch, click the 'Actions' drop down, then select 'Edit name servers'. Now update the name servers to match the NS record above.
- There should be a single record with 'Type' 'SOA'; the value should be the first name server.
  <img src="/img/docs/user-guides/domain-names/verify-hosted-zone-05-soa-record.png"
    className="light-shadow-box"
    style={{ width: '480px', marginBottom: '3px' }}
  />

### Verify third party registered domains

- If the hosted zone doesn't exist, then you'll create and configure it as described in [configure authoritative name servers with a 3rd party registrar](#configure-3rd-party-registered-domains-to-use-route-53-dns).
- If the hosted zone exists, but the NS record was deleted, the easiest thing to do will be to delete the zone and recreate it. Be sure and take careful notes on any other DNS records so you can re-create them in the new hosted zone.
- If the hosted zone exists and has an NS record, verify that the listed name servers match the authoritative name servers configured with the registrar. If not, update the name servers with the registrar to match those in the NS record.
- If there the SOA record is missing, then create a new SOA record. The value of the record is the first name server listed in the NS record.

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

## Transfer DNS to Route 53

While it is possible to [use 3rd party DNS with Cloudsite], Cloudfront integrates with Route 53 DNS and you can transfer DNS services without any interruption to your site availability.

1. [Get your site set up as per normal.](/docs/get-started/overview)
2. Log into AWS and go to the [Route 53](https://us-east-1.console.aws.amazon.com/route53/v2/home?region=us-east-1#Dashboard) service console.
3. Select 'Hosted zones' -> and click 'Create hosted zone'.
4. Enter your root domain (e.g. your-site.com) and click 'Create hosted zone'.
5. Select 'Hosted zones' -> &lt;your domain name&gt; and inspect the NS record:
   <div>
     <img src="/img/docs/user-guides/domain-names/verify-hosted-zone-01-ns-record.png"
       className="light-shadow-box"
       style={{ width: '480px', marginBottom: '3px' }}
     />
   </div>
6. Go to your existing registrar and update the domain 'name servers' to match the NS record list.

## Use 3rd party DNS with Cloudsite

We strongly recommend [transferring DNS to Route 53](#transfer-dns-to-route-53) instead, but if you really love or, for technical reasons, are stuck with your current DNS, you can still use Cloudsite, you'll just need to manually update the DNS records to point your domain to the Cloudfront distribution.

1. Execute:
   ```
   cloudsite detail your-site.com
   ```
2. Look for the `cloudFrontDistributionID`.
3. Log into the AWS console and go to the CloudFront service console.
4. Find the distribution with the indicated ID and copy the domain value.
5. Create records in with your domain name service pointing the naked domain and the 'www' sub-domain to the CloudFront domain.
   - For the 'www' sub-domain, you can use a CNAME record with key/host 'www' (or 'www.your-domain.com' for some providers) and the CloudFront domain as the value.
   - For the naked/root domain, the type of record to use will vary from provider to provider. You can refer to the provider support documents for something like "point root domain to named host". [This article](https://repost.aws/questions/QUuXt7AVTxSGKUAkgz0pNEcQ/how-can-i-use-cloudfront-with-a-root-domain-name) provides solution for certain providers.

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
