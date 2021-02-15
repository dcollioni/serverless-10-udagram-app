import 'source-map-support/register';
import * as AWS  from 'aws-sdk'
import * as uuid from 'uuid'
import schema from './schema';

const groupsTable = process.env.GROUPS_TABLE
const imagesTable = process.env.IMAGES_TABLE
const bucketName = process.env.IMAGES_S3_BUCKET
const urlExpiration = parseInt(process.env.SIGNED_URL_EXPIRATION)

const docClient = new AWS.DynamoDB.DocumentClient()
const s3 = new AWS.S3({
  signatureVersion: 'v4'
})

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

  const imageId = uuid.v4()

  const newItem = {
      imageId: imageId,
      groupId: groupId,
      timestamp: new Date().toISOString(),
      imageUrl: `https://${bucketName}.s3.amazonaws.com/${imageId}`,
      ...event.body
  }

  await docClient.put({
      TableName: imagesTable,
      Item: newItem
  }).promise()

  const url = getUploadUrl(imageId)

  return formatJSONResponse({
    newItem,
    uploadUrl: url
  }, 201)
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

function getUploadUrl(imageId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: imageId,
    Expires: urlExpiration
  })
}


export const main = middyfy(createImage);
