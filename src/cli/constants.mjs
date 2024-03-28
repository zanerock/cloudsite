import * as fsPath from 'node:path'

const SOURCE_TYPES = ['docusaurus', 'vanilla']

const VALID_FORMATS = ['json', 'terminal', 'text', 'yaml']

const DB_PATH = fsPath.join(process.env.HOME, '.config', 'cloudsite', 'cloudsite-db.json')

const globalOptionsSpec = [
  {
    name        : 'format',
    description : "Sets the format for the output. May be 'terminal' (default), 'text', 'json', or 'yaml'."
  },
  { name : 'quiet', alias : 'q', type : Boolean, description : 'Makes informational output less chatty.' },
  {
    name        : 'throw-error',
    type        : Boolean,
    description : 'In the case of an exception, the default is to print the message. When --throw-error is set, the exception is left uncaught.'
  }
]

const optionSpec = {
  name        : 'option',
  description : "A combined name-value pair: <name>:<value>. Can be used multiple times. With '--delete', the value portion is ignored and can be omitted, e.g.: '--option <name>'.",
  multiple    : true
}

const sourceTypeArgSpec = {
  name        : 'source-type',
  description : "May be either 'vanilla' or 'docusaurus', otherwise process will attempt to guess."
}

const cliSpec = {
  mainCommand : 'cloudsite',
  mainOptions : [
    { name : 'command', defaultOption : true, description : 'The command to run or a sub-command group.' },
    ...globalOptionsSpec
  ],
  commands : [
    {
      name        : 'cleanup',
      description : "Attempts to fully delete partially deleted sites in the 'needs to be cleaned up' state.",
      arguments   : [
        {
          name          : 'apex-domain',
          defaultOption : true,
          description   : 'Specifies the site to clean up rather than trying to cleanup all pending sites.'
        },
        {
          name        : 'list',
          description : 'Lists the sites in need of cleaning up.',
          type        : Boolean
        }
      ]
    },
    {
      name        : 'configuration',
      description : 'Command group for managing the Cloudsite CLI configuration.',
      arguments   : [
        {
          name          : 'subcommand',
          defaultOption : true,
          required      : true,
          description   : 'The configuration action to perform.'
        }
      ],
      commands : [
        {
          name        : 'initialize',
          description : 'Runs the initialization wizard and updates all options.'
        },
        {
          name        : 'show',
          description : 'Displays the current configuration.'
        }
      ]
    },
    {
      name        : 'create',
      description : 'Creates a new website, setting up infrastructure and copying content.',
      arguments   : [
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
          name        : 'no-interactive',
          description : 'Suppresses activation of the interactive setup where it would otherwise be activated.',
          type        : Boolean
        },
        optionSpec,
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
        sourceTypeArgSpec,
        {
          name        : 'stack-name',
          description : 'Specify the name of the stack to be created and override the default name.'
        }
      ]
    },
    {
      name        : 'destroy',
      description : 'Destroys the named site. I.e., deletes all cloud resources associated with the site.',
      arguments   : [
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
      name        : 'detail',
      description : 'Prints details for the indicated site.',
      arguments   : [
        {
          name          : 'apex-domain',
          description   : 'The domain of the site to detail.',
          defaultOption : true,
          required      : true
        }
      ]
    },
    {
      name        : 'get-iam-policy',
      description : 'Prints an IAM policy suitable for operating cloudsite.',
      arguments   : [
        {
          name        : 'with-instructions',
          description : 'When set, will print instructions for creating the policy along with the policy.',
          type        : Boolean
        }
      ]
    },
    {
      name        : 'list',
      description : 'Lists the sites registered in the local database.',
      arguments   : [
        {
          name        : 'all-fields',
          description : 'Includes all fields in the output.',
          type        : Boolean
        }
      ]
    },
    {
      name        : 'import',
      description : 'Generates a site database based on currently deployed site stacks.',
      arguments   : [
        {
          name        : 'common-logs-bucket',
          description : "Specifies the common logs bucket name. This is only necessary if there are multiple candidates, otherwise cloudsite can usually guess. Set to 'NONE' to suppress guessing and assume there is on common logs bucket."
        },
        {
          name          : 'domain-and-stack',
          description   : 'The domain and stack are specified as positional parameters, in either order.',
          defaultOption : true,
          multiple      : true,
          required      : true
        },
        {
          name        : 'refresh',
          description : "By defaualt, cloudsite will refuse to overwrite existing site DB entries. if '--refresh' is true, then it will update/refresh the existing entry.",
          type        : Boolean
        },
        {
          name        : 'region',
          description : 'Specifies the region where the stack is to be found.',
          required    : true
        },
        {
          name        : 'source-path',
          description : 'Local path to the static site root.',
          required    : true
        },
        sourceTypeArgSpec
      ]
    },
    {
      name        : 'plugin-settings',
      description : 'Sets (or deletes) a site option.',
      arguments   : [
        {
          name          : 'apex-domain',
          description   : 'The apex domain identifying the site.',
          defaultOption : true,
          required      : true
        },
        {
          name        : 'confirmed',
          description : "When entirely deleting (disabling) a plugin, you must either confirm interactively or provide the '--confirmed' option.",
          type        : Boolean
        },
        {
          name        : 'delete',
          description : "When set, then deletes the setting. Incompatible with the '--value' option. To delete all plugin settings (disable the plugin), set '--name' or '--option' to the bare plugin name; e.g.: --value aPlugin.",
          type        : Boolean
        },
        {
          name        : 'name',
          description : 'The option name.'
        },
        optionSpec, // the 'options' definition
        {
          name        : 'value',
          description : "The setting value. Incompatible with the '--delete' option."
        }
      ]
    },
    {
      name      : 'update',
      summary   : 'Updates a website content and/or infrastructure.',
      arguments : [
        {
          name          : 'apex-domain',
          description   : 'The apex domain identifying the site.',
          defaultOption : true,
          required      : true
        },
        {
          name        : 'do-billing',
          description : 'Limits updates to billing related matters (cost allocation tags) and other other specified updates.',
          type        : Boolean
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
          name        : 'do-stack',
          description : 'Limits update to stack infrastructure and any other specified updates.',
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
    },
    {
      name      : 'verify',
      summary   : 'Verifies the site is up and running and that the stack and content are up-to-date.',
      arguments : [
        {
          name          : 'apex-domain',
          description   : 'The domain of the site to verify.',
          defaultOption : true,
          required      : true
        },
        {
          name        : 'check-content',
          description : 'If set, then checks content and skips other checks unless also specifically specified.',
          type        : Boolean
        },
        {
          name        : 'check-site-up',
          description : 'If set, then checks that the site is up and skips other checks unless also specifically specified.',
          type        : Boolean
        },
        {
          name        : 'check-stack',
          description : 'If set, then checks for stack drift and skips other checks unless also specifically specified.',
          type        : Boolean
        }
      ]
    }
  ]
}

export { cliSpec, DB_PATH, globalOptionsSpec, SOURCE_TYPES, VALID_FORMATS }
