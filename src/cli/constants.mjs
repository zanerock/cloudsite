import * as fsPath from 'node:path'

const SOURCE_TYPES = ['docusaurus', 'vanilla']

const VALID_FORMATS = ['json', 'terminal', 'text', 'yaml']

const DB_PATH = fsPath.join(process.env.HOME, '.config', 'cloudsite', 'cloudsite-db.json')

const ACTION_CLEANUP = 'CLEANUP'
const ACTION_SETUP_BILLING = 'SETUP_BILLING'

const globalOptionsSpec = [
  {
    name        : 'format',
    description : "Sets the format for the output. May be 'terminal' (default), 'text', 'json', or 'yaml'."
  },
  { name : 'help', alias : '?', type : Boolean, description : 'Prints general or command specific help.' },
  { name : 'no-color', type : Boolean, description : 'Disables terminal colorization.' },
  {
    name        : 'no-reminders',
    alias       : 'R',
    type        : Boolean,
    description : 'Suppresses any reminders. Particularly useful for programmatic usage where the extra output might break things.'
  },
  { name : 'quiet', alias : 'q', type : Boolean, description : 'Makes informational output less chatty.' },
  { name : 'sso-profile', description : 'The AWS local SSO profile to use for authentication.' },
  {
    name        : 'throw-error',
    type        : Boolean,
    description : 'In the case of an exception, the default is to print the message. When --throw-error is set, the exception is left uncaught.'
  },
  {
    name        : 'verbose',
    type        : Boolean,
    description : 'Activates verbose (non-quiet mode) even in situations where quiet would normally be implied.'
  }
]

const sourceTypeArgSpec = {
  name        : 'source-type',
  description : "May be either 'vanilla' or 'docusaurus', otherwise process will attempt to guess."
}

const subcommandSpec = {
  name          : 'subcommand',
  description   : 'The subcommand to execute.',
  defaultOption : true,
  required      : true
}

const keyDeleteSpec = [
  {
    name        : 'delete',
    type        : Boolean,
    description : "Confirms deletion of the Access keys after setting up the SSO access. If neither '--delete' nor '--no-delete' are set, then deletion will be interactively confirmed."
  },
  {
    name        : 'no-delete',
    type        : Boolean,
    description : 'Retains the Access keys after setting up SSO access.'
  }
]

const cliSpec = {
  mainCommand : 'cloudsite', // TODO: should just be command
  description : 'Low cost, high performance cloud based website hosting manager.',
  mainOptions : [ // TODO: should just be arguments
    { name : 'command', defaultOption : true, description : 'The command to run or a sub-command group.' },
    ...globalOptionsSpec
  ],
  commands : [
    {
      name        : 'billing',
      description : 'Billing group commands.',
      arguments   : [subcommandSpec],
      commands    : [
        {
          name        : 'configure-tags',
          description : 'Configures the global cost allocation tags.'
        }
      ]
    },
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
      description : 'Command group for managing the cloudsite CLI configuration.',
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
          name        : 'setup-local',
          description : "Runs the local setup wizard and updates all options. This should be used after SSO accounts have been created (see 'cloudsite permissions sso create')."
        },
        {
          name        : 'show',
          description : 'Displays the current configuration.'
        }
      ]
    },
    {
      name        : 'create',
      description : "Creates a new website, setting up infrastructure and copying content.\n\nThe first time you launch a new domain, Cloudsite will create an SSL certificate for the domain as necessary. If a new SSL certificate is created, the creation process will exit and you'll be given instructions on how to verify the SSL certificate. Once verification is complete, re-run the create command.\n\nYou can use `--no-interactive` to guarantee headless operation, though you must be sure to specify all primary options. Any un-specified `--option` for an active plugin will take its default value and any required without a default value will raise an error. See `--option` and `--no-interactive` documentation and/or [the plugins overview guide](/docs/user-guides/plugins/overview) for further details.",
      arguments   : [
        {
          name          : 'apex-domain',
          description   : 'The site apex domain.',
          defaultOption : true
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
          description : 'Suppresses activation of the interactive setup where it would otherwise be activated. Any options for activated plugins not set on the command line by an `--option` will take their default value.',
          type        : Boolean
        },
        {
          name        : 'option',
          description : 'A combined name-value pair of plugin options in the form of: &lt;name&gt;:&lt;value&gt;. Can be used multiple times. Setting any option activates the associated plugin and any unset options are queried unless `--no-interactive` is also set, in which case the options take their default value.',
          multiple    : true
        },
        {
          name        : 'region',
          description : "The region where to create the site resources. Defaults to 'us-east-1'.",
          default     : 'us-east-1'
        },
        {
          name        : 'site-bucket-name',
          description : 'The name of the bucket where website content is stored. If no option is given, Cloudsite will generate a random bucket name.'
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
      name        : 'document',
      description : 'Generates self-documentation in Markdown format.',
      arguments   : [
        {
          name        : 'section-depth',
          description : "An integer indicating initial header 'depth', where '1' means start with an 'H1/#' section header, '2' means start with an 'H2/##' section header, etc. This is useful when the documentation is embedded in other docs.",
          type        : (val) => parseInt(val)
        },
        {
          name        : 'title',
          description : 'The title of the top level section header.'
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
          name        : 'apex-domain',
          description : "The apex domain of the site to import data for. If '--source-path' is not specified, it will be dynamically queried."
        },
        {
          name        : 'confirmed',
          description : 'If set, will overwrite any group or policy name in the DB if a new group or policy name is provided. Will otherwise initiate interactive confirmation.',
          type        : Boolean
        },
        {
          name        : 'no-account',
          description : 'If set, then the account-level data import is skipped.',
          type        : Boolean
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
      name        : 'permissions',
      description : 'Command group for permission related commands.',
      arguments   : [subcommandSpec],
      commands    : [
        {
          name        : 'sso',
          description : 'Command group for sso related commands.',
          arguments   : [subcommandSpec],
          commands    : [
            {
              name        : 'create',
              description : 'Runs the SSO setup wizard and creates global permission groups and initial user as necessary.',
              arguments   : [
                {
                  name        : 'identity-store-name',
                  description : 'The name to assign to the newly created identity center, if needed.'
                },
                {
                  name        : 'identity-store-region',
                  description : "The region in which to set up the identity center if no identity center currently set up. Defaults to 'us-east-1'."
                },
                ...keyDeleteSpec
              ]
            }
          ]
        }
      ]
    },
    {
      name        : 'plugin-settings',
      description : 'Command group for managing plugin settings.',
      arguments   : [subcommandSpec],
      commands    : [
        {
          name        : 'set',
          description : 'Sets and deletes the specified options.',
          arguments   : [
            {
              name          : 'apex-domain',
              description   : 'The apex domain of the site to configure.',
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
            {
              name        : 'option',
              description : 'A combined name-value pair of plugin options in the form of: &lt;name&gt;:&lt;value&gt;. Can be used multiple times. When `--delete` is set, then the value is ignored and can be left blank.',
              multiple    : true
            },
            {
              name        : 'value',
              description : "The setting value. Incompatible with the '--delete' option."
            }
          ]
        },
        {
          name        : 'show',
          description : 'Displays the plugin settings for the specified site.',
          arguments   : [
            {
              name          : 'apex-domain',
              description   : 'The apex domain of the site whose settings are to be displayed.',
              defaultOption : true,
              required      : true
            }
          ]
        }
      ]
    },
    {
      name        : 'reminders',
      description : 'Command group for managing reminders.',
      arguments   : [subcommandSpec],
      commands    : [
        {
          name        : 'list',
          description : 'List currently active reminders.'
        }
      ]
    },
    {
      name : 'setup',
      description: 'Runs the initial setup wizard. This is safe to re-run in order to deal with cases of partial success or mid-setup errors.',
      arguments: [
        {
          name        : 'identity-store-name',
          description : 'The name to assign to the newly created identity center, if needed.'
        },
        {
          name        : 'identity-store-region',
          description : "The region in which to set up the identity center if no identity center currently set up. Defaults to 'us-east-1'."
        },
        {
          name        : 'sso-profile-name',
          description : 'The name of the local SSO profile to create.'
        },
        {
          name        : 'user-email',
          description : 'The primary email to associate with the user.'
        },
        {
          name        : 'user-family-name',
          description : 'The family name of the cloudsite management user.'
        },
        {
          name        : 'user-given-name',
          description : 'The given name of the cloudsite management user.'
        },
        {
          name        : 'user-name',
          description : 'The name of the user account to create or reference.'
        },
        ...keyDeleteSpec
      ]
    },
    {
      name        : 'update-contents',
      description : 'Updates a website content and/or infrastructure.',
      arguments   : [
        {
          name          : 'apex-domain',
          description   : 'The apex domain identifying the site to update.',
          defaultOption : true,
          required      : true
        },
        {
          name        : 'no-build',
          description : 'Suppresses the default behavior of building before updating the site.',
          type        : Boolean
        },
        {
          name        : 'no-cache-invalidation',
          description : 'Suppresses the default behavior of invalidating the CloudFront cache after the files are updated. Note that invalidation events are chargeable thought at the time of this writing, each account gets 1,000 free requests per year.',
          type        : Boolean
        }
      ]
    },
    {
      name        : 'update-dns',
      description : 'Updates the DNS entries to match the new site endpoint.',
      arguments   : [
        {
          name          : 'apex-domain',
          description   : 'The apex domain identifying the site.',
          defaultOption : true,
          required      : true
        }
      ]
    },
    {
      name        : 'update-stack',
      description : 'Updates website infrastructure.',
      arguments   : [
        {
          name          : 'apex-domain',
          description   : 'The apex domain identifying the site.',
          defaultOption : true,
          required      : true
        }
      ]
    },
    {
      name        : 'verify',
      description : 'Verifies the site is up and running and that the stack and content are up-to-date.',
      arguments   : [
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

export { ACTION_CLEANUP, ACTION_SETUP_BILLING, cliSpec, DB_PATH, globalOptionsSpec, SOURCE_TYPES, VALID_FORMATS }
