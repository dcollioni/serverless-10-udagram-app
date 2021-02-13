import 'source-map-support/register';
import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as AWS  from 'aws-sdk'

const docClient = new AWS.DynamoDB.DocumentClient()
const groupsTable = process.env.GROUPS_TABLE

import { formatJSONResponse } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';

const getGroups: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Processing event: ', event)

    const result = await docClient.scan({
        TableName: groupsTable
    }).promise()

    const items = result.Items

    return formatJSONResponse({ items })
}

export const main = middyfy(getGroups);
