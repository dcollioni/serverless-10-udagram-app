import type { AWS } from '@serverless/typescript';

import {
  hello,
  getGroups,
  createGroup,
  getImages,
  getImage,
  createImage,
  sendNotification,
  connect,
  disconnect,
  // elasticsearchSync,
  resizeImage,
  auth0Authorizer,
  rs256Auth0Authorizer } from './src/functions';

const serverlessConfiguration: AWS = {
  service: 'service-10-udagram-app',
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true
    },
    topicName: 'imagesTopic-${self:provider.stage}',
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
    },
    'serverless-offline': {
      port: 3003
    },
    dynamodb: {
      start: {
        port: 8000,
        inMemory: true,
        migrate: true
      },
      stages: [
        'dev'
      ]
    }
  },
  plugins: [
    'serverless-webpack',
    'serverless-dynamodb-local',
    'serverless-offline',
    'serverless-plugin-canary-deployments',
    'serverless-iam-roles-per-function'
  ],
  package: {
    individually: true
  },
  provider: {
    name: 'aws',
    runtime: 'nodejs12.x',
    stage: 'dev',
    region: 'eu-west-1',
    tracing: {
      lambda: true,
      apiGateway: true
    },
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      GROUPS_TABLE: 'Groups-${self:provider.stage}',
      IMAGES_TABLE: 'Images-${self:provider.stage}',
      CONNECTIONS_TABLE: 'Connections-${self:provider.stage}',
      IMAGE_ID_INDEX: 'ImageIdIndex',
      IMAGES_S3_BUCKET: 'dcollioni-serverless-udagram-images-${self:provider.stage}',
      SIGNED_URL_EXPIRATION: '300',
      THUMBNAILS_S3_BUCKET: 'dcollioni-serverless-udagram-thumbnail-${self:provider.stage}',
      AUTH_0_SECRET_ID: 'Auth0Secret-${self:provider.stage}',
      AUTH_0_SECRET_FIELD: 'auth0Secret'
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
    }, {
      Effect: 'Allow',
      Action: ['s3:PutObject', 's3:GetObject'],
      Resource: 'arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}/*'
    }, {
      Effect: 'Allow',
      Action: ['s3:PutObject'],
      Resource: 'arn:aws:s3:::${self:provider.environment.THUMBNAILS_S3_BUCKET}/*'
    }, {
      Effect: 'Allow',
      Action: ['dynamodb:Scan', 'dynamodb:PutItem', 'dynamodb:DeleteItem'],
      Resource: 'arn:aws:dynamodb:${opt:region, self:provider.region}:*:table/${self:provider.environment.CONNECTIONS_TABLE}'
    }, {
      Effect: 'Allow',
      Action: ['secretsmanager:GetSecretValue'],
      Resource: { Ref: 'Auth0Secret' }
    }, {
      Effect: 'Allow',
      Action: ['kms:Decrypt'],
      Resource: {"Fn::GetAtt": ["KMSKey", "Arn"] }
    }, {
      Effect: 'Allow',
      Action: ['codedeploy:*'],
      Resource: ['*']
    }],
    lambdaHashingVersion: '20201221',
  },
  functions: {
    hello,
    getGroups,
    createGroup,
    getImages,
    getImage,
    createImage,
    sendNotification,
    connect,
    disconnect,
    // elasticsearchSync,
    resizeImage,
    auth0Authorizer,
    rs256Auth0Authorizer
  },
  resources: {
    Resources: {
      GatewayResponseDefault4XX: {
        Type: 'AWS::ApiGateway::GatewayResponse',
        Properties: {
          ResponseParameters: {
            'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
            'gatewayresponse.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            'gatewayresponse.header.Access-Control-Allow-Methods': "'GET,OPTIONS,POST'"
          },
          ResponseType: 'DEFAULT_4XX',
          RestApiId: {
            Ref: 'ApiGatewayRestApi'
          }
        }
      },
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
          StreamSpecification: {
            StreamViewType: 'NEW_IMAGE'
          },
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
      WebSocketConnectionsDynamoDBTable: {
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
          TableName: '${self:provider.environment.CONNECTIONS_TABLE}'
        }
      },
      AttachmentsBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: '${self:provider.environment.IMAGES_S3_BUCKET}',
          NotificationConfiguration: {
            TopicConfigurations: [{
              Event: 's3:ObjectCreated:Put',
              Topic: { Ref: 'ImagesTopic' }
            }]
          },
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
      },
      SendUploadNotitificationsPermission: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
          FunctionName: { Ref: 'SendNotificationLambdaFunction' },
          Principal: 's3.amazonaws.com',
          Action: 'lambda:InvokeFunction',
          SourceAccount: { Ref: 'AWS::AccountId' },
          SourceArn: 'arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}'
        }
      },
      // ImagesSearch: {
      //   Type: 'AWS::Elasticsearch::Domain',
      //   Properties: {
      //     ElasticsearchVersion: '6.3',
      //     DomainName: 'images-search-${self:provider.stage}',
      //     ElasticsearchClusterConfig: {
      //       DedicatedMasterEnabled: false,
      //       InstanceCount: '1',
      //       ZoneAwarenessEnabled: false,
      //       InstanceType: 't2.small.elasticsearch'
      //     },
      //     EBSOptions: {
      //       EBSEnabled: true,
      //       Iops: 0,
      //       VolumeSize: 10,
      //       VolumeType: 'gp2'
      //     },
      //     AccessPolicies: {
      //       Version: '2012-10-17',
      //       Statement: [{
      //         Effect: 'Allow',
      //         Principal: {
      //           AWS: '*'
      //         },
      //         Resource: "arn:aws:es:${self:provider.region}:911876997465:domain/images-search-${self:provider.stage}/*",
      //         Action: 'es:*'
      //       }]  
      //     }
      //   }
      // },
      SNSTopicPolicy: {
        Type: 'AWS::SNS::TopicPolicy',
        Properties: {
          PolicyDocument: {
            Version: "2012-10-17",
            Statement: [{
              Effect: 'Allow',
              Principal: {
                AWS: "*"
              },
              Action: 'sns:Publish',
              Resource: {
                Ref: 'ImagesTopic'
              },
              Condition: {
                ArnLike: {
                  'AWS:SourceArn': 'arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}'
                }
              }
            }]
          },
          Topics: [{
            Ref: 'ImagesTopic'
          }]
        }
      },
      ImagesTopic: {
        Type: 'AWS::SNS::Topic',
        Properties: {
          DisplayName: 'Image bucket topic',
          TopicName: '${self:custom.topicName}'
        }
      },
      ThumbnailsBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: '${self:provider.environment.THUMBNAILS_S3_BUCKET}'
        }
      },
      KMSKey: {
        Type: "AWS::KMS::Key",
        Properties: {
          Description: "KMS key to encrypt Auth0 secret",
          KeyPolicy: {
            Version: "2012-10-17",
            Id: "key-default-1",
            Statement: [{
              Sid: "Allow administration of the key",
              Effect: "Allow",
              Principal: {
                AWS: {
                  "Fn::Join": [
                    ":",
                    [
                      'arn:aws:iam:',
                      { Ref: 'AWS::AccountId' },
                      'root'
                    ]
                  ]
                }
              },
              Action: [
                "kms:*"
              ],
              Resource: "*"
            }]
            }
          }
      },
      KMSKeyAlias: {
        Type: 'AWS::KMS::Alias',
        Properties: {
          AliasName: 'alias/auth0Key-${self:provider.stage}',
          TargetKeyId: { Ref: 'KMSKey' }
        }
      },
      Auth0Secret: {
        Type: 'AWS::SecretsManager::Secret',
        Properties: {
          Name: '${self:provider.environment.AUTH_0_SECRET_ID}',
          Description: 'Auth0 secret',
          KmsKeyId: { Ref: 'KMSKey' }
        }
      }
    }
  }
}

module.exports = serverlessConfiguration;
