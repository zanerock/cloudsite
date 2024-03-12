# Cloudsite

Setup and manage websites in the cloud. Cloudsite features CDN integration, DoS protection, free SSL certificates, and integrated contact form processing. In addition, since Cloudsite use "pay as you go" cloud infrastructure, hosting costs are generally well below typical market rates.

## Installation

```bash
npm i -g cloudsite
```

## Usage

```bash
aws sso login --profile your-sso-profile # authenticate with AWS

cloudsite configuration initialize # walks you through setup questions

cloudsite create your-domain.com --source-path . # deploys your site in the cloud
cloudsite update your-domain.com # updates site content
cloudsite destroy your-domain.com # destroys site infrastructure
```
