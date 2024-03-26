import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

// TODO: Currently, this code copied between 'contact-emailer-lambda' and 'contact-handler-lambda' we can't seem to 
// import files in the Lambda runtime

// MAKE SURE THIS CODE IS IN SYNC on both 'contact-emailer-lambda' and 'contact-handler-lambda'

const getFormFields = () => {
  let formFields
  try {
    formFields = JSON.parse(process.env.FORM_FIELDS)
  }
  catch (e) {
    if (e.name === 'SyntaxError') {
      throw new Error("Environment variable 'FORM_FIELDS' is not defined or is not valid JSON. (" + JSON.stringify(process.env) + ')')
    }
    else {
      throw e
    }
  }
  // TODO: verify form of JSON
  return formFields
}

export const handler = async (event) => {
  const sourceEmail = process.env.EMAIL_HANDLER_SOURCE_EMAIL
  // TODO: change to ...EMAILS
  const targetEmails = (process.env.EMAIL_HANDLER_TARGET_EMAIL || sourceEmail).split(',')
  const apexDomain = process.env.APEX_DOMAIN
  const formFields = getFormFields() // this does it's own validation checking

  if (apexDomain === undefined) {
    throw new Error("Environment variable 'APEX_DOMAIN' is not defined; bailing out. (" + JSON.stringify(process.env) + ')')
  }
  if (sourceEmail === undefined) {
    throw new Error("Environment variable 'EMAIL_HANDLER_SOURCE_EMAIL' not defined; bailing out. (" + JSON.stringify(process.env) + ')')
  }

  const sendProcesses = []
  for (const record of event.Records) {
    const { eventName } = record
    if (eventName !== 'INSERT') continue
    const tabledetails = record.dynamodb

    const submissionID = tabledetails.NewImage.SubmissionID.S
    const submissionTime = tabledetails.NewImage.SubmissionTime.S

    let messageBody = ''
    let email
    for (const [name, type] of Object.entries(formFields)) {
      // convert to sentence case
      const label = name.charAt(0) + name.slice(1).toLowerCase().replaceAll(/_/g, ' ')
      const value = tabledetails.NewImage[name][type]
      if (value) {
        messageBody += `${label}: ${value}\n`
      }

      if (name === 'email') {
        email = value
      }
    }

    const subject = `New contact form submission (${submissionID})`

    messageBody += '\n\n'
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
      Tags             : [
        { Name : 'source', Value : 'contact-form' },
        // SES dosen't allow ':' or '.', so we can't do 'site:<apexDomain>' like you might expect
        { Name : 'site', Value : apexDomain.replaceAll(/\./g, '_') }
      ]
    })

    sendProcesses.push(sesClient.send(sendEmailCommand))
  }

  await Promise.all(sendProcesses)
}
