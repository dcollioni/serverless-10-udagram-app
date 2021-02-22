import schema from './schema';

export default {
    handler: `${__dirname.split(process.cwd())[1].substring(1).replace(/\\/g, '/')}/handler.main`,
    events: [
      {
        http: {
          method: 'post',
          path: 'groups/{groupId}/images',
          cors: true,
          authorizer: 'auth0Authorizer',
          request: {
            schema: {
              'application/json': schema
            }
          }
        }
      }
    ]
  }
  