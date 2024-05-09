---
sidebar_position: 3
description: Adds support for a dynamic form submission.
---
# Contact Form

The contact form plugin adds support for dynamic form submission. This is primarily targeted at "contact forms", but could be used for any form where the purpose is simply to gather data and store it in a database where it could be utilized directly or by additional processes.

## Compatibility

This plugin is generally compatible with any website and all plugins. We provide a template for a contact form embedded in a [Docusaurus](#docusaurus-site-configuration) based website and instructions for use with a [WordPress](#wordpress-site-configuration) and [template based](#templatecustom-site-configuration). 

## Configuration

### Plugin configuration

| Option | Default | Description |
|----|---| -|
|`emailFrom`|_none_|_(req.)_ This is the email which will appear as the sender. This address must be configured with SES. Set this value to blank to disable sending notification emails entirely.|
|`replyTo`|same as `emailFrom`|_(opt.)_ This is the email where submission notifications will be sent.
|`formFields`|'standard'; see note|May be either a JSON specification of fields to process in from the contact form or the string 'standard'. Unless you are adapting an existing form, setting the value to 'standard' should be sufficient in most cases.|
|`urlPath`|'/contact-handler'|The URL path to which to direct form submissions.|

#### Standard fields

Any given form may use a subset of the defined fields. The fields define what the process looks for, but it's fine if it doesn't find something. The standard form fields include:

- Basic identifiers:
  - `given_name`
  - `family_name`
  - `company`
- Corporate demographics:
  - `company_size`
  - `industry`
  - `revenue`
- Contact info:
  - `email`
  - `phone_number_home`
  - `phone_number_mobile`
  - `phone_number_work`
  - `phone_number_work_ext`
- Location:
  - `address_1`
  - `address_2`
  - `city`
  - `state`
  - `zip_code`
  - `county`
- Purpose/feedback
  - `message`
  - `topics` : this one is special in that it accepts multiple values; all other fields are singular.

#### Field configuration

To specify fields, specify a JSON object like:

```json
{ "field1" : "S", "multiField2": "SS" }
```

List each field name as the key in the object with a value of either 'S', for single value fields or 'SS' for multi-value fields.

### Docusaurus site configuration

If you're [building a site with Docusaurus](/docs/user-guides/website-development/build-with-docusaurus) provide a template for a rich contact form with validation and slick effects. You can see an example of the form in use at [the Liquid Labs contact page](https://liquid-labs.com/contact). To use the template, you would simply add a contact page and include the `ContactForm` component as a React component.

- [`ContactForm` definition](/code/contact-form-template/index.js.txt) (save as '.js' or '.jsx')
- [style module](/code/contact-form-template/styles.module.css)

### Template/custom site configuration

If you're building a [template based site](/docs/user-guides/website-development/build-with-a-template) and the template contains a passable form, you may be able to just update the field names to use [standard field names](#standard-fields) and set the `form` `action` attribute to the configured URL path (`/contact-handler` by default). If the form is submitted by the operation of a Javascript function (and hence, does not use the standard `action` attribute), you'll need to look at the code to figure out where to set the handler path. Hopefully they've made things obvious.

If you're starting from scratch, you should probably find an example of a working HTML form that you can copy/modify and use that. It is of course possible to code your form from scratch, but why bother?

### WordPress site configuration

If you're building a [WordPress based](/docs/user-guides/website-development/build-with-wordpress), things get a little trickier because WordPress plugins expect to operate in a dynamic environment. You may be able to include a form plugin that correctly transitions to the generated static site. In that case, you will probably have to [configure `formFields`](#field-configuration) and figure out what URL path it's using to the submit the form data (unless that's a configurable option).[^1]

[^1]: If you find such a plugin, please [let us know](https://liquid-labs/contact)!

If you're not lucky enough to find a workable plugin, you can add the form as post-static site generation process. Try adding a placeholder page, and then inject the form (and any scripts it uses) into the page after the rest of the site has been generated. Like the [template based configuration](#templatecustom-site-configuration) you're best bet is probably to find a working HTML form that you can copy/modify.

## Cost and Impact

Enabling this plugin creates three Lambda functions. These only run when a form is submitted and should have negligible cost. The plugin also creates a DynamoDB, which may incur additional costs, especially if it grows large. The data can always be extracted and deleted, however. Finally, the plugin optionally sends emails which may incur a small cost at volume.