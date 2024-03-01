import * as fsPath from 'node:path'

const SOURCE_TYPES = ['docusaurus', 'vanilla']

const GLOBAL_OPTIONS_PATH = fsPath.join(process.env.HOME, '.config', 'cloudsite', 'global-options.json')

const SITES_INFO_PATH = fsPath.join(process.env.HOME, '.config', 'cloudsite', 'sites.json')

const cliSpec = {
  mainCommand : 'cloudsite',
  mainOptions : [
    { name : 'command', defaultOption : true, description : 'The command to run or a sub-command group.' },
    { name : 'quiet', alias : 'q', type : Boolean, description : 'Makes informational output less chatty.' },
    {
      name        : 'throw-error',
      type        : Boolean,
      description : 'In the case of an exception, the default is to print the message. When --throw-error is set, the exception is left uncaught.'
    }
  ],
  commands : [
    {
      name      : 'configuration',
      summary   : 'Command group for managing the Cloudsite CLI configuration.',
      arguments : [
        {
          name          : 'command',
          defaultOption : true,
          required      : true,
          description   : 'The configuration action to perform.'
        }
      ],
      commands : [
        {
          name    : 'initialize',
          summary : 'Runs the initialization wizard and updates all options.'
        },
        {
          name    : 'show',
          summary : 'Displays the current configuration.'
        }
      ]
    },
    {
      name      : 'create',
      summary   : 'Creates a new website, setting up infrastructure and copying content.',
      arguments : [
        {
          name          : 'apex-domain',
          description   : 'The site apex domain.',
          defaultOption : true
        },
        {
          name        : 'bucket-name',
          description : 'The name of the bucket to be used. If no option is given, cloudsite will generate a bucket name based on the apex domain.'
        },
        {
          name        : 'no-delete-on-failure',
          description : 'When true, does not delete the site stack after setup failure.',
          type        : Boolean
        },
        {
          name        : 'region',
          description : "The region where to create the site resources. Defaults to 'us-east-1'.",
          default     : 'us-east-1'
        },
        {
          name        : 'source-path',
          description : 'Local path to the static site root.',
          required    : true
        },
        {
          name    : 'source-type',
          summary : "May be either 'vanilla' or 'docusaurus', otherwise process will attempt to guess."
        }
      ]
    },
    {
      name      : 'update',
      summaray  : 'Updates a website content and/or infrastructure.',
      arguments : [
        {
          name          : 'apex-domain',
          description   : 'The apex domain identifying the site.',
          defaultOption : true
        },
        {
          name        : 'no-cache-invalidation',
          description : 'Suppresses the default behavior of invalidating the CloudFront cache after the files are updated. Note that invalidation events are chargeable thought at the time of this writing, each account gets 1,000 free requests per year.'
        },
        {
          name        : 'only-content',
          description : 'Limits the update to the site content (skipping any infrastructure updates).'
        }
      ]
    }
  ]
}

export { cliSpec, GLOBAL_OPTIONS_PATH, SITES_INFO_PATH, SOURCE_TYPES }
