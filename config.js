/*
* Create and export configuration variables
*/

//Container for all the enviornments

var enviroments = {};

//staging (default) environment
enviroments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging'
}

//production environment
enviroments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production'
}

var currentEnviroment = typeof(process.env.NODE_ENV) == 'string'? process.env.NODE_ENV.toLocaleLowerCase(): '';

//check that the current enviroment is one of the enviroment above, if not, default to staging
var enviromentToExport = typeof(enviroments[currentEnviroment]) == 'object'? enviroments[currentEnviroment]: enviroments.staging;

module.exports = enviromentToExport

