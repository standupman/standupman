const swaggerJSDocOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'StandupmMan API',
      description: 'OpenAPI Annotations for StandupMan API',
      contact: {
        name: 'StandupMan Support',
        url: 'http://standupman.xyz',
        email: 'support@standupman.xyz',
      },
      license: {
        name: 'MIT License',
        url: 'https://github.com/standupman/standupman/blob/master/LICENSE.md',
      },
      version: '1.0.0',
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication',
      },
      {
        name: 'Standup',
        description: 'Standup',
      },
      {
        name: 'Public',
        description: 'Public',
      },
      {
        name: 'User',
        description: 'User',
      },
    ],
    basicAuth: {
      name: 'Authorization',
      schema: {
        type: 'basic',
      },
    },
    components: {
      schemas: {
        Standup: {
          type: 'object',
          required: [
            'name', 'completionTime', 'questions',
          ],
          properties: {
            user_id: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            completionTime: {
              type: 'string',
            },
            questions: {
              type: 'object',
              properties: {
                question_x: {
                  $ref: '#/components/schemas/StandupQuestion',
                },
              },
            },
          },
        },
        StandupQuestion: {
          type: 'object',
          required: ['title', 'response_type'],
          properties: {
            title: { type: 'string' },
            response_type: { type: 'string' },
          },
        },
        StandupResponse: {
          type: 'object',
          required: ['standup_id', 'user_id', 'responseTime', 'answers'],
          properties: {
            standup_id: {
              type: 'string',
            },
            user_id: {
              type: 'string',
            },
            responseTime: {
              type: 'string',
            },
            answers: {
              type: 'object',
              properties: {
                answer_x: {
                  $ref: '#/components/schemas/StandupResponseAnswer',
                },
              },
            },
          },
        },
        StandupResponseAnswer: {
          type: 'object',
          required: ['question_id', 'response'],
          properties: {
            question_id: { type: 'string' },
            response: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          required: ['username', 'email', 'full_name', 'password'],
          properties: {
            configs: {
              type: 'object',
            },
            standups: {
              type: 'array',
            },
            username: {
              type: 'string',
            },
            email: {
              type: 'string',
            },
            full_name: {
              type: 'string',
            },
            password: {
              type: 'string',
            },
          },
        },
        Login: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string' },
            password: { type: 'string' },
            path: { type: 'string' },
          },
        },
      },
      requestBodies: {
        CreateStandupReq: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Standup',
              },
              examples: {
                basic: {
                  $ref: '#/components/examples/basic_standup_req',
                },
              },
            },
          },
        },
        UpdateStandupReq: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Standup',
              },
              examples: {
                basic: {
                  $ref: '#/components/examples/basic_standup_req',
                },
              },
            },
          },
        },
        CreateStandupResponseReq: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/StandupResponse',
              },
              examples: {
                basic: {
                  $ref: '#/components/examples/basic_standup_response_req',
                },
              },
            },
          },
        },
        StandupSubscriptionReq: {
          content: {
            'application/json': {
              schema: {},
              examples: {
                basic: {
                  $ref: '#/components/examples/standup_subscription_req',
                },
              },
            },
          },
        },
        LoginReq: {
          content: {
            'application/json': {
              schema: {},
              examples: {
                basic: {
                  value: {
                    username: 'standupman',
                    password: 'standupman',
                  },
                },
              },
            },
          },
        },
      },
      securitySchemes: {
        basicAuth: {
          type: 'http',
          scheme: 'basic',
        },
      },
      examples: {
        basic_standup_req: {
          value: {
            standup: {
              name: 'Daily Standup Team 1',
              completionTime: '02/19/2022',
              questions: {
                question_1: {
                  title: 'What did you do today',
                  response_type: 'String',
                },
                question_2: {
                  title: 'How many hours did you work today',
                  response_type: 'String',
                },
                question_3: {
                  title: 'What will you work on till the next standup',
                  response_type: 'String',
                },
              },
            },
          },
        },
        basic_standup_res: {
          value: {
            standup: {
              _id: '623b3979878b38d7c5bd6319',
              name: 'Daily Standup Team 1',
              completionTime: '02/19/2022',
              questions: {
                question_1: {
                  title: 'What did you do today',
                  response_type: 'String',
                },
                question_2: {
                  title: 'How many hours did you work today',
                  response_type: 'String',
                },
                question_3: {
                  title: 'What will you work on till the next standup',
                  response_type: 'String',
                },
              },
            },
          },
        },
        basic_standup_response_req: {
          value: {
            standup_update: {
              standup_id: '62440d1b34b322b052e68c45',
              user_id: '624402f8407effaf82a5cc38',
              answers: {
                answer_1: {
                  question_id: 'question_1',
                  response: "Troubleshoot faulty API endpoint at '/help/me'",
                },
                answer_2: {
                  question_id: 'question_2',
                  response: 'I will be working to fix another broken endpoint',
                },
              },
            },
          },
        },
        basic_standup_response_res: {
          value: {
            standUpUpdate: {
              _id: '627171efd474219153974c5c',
              standup_id: '62440d1b34b322b052e68c45',
              user_id: '624402f8407effaf82a5cc38',
              answers: {
                answer_1: {
                  question_id: 'question_1',
                  response: "Troubleshoot faulty API endpoint at '/help/me'",
                },
                answer_2: {
                  question_id: 'question_2',
                  response: 'I will be working to fix another broken endpoint',
                },
              },
              responseTime: '2022-05-03T18:18:23.818Z',
            },
          },
        },
        standup_subscription_req: {
          value: {
            standup_id: '625fcba32291afeb6416dcf4',
          },
        },
        standup_subscription_res: {
          value: {
            success: true,
            user: {
              _id: '6260783cb0cd0d4e797c84d3',
              configs: {
                notification: {
                  destination: 'email',
                },
              },
              standups: [
                '625fcba32291afeb6416dcf4',
              ],
              username: 'standupman',
              email: 'standupman@gmail.com',
              full_name: 'standupman',
              password: '$2b$10$O8Rkm5IIkXjyhD2QmUyp4Owl8ahTKfds5nQ4KvSMcCuboZ.oHcmWK',
            },
          },
        },
        standup_unsubscription_res: {
          value: {
            success: true,
            user: {
              _id: '6260783cb0cd0d4e797c84d3',
              configs: {
                notification: {
                  destination: 'email',
                },
              },
              standups: [],
              username: 'standupman',
              email: 'standupman@gmail.com',
              full_name: 'standupman',
              password: '$2b$10$O8Rkm5IIkXjyhD2QmUyp4Owl8ahTKfds5nQ4KvSMcCuboZ.oHcmWK',
            },
          },
        },
      },
    },
  },
  apis: ['./routes/web.js'], // files containing annotations as above
};

export default swaggerJSDocOptions;
