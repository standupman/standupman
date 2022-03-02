import * as fs from 'fs'

import swaggerJSDoc from 'swagger-jsdoc';
import swaggerJSDocOptions from './swaggerJSDocOptions.js';

const openapiSpecification = swaggerJSDoc(swaggerJSDocOptions);

fs.writeFileSync("./api-doc.json", JSON.stringify(openapiSpecification));

console.log("\nOpenapi spec generated in api-doc.json");
