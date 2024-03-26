import queryString from 'node:querystring'

import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { v4 as uuidv4 } from 'uuid'

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

const handler = async (event) => {
  const tablePrefix = process.env.TABLE_PREFIX

  const body = event.isBase64Encoded === true ? Buffer.from(event.body, 'base64').toString() : event.body

  const formFields = getFormFields()

  let data
  if (event.headers['content-type'] === 'application/x-www-form-urlencoded') {
    data = queryString.parse(body)
  } else if (event.headers['content-type'] === 'application/json') {
    data = JSON.parse(body)
  }

  const item = {
    SubmissionID   : { S : uuidv4() },
    SubmissionTime : { S : new Date().toISOString() },
  }

  for (const [name, type] of Object.entries(formFields)) {
    let emptyValue
    if (type === 'S') {
      emptyValue = ''
    }
    else if (type === 'SS') {
      emptyValue = ['']
    }
    else {
      throw new Error(`Unknown type '${type}' encoded in 'FORM_FIELDS'. Must be 'S' or 'SS'.`)
    }
    item[name] = { [type] : data[name] || emptyValue}
  }

  const putCommand = new PutItemCommand({
    TableName : tablePrefix + '-ContactFormEntries',
    Item      : item
  })

  const dynamoDBClient = new DynamoDBClient()
  try {
    await dynamoDBClient.send(putCommand)

    return {
      statusCode : 200,
      body       : JSON.stringify({ message : 'Form submitted successfully' })
    }
  } catch (e) {
    console.error(e)
    return {
      statusCode : 500,
      body       : JSON.stringify({ message : 'Error submitting the form' })
    }
  }
}

export default handler
export { handler }
