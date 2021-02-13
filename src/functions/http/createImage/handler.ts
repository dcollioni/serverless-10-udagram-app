import 'source-map-support/register';
import * as AWS  from 'aws-sdk'
import * as uuid from 'uuid'
import schema from './schema';

const docClient = new AWS.DynamoDB.DocumentClient()
const groupsTable = process.env.GROUPS_TABLE
const imagesTable = process.env.IMAGES_TABLE

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';
import { formatJSONResponse } from '@libs/apiGateway';

const createImage: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  console.log('Caller event', event)
  const groupId = event.pathParameters.groupId
  const validGroupId = await groupExists(groupId)

  if (!validGroupId) {
    return formatJSONResponse({ error: 'Group does not exist' }, 404)
  }

  const itemId = uuid.v4()

  const newItem = {
      imageId: itemId,
      groupId: groupId,
      timestamp: new Date().toISOString(),
      ...event.body
  }

  await docClient.put({
      TableName: imagesTable,
      Item: newItem
  }).promise()

  return formatJSONResponse({ newItem }, 201)
}

async function groupExists(groupId: string) {
  const result = await docClient
    .get({
      TableName: groupsTable,
      Key: {
        id: groupId
      }
    })
    .promise()

  console.log('Get group: ', result)
  return !!result.Item
}

export const main = middyfy(createImage);
