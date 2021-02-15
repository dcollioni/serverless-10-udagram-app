import type { AWS } from '@serverless/typescript';

import {
  hello,
  getGroups,
  createGroup,
  getImages,
  getImage,
  createImage } from './src/functions';

const serverlessConfiguration: AWS = {
  service: 'service-10-udagram-app',
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true
    },
    documentation: {
      api: {
        info: {
          version: '1.0.0',
          title: 'Udagram API',
          description: 'Serverless application for images sharing'
        }
      },
      models: [{
        name: 'GroupRequest',
        contentType: 'application/json',
        schema: '${file(src/functions/http/createGroup/schema.ts)}'
      }, {
        name: 'ImageRequest',
        contentType: 'application/json',
        schema: '${file(src/functions/http/createImage/schema.ts)}'
      }]
    }
  },
  plugins: ['serverless-webpack'],
  provider: {
    name: 'aws',
    runtime: 'nodejs12.x',
    stage: 'dev',
    region: 'eu-west-1',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      GROUPS_TABLE: 'Groups-${self:provider.stage}',
      IMAGES_TABLE: 'Images-${self:provider.stage}',
      IMAGE_ID_INDEX: 'ImageIdIndex',
      IMAGES_S3_BUCKET: 'dcollioni-serverless-udagram-images-${self:provider.stage}'
    },
    iamRoleStatements: [{
      Effect: 'Allow',
      Action: ['dynamodb:Scan', 'dynamodb:PutItem', 'dynamodb:GetItem'],
      Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.GROUPS_TABLE}'
    }, {
      Effect: 'Allow',
      Action: ['dynamodb:Query', 'dynamodb:PutItem'],
      Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}'
    }, {
      Effect: 'Allow',
      Action: ['dynamodb:Query'],
      Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}/index/${self:provider.environment.IMAGE_ID_INDEX}'
    }],
    lambdaHashingVersion: '20201221',
  },
  functions: {
    hello,
    getGroups,
    createGroup,
    getImages,
    getImage,
    createImage
  },
  resources: {
    Resources: {
      GroupsDynamoDBTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          AttributeDefinitions: [{
            AttributeName: 'id',
            AttributeType: 'S'
          }],
          KeySchema: [{
            AttributeName: 'id',
            KeyType: 'HASH'
          }],
          BillingMode: 'PAY_PER_REQUEST',
          TableName: '${self:provider.environment.GROUPS_TABLE}'
        }
      },
      ImagesDynamoDBTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          AttributeDefinitions: [{
            AttributeName: 'groupId',
            AttributeType: 'S'
          }, {
            AttributeName: 'timestamp',
            AttributeType: 'S'
          }, {
            AttributeName: 'imageId',
            AttributeType: 'S'
          }],
          KeySchema: [{
            AttributeName: 'groupId',
            KeyType: 'HASH'
          }, {
            AttributeName: 'timestamp',
            KeyType: 'RANGE'
          }],
          BillingMode: 'PAY_PER_REQUEST',
          TableName: '${self:provider.environment.IMAGES_TABLE}',
          GlobalSecondaryIndexes: [{
            IndexName: '${self:provider.environment.IMAGE_ID_INDEX}',
            KeySchema: [{
              AttributeName: 'imageId',
              KeyType: 'HASH'
            }],
            Projection: {
              ProjectionType: 'ALL'
            }
          }]
        }
      },
      AttachmentsBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: '${self:provider.environment.IMAGES_S3_BUCKET}',
          CorsConfiguration: {
            CorsRules: [{
              AllowedOrigins: ['*'],
              AllowedHeaders: ['*'],
              AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
              MaxAge: 3000
            }]
          }
        }
      },
      BucketPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
          PolicyDocument: {
            Id: 'MyPolicy',
            Version: "2012-10-17",
            Statement: [{
              Sid: 'PublicReadForGetBucketObjects',
              Effect: 'Allow',
              Principal: '*',
              Action: 's3:GetObject',
              Resource: 'arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}/*'
            }]
          },
          Bucket: { Ref: 'AttachmentsBucket' }
        }
      }
    }
  }
}

module.exports = serverlessConfiguration;
