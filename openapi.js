import * as fs from 'fs';

import swaggerJSDoc from 'swagger-jsdoc';
import swaggerJSDocOptions from './swaggerJSDocOptions';

const openapiSpecification = swaggerJSDoc(swaggerJSDocOptions);

fs.writeFileSync('./openapi.json', JSON.stringify(openapiSpecification));

console.log('\nOpenAPI spec generated in openapi.json');
