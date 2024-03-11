# Developer Notes

## Walkthrough

- Project implementation is first broken up into two parts, _cli_ and _lib_.
  - The _cli_—short for 'command line interface'—deals with taking input from the user, parsing commands, generating help, etc. Basically, all the user stuff.
  - The _cli_ also handles validating user input.
  - The _lib_—short for library—creates a reusable library that can be incorporated into other projects.
- Valid _cli_ input is defined in the `cliSpec` (in [`src/cli/constants.mjs`](./src/cli/constants.mjs)) object, which is used to parse input as well as generate API documentation and "help".
  - Command procesing is handled by a series of hierarchial handlers.
  - At the top level, [`cloudsite.mjs`](./src/cli/cloudsite.mjs) processes top level options (like '--quiet') and then passes control to a "handler" function for further processing.
  - Each handler function then processes command/command group specific options.
  - Control is then passed either to one of the cloudsite action handlers (defined in _lib_), or when the command group 'configurations' is specified, passes control to a third layer _cli_ handler for processing of the subcommand.
  - The 'configuration' subcommand handlers process the final subcommand options and then directly implement the commands. The thinking here being that 'configuration' is a concept in the _cli_ itself whereas the _lib_ actions deal exclusively with managing the site infrastructure and content.
- For non-configuration commands, the _cli_ command handler passes control to the _lib_ component.
- The _lib_ components manage site infrastructure and content through seven commands:
  - `cloudsite create`,
  - `cloudsite list`,
  - `cloudsite detail`,
  - `cloudsite verify`,
  - `cloudsite update`
  - `cloudsite destroy`,
  - `cloudsite import`.
- The '[create](./src/lib/create.mjs)' action is used to create a new site:
  - generates an SSL certificate for the site,
  - uses CloudFormation to create an S3 bucket, security policies, and CloudFront distribution, and
  - copies the site contents to S3.
  - The action is safe to repeat, which is useful in the case of partial creation.
  - Basic site information is stored locally (in `~/.config/cloudsite/sites.json`) for future reference. This reduces the need to make API calls to manage sites.
- The '[list](./src/lib/list.mjs)' action is used to list known sites.
- The '[detail](./src/lib/detail.mjs)' action prints detailed information about the site configuration.
- The '[verify](./src/lib/verify.mjs)' action checks that the infrastructure and content of a live site is up to date.
- The '[update](./src/lib/update.mjs)' action is used to update site infrastructure and/or content.
- The '[destroy](./src/lib/destroy.mjs)' action is used to destroy (delete/remove) all site resources.
- The '[import](./src/lib/import.mjs)' action examines existing AWS resources, identifies existing sites, and updates the local site database (in `~/.config/cloudsite/sites.json`).

# TODOs

- Make the custom error responses smarter; I think we want to retain the error code in the response (? need to verify our assumption how that works) and use 403.html and 404.html _if present_.
- Create role and user with limited IAM permissions (see [Deploy a website with AWS S3 + CloudFront using CloudFormation](https://blog.canopas.com/deploy-a-website-with-aws-s3-cloudfront-using-cloudformation-c2199dc6c435))

# Limitations and future goals

- The current implementation deals exclusively with apex domains. It would make a lot of sense to support sub-domains as well.
- Reporting progress through `process.stdout` isn't ideal, especial for the _lib_ components. We think using something like the Winston logger might be useful.[^1]

[^1: We did a survey of "top javascript log libraries" and determined that Winston seemed to fit best. It had all the feataures we needed and is very well supported.]

# References and credits

- [Cloudfront, Function, and Edge@Lambda with Cloudformation](https://medium.com/codex/cloudfront-function-and-edge-lambda-with-cloudformation-e6aae6d87517): An example of using Lambda@Edge
- [Deploy a website with AWS S3 + CloudFront using CloudFormation](https://blog.canopas.com/deploy-a-website-with-aws-s3-cloudfront-using-cloudformation-c2199dc6c435): Described basic setup.
- [Discussion on various ways to invoke Lambda functions from CloudFront](https://forum.serverless.com/t/directly-proxying-lambda-via-cloudfront-without-api-gateway/3808)
- [How to deploy Docusaurus page using AWS S3 and CloudFront](https://juffalow.com/blog/other/how-to-deploy-docusaurus-page-using-aws-s3-and-cloudfront#cloudfront-functions): Describes (now unnecessary?) changes to handle Docusaurus site
- [Protecting an AWS Lambda function URL with Amazon CloudFront and Lambda@Edge](https://aws.amazon.com/blogs/compute/protecting-an-aws-lambda-function-url-with-amazon-cloudfront-and-lambdaedge/)
- [Request signing Lambda code](https://github.com/aws-samples/aws-lambda-function-url-secured/blob/209bc9d2a73dbb6eefed1dc9cf98a9678ede9873/src/functions/auth/auth.mjs)