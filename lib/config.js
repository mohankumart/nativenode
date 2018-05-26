/*
* Create and export configuration variables
*/

//Container for all the enviornments

var enviroments = {};

//staging (default) environment
enviroments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging',
    'hashingSecret': 'thisIsASecret',
    'maxChecks': 5,
    'twilio': {
        'accountSid': 'AC37f5a1198500242af5207c7c14a316b6',
        'authToken': '36264563d9ea85bbc5b149f5dedbaf1a',
        'fromPhone': '+18084004229'
    },
    'templatesGlobals': {
        'appName': 'UptimeChecker',
        'companyName': 'NotARealCompnay, Inc',
        'yearCreated': '2018',
        'baseUrl': 'http://localhost:3000/'
    }
}

//production environment
enviroments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
    'hashingSecret': 'thisIsASecret',
    'maxChecks': 5,
    'twilio': {
        'accountSid': 'AC37f5a1198500242af5207c7c14a316b6',
        'authToken': '36264563d9ea85bbc5b149f5dedbaf1a',
        'fromPhone': '+18084004229'
    },
    'templatesGlobals': {
        'appName': 'UptimeChecker',
        'CompanyName': 'NotARealCompnay, Inc',
        'yearCreated': '2018',
        'baseUrl': 'http://localhost:3000/'
    }
}

var currentEnviroment = typeof(process.env.NODE_ENV) == 'string'? process.env.NODE_ENV.toLocaleLowerCase(): '';

//check that the current enviroment is one of the enviroment above, if not, default to staging
var enviromentToExport = typeof(enviroments[currentEnviroment]) == 'object'? enviroments[currentEnviroment]: enviroments.staging;

module.exports = enviromentToExport

