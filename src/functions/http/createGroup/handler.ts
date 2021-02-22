import 'source-map-support/register';
import * as AWS  from 'aws-sdk'
import * as uuid from 'uuid'
import schema from './schema';

const docClient = new AWS.DynamoDB.DocumentClient()
const groupsTable = process.env.GROUPS_TABLE

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';
import { formatJSONResponse } from '@libs/apiGateway';
import { getUserId } from './../../../auth/utils'

const createGroup: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    console.log('Processing event: ', event)
    const itemId = uuid.v4()

    const authorization = event.headers.Authorization
    const split = authorization.split(' ')
    const jwtToken = split[1]
    const userId = getUserId(jwtToken)

    const newItem = {
        id: itemId,
        userId,
        ...event.body
    }

    await docClient.put({
        TableName: groupsTable,
        Item: newItem
    }).promise()

    return formatJSONResponse({ newItem }, 201)
}

export const main = middyfy(createGroup);