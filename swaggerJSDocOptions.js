const swaggerJSDocOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Standupman API',
        version: '1.0.0',
      },
      definitions: {
        Standup: {
          type: "object",
          required: [
            "name", "completionTime", "questions"
          ],
          properties: {
            user_id: {
              type: "string"
            },
            name: {
              type: "string"
            },
            description: {
              type: "string"
            },
            completionTime: {
              type: "date"
            },
            questions: {
              $ref: "#/definitions/Question"
            }
          },
        },
        Question: {
          type: "object",
          required: ["title", "response_type"],
          properties: {
            title: {
              type: "string"
            },
            response_type: {
              type: "string"
            }
          }
        },
        StandupUpdate: {
          type: "object",
          required: ["standup_id", "user_id", "responseTime", "answers"],
          properties: {
            standup_id: {
              type: "string"
            },
            user_id: {
              type: "string"
            },
            responseTime: {
              type: "date"
            },
            answers: {
              type: "object"
            }
          }
        },
        User: {
          type: "object",
          required: ["username", "email", "full_name", "password"],
          properties: {
            username: {
              type: "string"
            },
            email: {
              type: "string"
            },
            full_name: {
              type: "string"
            },
            password: {
              type: "string"
            },
            created_at: {
              type: "date"
            },
            updated_at: {
              type: "date"
            },
            standups: {
              type: "array",
              items: {
                $ref: "#/definitions/Standup"
              }
            }
          }
        },
        Login: {
          type: "object",
          required: ["username", "password"],
          properties: {
            "username": { "type": "string" },
            "password": { "type": "string" },
            "path": { "type": "string" }
          }
        },
        Register: {
          type: "object",
          required: ["username", "password", "email"],
          properties: {
            "username": { "type": "string" },
            "password": { "type": "string" },
            "email": { "type": "string" }
          }
        }
      },
      tags: [
        {
          name: "Authentication",
          description: "Authentication"
        },
        {
          name: "Standup",
          description: "Standup"
        },
        {
          name: "Public",
          description: "Public"
        },
        {
          name: "User",
          description: "User"
        }
      ],
      basicAuth: {
        name: 'Authorization',
        schema: {
          type: 'basic',
        }
      },
      components: {
        securitySchemes: {
          basicAuth: {
            type:   'http',
            scheme: 'basic'
          }
        }
      }
    },
    apis: ['./routes/web.js'], // files containing annotations as above
  };

export default swaggerJSDocOptions;
