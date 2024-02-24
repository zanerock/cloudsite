const SOURCE_TYPES = ['docusaurus', 'vanilla']

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
      summary   : 'Creates a new cloud host environment for a site.',
      arguments : [
        {
          name          : 'apex-domain',
          description   : 'The site apex domain.',
          defaultOption : true
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
    }
  ]
}

export { cliSpec, SOURCE_TYPES }
