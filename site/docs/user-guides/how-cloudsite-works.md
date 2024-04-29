---
sidebar_position: 2
---
import ThemedImage from '@theme/ThemedImage';

# How Cloudsite Works

<ThemedImage alt=""
  sources={{ 
    light: '/img/docs/user-guides/how-cloudsite-works/how-the-website-works-overview.svg', 
    dark: '/img/docs/user-guides/how-cloudsite-works/how-the-website-works-overview-dark.svg'}} />

Here we see an overview of the CloudSite infrastructure. For each site, Cloudsite creates a CloudFront instance, an S3 bucket, a DynamoDB, a Lambda function to contact form submissions data into the DB and another Lambda function to generate an email notification using the Simple Email Service (SES) to send notification emails. (Note, the contact form handling is optional.)

## Making a page request

Let's take a look at how page requests are handled.

<div style={{ paddingLeft: '1em', textIndent: '-1em' }}>
<ThemedImage alt="" style={{ width: 680, float: 'right' }}
    sources={{ 
      light: '/img/docs/user-guides/how-cloudsite-works/how-the-website-works-page-request-01.svg', 
      dark: '/img/docs/user-guides/how-cloudsite-works/how-the-website-works-page-request-dark-01.svg'}} />

1\. When one requests a webpage, the request is first routed to our CloudFront instance.
</div>

<div style={{ paddingLeft: '1em', textIndent: '-1em', clear: 'both' }}>
<ThemedImage alt="" style={{ width: 680, float: 'right' }}
  sources={{ 
    light: '/img/docs/user-guides/how-cloudsite-works/how-the-website-works-page-request-02.svg', 
    dark: '/img/docs/user-guides/how-cloudsite-works/how-the-website-works-page-request-dark-02.svg'}} />
2\. A CloudFront instances is a _content delivery network_, or _CDN_. A CDN consists of hosts spread across multiple geographic regions. Requests are serviced by the host nearest to the request. This speeds the response.
</div>

<div style={{ paddingLeft: '1em', textIndent: '-1em', clear: 'both' }}>
<ThemedImage alt="" style={{ width: 680, float: 'right' }}
  sources={{ 
    light: '/img/docs/user-guides/how-cloudsite-works/how-the-website-works-page-request-03.svg', 
    dark: '/img/docs/user-guides/how-cloudsite-works/how-the-website-works-page-request-dark-03.svg'}} />
3\. If the page is not cached when CloudFront receives the request (or the cache is old), CloudFront requests the data from the S3 bucket.
</div>

<div style={{ paddingLeft: '1em', textIndent: '-1em', clear: 'both' }}>
<ThemedImage alt="" style={{ width: 680, float: 'right' }}
  sources={{ 
    light: '/img/docs/user-guides/how-cloudsite-works/how-the-website-works-page-request-04.svg', 
    dark: '/img/docs/user-guides/how-cloudsite-works/how-the-website-works-page-request-dark-04.svg'}} />
4\. The S3 bucket, acting as an HTML server, responds to the request with the page data and CloudFront forwards the response to the browser. The page data will be cached for future use.
</div>

## Submitting a contact form

Now, let's take a look at how things go when someone fills out and submits a contact form.

<div style={{ paddingLeft: '1em', textIndent: '-1em', clear: 'both' }}>
<ThemedImage alt="" style={{ width: 680, float: 'right' }}
  sources={{ 
    light: '/img/docs/user-guides/how-cloudsite-works/how-the-website-works-form-submit-01.svg', 
    dark: '/img/docs/user-guides/how-cloudsite-works/how-the-website-works-form-submit-dark-01.svg'}} />
1\. The CloudFront instance handles all initial requests for our site, so when the user hits the submit button, the data is first sent to the CloudFront instance.
</div>

<div style={{ paddingLeft: '1em', textIndent: '-1em', clear: 'both' }}>
<ThemedImage alt="" style={{ width: 680, float: 'right' }}
  sources={{ 
    light: '/img/docs/user-guides/how-cloudsite-works/how-the-website-works-form-submit-02.svg', 
    dark: '/img/docs/user-guides/how-cloudsite-works/how-the-website-works-form-submit-dark-02.svg'}} />
2\. CloudFront recognizes this as a "dynamic request" and simply forwards the request to our database (DB) Lambda function.
</div>

<div style={{ paddingLeft: '1em', textIndent: '-1em', clear: 'both' }}>
<ThemedImage alt="" style={{ width: 680, float: 'right' }}
  sources={{ 
    light: '/img/docs/user-guides/how-cloudsite-works/how-the-website-works-form-submit-03.svg', 
    dark: '/img/docs/user-guides/how-cloudsite-works/how-the-website-works-form-submit-dark-03.svg'}} />
3\. This DB Lambda creates a record of the contact information and message in the database.
</div>

<div style={{ paddingLeft: '1em', textIndent: '-1em', clear: 'both' }}>
<ThemedImage alt="" style={{ width: 680, float: 'right' }}
  sources={{ 
    light: '/img/docs/user-guides/how-cloudsite-works/how-the-website-works-form-submit-04.svg', 
    dark: '/img/docs/user-guides/how-cloudsite-works/how-the-website-works-form-submit-dark-04.svg'}} />
4\. After the data is inserted into the database, the Lambda function responds with a "success" message, which is forwarded by CloudFront to the browser.
</div>

<div style={{ paddingLeft: '1em', textIndent: '-1em', clear: 'both' }}>
<ThemedImage alt="" style={{ width: 680, float: 'right' }}
  sources={{ 
    light: '/img/docs/user-guides/how-cloudsite-works/how-the-website-works-form-submit-05.svg', 
    dark: '/img/docs/user-guides/how-cloudsite-works/how-the-website-works-form-submit-dark-05.svg'}} />
5\. In the meantime, the insertion triggers another Lambda function. This Lambda function contacts the Simple Email Service (SES) to send a notification email to the website owner.
</div>

## In closing

Cloudsite is a powerful website management tool. By leveraging AWS infrastructure, Cloudsite is able to offer many benefits including free or greatly reduced hosting costs, security, and speed. Cloudsite can host any static website, and we support [WordPress based](./website-development/build-with-wordpress), [Docusaurus based](./website-development/build-with-docusaurus), and [template based](./website-development/build-with-templates) websites.