export default {
    handler: `${__dirname.split(process.cwd())[1].substring(1).replace(/\\/g, '/')}/handler.main`,
    environment: {
        STAGE: '${self:provider.stage}',
        API_ID: { Ref: 'WebsocketsApi' }
    }
  }
  