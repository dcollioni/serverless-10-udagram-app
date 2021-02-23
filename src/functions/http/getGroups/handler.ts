import 'source-map-support/register';
import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { getAllGroups } from './../../../services/groupService'

import { formatJSONResponse } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';

const getGroups: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Processing event: ', event)

    const items = await getAllGroups()
    return formatJSONResponse({ items })
}

export const main = middyfy(getGroups);
