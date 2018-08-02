/* 
* Create and export config variables
*/

// Container for all the enviroments 
const enviroments = {};

// Staging [Default] enviroment
enviroments.staging = {
    'port' : 3000,
    'envName' : 'staging'
}

// Production enviroment
enviroments.production = {
    'port' : 5000,
    'envName' : 'production'
}

// Determine which enviroment to export based upond the command line variable passed in NODE_ENV
const currentEnviroment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// check that the enviroment exsists otherwise default to staging

const enviromentExport = typeof(enviroments[currentEnviroment]) == 'object' ? enviroments[currentEnviroment] : enviroments.staging;

// export the module

module.exports = enviromentExport;