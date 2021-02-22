import schema from './schema';

export default {
    handler: `${__dirname.split(process.cwd())[1].substring(1).replace(/\\/g, '/')}/handler.main`,
    events: [
      {
        http: {
          method: 'post',
          path: 'groups',
          cors: true,
          authorizer: 'rs256Auth0Authorizer',
          request: {
            schema: {
              'application/json': schema
            }
          }
        }
      }
    ]
  }
  