/*
* These are cli tasks
*/

// Dependencies

var readline = require('readline');
var util = require('util');
var os = require('os');
var v8 = require('v8');
var childProcess = require('child_process');

var debug = util.debuglog('cli');
var events = require('events');

var _data = require('./data');
var _logs = require('./logs');
var helpers = require('./helpers');

class _events extends events{};
var e = new _events();

// Instantiate the CLI module object

var cli = {};

cli.init = function(){
    console.log('\x1b[34m%s\x1b[0m',`CLI is running`);

    //Start the interface
    var _interface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '>'
    });

    //create an initial prompt
    _interface.prompt();

    //Hanlde each line of input sepeartly
    _interface.on('line', function(str){
        cli.processInput(str);
        //Re-initialze the prompt
        _interface.prompt()
    });

    _interface.on('close', function(){
        process.exit(0);
    });
    
};

//Input handlers
e.on('man', function(str){
    cli.responsers.help();
});

e.on('help', function(str){
    cli.responsers.help();
});

e.on('exit', function(str){
    cli.responsers.exit();
});

e.on('stats', function(str){
    cli.responsers.stats();
});

e.on('list users', function(str){
    cli.responsers.listUsers();
});

e.on('more user info', function(str){
    cli.responsers.moreUserInfo(str);
});

e.on('list checks', function(str){
    cli.responsers.listChecks(str);
});

e.on('more check info', function(str){
    cli.responsers.moreCheckInfo(str);
});

e.on('list logs', function(str){
    cli.responsers.listLogs(str);
});

e.on('more log info', function(str){
    cli.responsers.moreLogInfo(str);
});

//Responsders
cli.responsers = {};

cli.responsers.help = () => {
    var commands = {
        'man':'show this help page',
        'help':'Show this help page',
        'exit':'Kill the CLI and rest of the application',
        'stats':'Get the statistics of underlying operating systems',
        'list users':'List of the registered users',
        'more user info --{userId}' : 'Details of specific user',
        'list checks --up --down': 'Show all checks. --up and --down optional',
        'more check info --{checkId}': 'Morwe infor about specific che ck',
        'list logs': 'List of logs to be read. compressed only',
        'more log info --{fileName}': 'Details of specified fileName'
    };
    
    cli.horizontalLine();
    cli.centered('CLI MANUAL');
    cli.horizontalLine();
    cli.verticalSpace(2);

    // Show each command, followed by its explanation

    for(var key in commands){
        if(commands.hasOwnProperty(key)){
            var value = commands[key];
            var line = '\x1b[33m'+key+'\x1b[0m';
            var padding = 60 - line.length;
            for(i=0; i < padding; i++){
                line+=' '
            }
            line+=value;
            console.log(line);
            cli.verticalSpace();
        }
    }

    cli.verticalSpace();
    cli.horizontalLine();
};

cli.horizontalLine = function(){
    // Get the available screen size;

    var width = process.stdout.columns;

    var line = '';

    for(i=0; i<width; i++){
        line+='-';
    }
    console.log(line);
};

cli.centered = function(str){
    str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : 0;
    var width = process.stdout.columns;

    var leftPadding = Math.floor((width - str.length) / 2);

    var line = '';
    for(var i=0;i<leftPadding;i++){
        line+= ' ';
    }
    line+=str;
    console.log(line);

};

cli.verticalSpace = function(lines){
    lines = typeof(lines) == 'number' && lines > 0? lines: 1;
    for(var i=0; i<lines; i++){
        console.log("");
    }
};

cli.responsers.exit = () => {
    process.exit(0);
};

cli.responsers.stats = () => {
    var stats = {
        'Load Average': os.loadavg().join(),
        'CPU Count': os.cpus().length,
        'Free Memory': os.freemem(),
        'Current Malloced Memory':v8.getHeapStatistics().malloced_memory,
        'Peak Malloced Memory': v8.getHeapStatistics().peak_malloced_memory,
        'Allocated Heap Used (%)': Math.round((v8.getHeapStatistics().used_heap_size/v8.getHeapStatistics().total_heap_size) * 100),
        'Allocated Heap Allocated (%)': Math.round((v8.getHeapStatistics().total_heap_size/v8.getHeapStatistics().heap_size_limit) * 100),
        'Uptime': os.uptime() + ' seconds'
    };

    cli.horizontalLine();
    cli.centered('SYSTEM STATISTICS');
    cli.horizontalLine();
    cli.verticalSpace(2);

    for(var key in stats){
        if(stats.hasOwnProperty(key)){
            var value = stats[key];
            var line = '\x1b[33m'+key+'\x1b[0m';
            var padding = 60 - line.length;
            for(i=0; i < padding; i++){
                line+=' '
            }
            line+=value;
            console.log(line);
            cli.verticalSpace();
        }
    }

    cli.verticalSpace();
    cli.horizontalLine();

};

cli.responsers.listUsers = () => {
    _data.list('users', function(err, usersIds){
        if(!err && usersIds && usersIds.length > 0){
            cli.verticalSpace();
            usersIds.forEach(function(userId){
                _data.read('users', userId, function(err, userData){
                    if(!err && userData){
                        var line = 'Name: '+userData.firstName+ ' '+ userData.lastName+ ' '+ userData.phone+ ' checks:';
                        var numberofChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array && userData.checks.length > 0 ? userData.checks.length: 0;
                        line+=numberofChecks;
                        console.log(line);
                        cli.verticalSpace();
                    }
                });
            });
        }
    });
};

cli.responsers.moreUserInfo = (str) => {
    // get the id from the string provide to us

    var arr = str.split('--');
    var userId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim(): false;

    _data.read('users', userId, function(err, userData){
        if(!err && userData){
            // Remove the hashed password
            delete userData.hashedPassword;

            //Print the JSON with text highlighting
            cli.verticalSpace();
            console.dir(userData, {'colors': true});
            cli.verticalSpace();
        }
    });

};

cli.responsers.moreCheckInfo = (str) => {
    // get the id from the string provide to us

    var arr = str.split('--');
    var checkId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim(): false;

    _data.read('checks', checkId, function(err, checkData){
        if(!err && checkData){
            //Print the JSON with text highlighting
            cli.verticalSpace();
            console.dir(checkData, {'colors': true});
            cli.verticalSpace();
        }
    });

};

cli.responsers.listChecks = (str) => {
    _data.list('checks', function(err, checkIds){
        if(!err && checkIds && checkIds.length > 0){
            cli.verticalSpace();
            checkIds.forEach(function(checkId){
                _data.read('checks', checkId, function(err, checkData){
                    var includeCheck = false;
                    var lowerString = str.toLowerCase();

                    // Get the state, default to down
                    var state = typeof(checkData.state) == 'string'? checkData.state: 'down';

                    var stateOrUnknown = typeof(checkData.state) == 'string'? checkData.state: 'unknown';

                    if(lowerString.indexOf('--'+state) > -1 || (lowerString.indexOf('--down') == -1 && lowerString.indexOf('--up') == -1)){
                        var line = 'ID: '+ checkData.id + '  ' +checkData.method.toUpperCase()+' '+ checkData.protocol + ' '+ checkData.url;
                        console.log(line);
                        cli.verticalSpace();
                    }
                });
            });
        }
    });
};

cli.responsers.listLogs = (str) => {
    var ls = childProcess.spawn('ls', ['./.logs/']);
    ls.stdout.on('data', function(dataObject){
        var dataStr = dataObject.toString();
        var logFileNames = dataStr.split('\n');
        cli.verticalSpace();
        logFileNames.forEach(function(logFileName){
            if(typeof(logFileName) == 'string' && logFileName.length > 0 && logFileName.indexOf('-') > -1){
                console.log(logFileName.trim().split('.')[0]);
                cli.verticalSpace();
            }
        });
    });
};



cli.responsers.moreLogInfo = (str) => {
    // get the logFileName from the string provide to us

    var arr = str.split('--');
    var logFileName = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim(): false;
    debugger;
    if(logFileName){
        cli.verticalSpace();
        // Decompress the log file
        _logs.decompress(logFileName, function(err, strData){
            if(!err && strData){
                 var arr = strData.split('\n');
                 arr.forEach(function(jsonString){
                    var logObject = helpers.pasreJsonToObject(jsonString);
                    if(logObject && JSON.stringify(logObject) !== '{}'){
                        console.dir(logObject, {'colors': true});
                        cli.verticalSpace();

                    }
                 });
            }
        });

    }

};

//Input processor
cli.processInput = (str) => {
    str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim(): false;
    if(str){
        // codify the unique strings that identify the unique questions allowed to be asked
        var uniqueInputs = [
            'man',
            'help',
            'exit',
            'stats',
            'list users',
            'more user info',
            'list checks',
            'more check info',
            'list logs',
            'more log info'
        ];

        // go through possible inputs, emit an event when a match found.
        var matchFound = false;
        var counter = 0;
        debugger;
        uniqueInputs.some(function(input){
            if(str.toLowerCase().indexOf(input) > -1){
                matchFound = true;
                // Emit an event matching unique input
                e.emit(input, str);
                return true;
            }
        });

        // if no found, tell the user to prompt again
        if(!matchFound){
            console.log(`${str} is not a valid command`);
        }
        
    }
};

module.exports = cli;

