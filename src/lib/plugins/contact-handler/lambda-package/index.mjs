import queryString from 'node:querystring'

import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb"
import { v4 as uuidv4 } from 'uuid'

const handler = async(event) => {
  console.log('event:', event) // DEBUG

  const body = event.isBase64Encoded === true ? Buffer.from(event.body, 'base64').toString() : event.body

  let data
  if (event.headers['content-type'] === 'application/x-www-form-urlencoded') {  
    data = queryString.parse(body)
  }
  else if (event.headers['content-type'] === 'application/json') {
    data = JSON.parse(body)
  }

  const putCommand = new PutItemCommand({
    TableName: 'ContactFormEntries',
    Item: {
      SubmissionID: { S: uuidv4() },
      SubmissionTime : { S: new Date().toISOString() },
      given_name: { S: data.given_name || ''},
      family_name: { S: data.family_name || ''},
      email: { S: data.email || ''},
      message: { S: data.message || ''}
    }
  })

  const dynamoDBClient = new DynamoDBClient()
  try {
    await dynamoDBClient.send(putCommand)

    return {
      statusCode : 200,
      body       : JSON.stringify({ message : 'Form submitted successfully' })
    }
  }
  catch (e) {
    console.error(e)
    return {
      statusCode : 500,
      body       : JSON.stringify({ message : 'Error submitting the form' })
    }
  }
}

export default handler
export { handler }