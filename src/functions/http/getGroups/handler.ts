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

// import 'source-map-support/register'
// import { getAllGroups } from './../../../services/groupService'

// import * as express from 'express'
// import * as awsServerlessExpress from 'aws-serverless-express'

// const app = express()

// app.get('/groups', async (_req, res) => {
//   const groups = await getAllGroups()

//   res.json({
//     items: groups
//   })
// })

// const server = awsServerlessExpress.createServer(app)
// export const main = (event, context) => { awsServerlessExpress.proxy(server, event, context) }
