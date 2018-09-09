/* 
* Create and export config variables
*/

// Container for all the enviroments
const enviroments = {};

// Staging [Default] enviroment
enviroments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: "staging",
  hashingSecret: "this is a secret",
  maxChecks: 5
};

// Production enviroment
enviroments.production = {
  port: 5000,
  httpsPort: 5001,
  envName: "production",
  hashingSecret: "this is a Prod secret",
  maxChecks: 5
};

// Determine which enviroment to export based upond the command line variable passed in NODE_ENV
const currentEnviroment =
  typeof process.env.NODE_ENV == "string"
    ? process.env.NODE_ENV.toLowerCase()
    : "";

// check that the enviroment exsists otherwise default to staging

const enviromentExport =
  typeof enviroments[currentEnviroment] == "object"
    ? enviroments[currentEnviroment]
    : enviroments.staging;

// export the module

module.exports = enviromentExport;
