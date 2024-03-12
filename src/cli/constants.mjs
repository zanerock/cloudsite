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
      description   : 'Command group for managing the Cloudsite CLI configuration.',
      arguments : [
        {
          name          : 'subcommand',
          defaultOption : true,
          required      : true,
          description   : 'The configuration action to perform.'
        }
      ],
      commands : [
        {
          name    : 'initialize',
          description : 'Runs the initialization wizard and updates all options.'
        },
        {
          name    : 'show',
          description : 'Displays the current configuration.'
        }
      ]
    },
    {
      name      : 'create',
      description   : 'Creates a new website, setting up infrastructure and copying content.',
      arguments : [
        {
          name          : 'apex-domain',
          description   : 'The site apex domain.',
          defaultOption : true,
          required      : true
        },
        {
          name        : 'bucket-name',
          description : 'The name of the bucket to be used. If no option is given, cloudsite will generate a bucket name based on the apex domain.'
        },
        {
          name        : 'no-build',
          description : 'Supresses the default behavior of building before uploading the site content.',
          type        : Boolean
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
          description : "May be either 'vanilla' or 'docusaurus', otherwise process will attempt to guess."
        },
        {
          name    : 'stack-name',
          description : 'Specify the name of the stack to be created and override the default name.'
        }
      ]
    },
    {
      name      : 'destroy',
      description   : 'Destroys the named site. I.e., deletes all cloud resources associated with the site.',
      arguments : [
        {
          name          : 'apex-domain',
          description   : 'The domain of the site to delete.',
          defaultOption : true,
          required      : true
        },
        {
          name        : 'confirmed',
          description : 'Skips the interactive confirmation and destroys the resources without further confirmation.',
          type        : Boolean
        }
      ]
    },
    {
      name      : 'plugin-settings',
      description   : 'Sets (or deletes) a site option.',
      arguments : [
        {
          name          : 'apex-domain',
          description   : 'The apex domain identifying the site.',
          defaultOption : true,
          required      : true
        },
        {
          name        : 'delete',
          description : "When set, then deletes the setting. Incompatible with the '--value' option.",
          type        : Boolean
        },
        {
          name        : 'name',
          description : 'The option name.'
        },
        {
          name        : 'option',
          description : "A combined name-value paid, separated by ':'. Used to set multiple setting values at one time.",
          multiple    : true
        },
        {
          name        : 'value',
          description : "The setting value. Incompatible with the '--delete' option."
        }
      ]
    },
    {
      name      : 'update',
      summary  : 'Updates a website content and/or infrastructure.',
      arguments : [
        {
          name          : 'apex-domain',
          description   : 'The apex domain identifying the site.',
          defaultOption : true,
          required      : true
        },
        {
          name        : 'do-content',
          description : 'Limits update to site content and any other specified updates.',
          type        : Boolean
        },
        {
          name        : 'do-dns',
          description : 'Limits update to DNS entries and any other specified updates.',
          type        : Boolean
        },
        {
          name        : 'no-build',
          description : 'Supresses the default behavior of building before updating the site.',
          type        : Boolean
        },
        {
          name        : 'no-cache-invalidation',
          description : 'Suppresses the default behavior of invalidating the CloudFront cache after the files are updated. Note that invalidation events are chargeable thought at the time of this writing, each account gets 1,000 free requests per year.'
        }
      ]
    }
  ]
}

export { cliSpec, GLOBAL_OPTIONS_PATH, SITES_INFO_PATH, SOURCE_TYPES }
