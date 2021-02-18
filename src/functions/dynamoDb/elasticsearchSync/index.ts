export default {
    handler: `${__dirname.split(process.cwd())[1].substring(1).replace(/\\/g, '/')}/handler.main`,
    events: [
      {
        stream: {
          type: 'dynamodb',
          arn: {"Fn::GetAtt": ["ImagesDynamoDBTable", "StreamArn"] }
        }
      }
    ],
    environment: {
        ES_ENDPOINT: { "Fn::GetAtt": ["ImagesSearch", "DomainEndpoint"] }
    }
  }
  