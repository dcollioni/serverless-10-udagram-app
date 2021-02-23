import 'source-map-support/register';
import * as uuid from 'uuid'
import schema from './schema';

// const docClient = new AWS.DynamoDB.DocumentClient()
// const groupsTable = process.env.GROUPS_TABLE

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';
import { formatJSONResponse } from '@libs/apiGateway';
import { createGroup } from './../../../services/groupService'
import CreateGroupRequest from './../../../requests/CreateGroupRequest'

const handler: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    console.log('Processing event: ', event)

    const request: CreateGroupRequest = { ...event.body }
    const authorization = event.headers.Authorization
    const split = authorization.split(' ')
    const jwtToken = split[1]

    const newItem = await createGroup(request, jwtToken)

    return formatJSONResponse({ newItem }, 201)
}

export const main = middyfy(handler);