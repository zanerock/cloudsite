import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

export const handler = async (event) => {
  const sourceEmail = process.env.EMAIL_HANDLER_SOURCE_EMAIL
  const targetEmails = (process.env.EMAIL_HANDLER_TARGET_EMAIL || sourceEmail).split(',')

  if (sourceEmail === undefined) {
    throw new Error("Environment variable 'EMAIL_HANDLER_SOURCE_EMAIL' not defined; bailing out. (" + JSON.stringify(process.env) + ')')
  }

  const sendProcesses = []
  for (const record of event.Records) {
    const { eventName } = record
    if (eventName !== 'INSERT') continue;
    const tabledetails = record.dynamodb
    console.info(tabledetails)

    const submissionID = tabledetails.NewImage.SubmissionID.S
    const submissionTime = tabledetails.NewImage.SubmissionTime.S
    const givenName = tabledetails.NewImage.given_name.S
    const familyName = tabledetails.NewImage.family_name.S
    const email = tabledetails.NewImage.email.S
    const message = tabledetails.NewImage.message.S
    const topics = tabledetails.NewImage.topics.SS

    const subject = `New contact form submission (${submissionID})`

    let messageBody = ''
    if (givenName) {
      messageBody += `given name: ${givenName}\n`
    }
    if (familyName) {
      messageBody += `given name: ${familyName}\n`
    }
    messageBody += `email: ${email}\n`
    // might: [''] if they didn't designate any topics
    if (topics && (topics.length > 1 || topics[0])) {
      messageBody += `topics: ${topics.join(', ')}\n`
    }
    messageBody += '\n' + message + '\n\n'
    messageBody += 'Submitted at: ' + submissionTime + '\n'

    const sesClient = new SESClient()
    const sendEmailCommand = new SendEmailCommand({
      Source      : sourceEmail,
      Destination : { ToAddresses : targetEmails },
      Message     : {
        Subject : { Data : subject, Charset : 'UTF-8' },
        Body    : {
          Text : { Data : messageBody, Charset : 'UTF-8' }
        }
      },
      ReplyToAddresses : [email],
      Tags             : [{ Name : 'source', Value : 'contact-form' }]
    })

    sendProcesses.push(sesClient.send(sendEmailCommand))
  }

  await Promise.all(sendProcesses)
}
