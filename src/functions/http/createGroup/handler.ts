import 'source-map-support/register';
import * as AWS  from 'aws-sdk'
import * as uuid from 'uuid'
import schema from './schema';

const docClient = new AWS.DynamoDB.DocumentClient()
const groupsTable = process.env.GROUPS_TABLE

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';
import { formatJSONResponse } from '@libs/apiGateway';

const createGroup: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    console.log('Processing event: ', event)
    const itemId = uuid.v4()

    const newItem = {
        id: itemId,
        ...event.body
    }

    await docClient.put({
        TableName: groupsTable,
        Item: newItem
    }).promise()

    return formatJSONResponse({ newItem }, 201)
}

export const main = middyfy(createGroup);