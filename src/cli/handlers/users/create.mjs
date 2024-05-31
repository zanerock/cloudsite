const handler = ({ argv, db, globalOptions }) => {
  if (ssoSetupOptions['user-name'] === undefined && defaults !== true) {
    const questioner = new Questioner({
      interrogationBundle : {
        actions : [
          {
            prompt    : `Enter the name of the Cloudsite manager user account to create or reference:`,
            default   : userName,
            parameter : 'user-name'
          }
        ]
      },
      output : progressLogger
    })

    await questioner.question()
    userName = questioner.get('user-name')
  }

  // are they saying create this or referencing an existing user?
  let userFound = false
  progressLogger.write(`Checking identity store for user '${userName}'...`)
  const identitystoreClient = new IdentitystoreClient({ credentials, region : identityStoreInfo.region })
  const getUserIdCommad = new GetUserIdCommand({
    IdentityStoreId     : identityStoreInfo.id,
    AlternateIdentifier : {
      UniqueAttribute : { AttributePath : 'userName', AttributeValue : userName }
    }
  })
  try {
    await identitystoreClient.send(getUserIdCommad)
    progressLogger.write(' FOUND.\n')
    userFound = true // if no exception
  } catch (e) {
    if (e.name !== 'ResourceNotFoundException') {
      progressLogger.write(' ERROR.\n')
      throw e // otherwise, it's just not found and we leave 'userFound' false
    }
    progressLogger.write(' NOT FOUND.\n')
  }

  const ibActions = []

  if (userFound === false) {
    ibActions.push(...[
      {
        prompt    : 'Enter the <em>email<rst> of the Cloudsite manager user:',
        parameter : 'user-email'
      },
      {
        prompt    : 'Enter the <em>given name<rst> of the Cloudsite manager:',
        parameter : 'user-given-name'
      },
      {
        prompt    : 'Enter the <em>family name<rst> of the Cloudsite manager:',
        parameter : 'user-family-name'
      }
    ])
  }

  if (ibActions.length > 0) {
    ibActions.push({ review : 'questions' })

    const interrogationBundle = { actions : ibActions }

    const questioner = new Questioner({
      initialParameters : ssoSetupOptions,
      interrogationBundle,
      output            : progressLogger
    })
    await questioner.question()

    const { values } = questioner;

    ({
      'user-email': userEmail = userEmail,
      'user-family-name': userFamilyName = userFamilyName,
      'user-given-name' : userGivenName = userGivenName,
      'user-name': userName = userName
    } = values)
  }

  const requiredFields = [
    ['user-name', userName]
  ]

  if (userFound === false) {
    requiredFields.push(
      ['user-email', userEmail],
      ['user-family-name', userFamilyName],
      ['user-given-name', userGivenName]
    )
  }

  for (const [label, value] of requiredFields) {
    // between the CLI options and interactive setup, the only way thees aren't set is if the user explicitly set to
    // '-' (undefined)
    if (value === undefined) {
      throw new Error(`Required parameter '${label}' is undefined.`)
    }
  }

}

export { handler }