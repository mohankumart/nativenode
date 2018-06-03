var repl = require('repl');

// start the repl

repl.start({
    'promt': '>',
    'eval': function(str){
        console.log('We are evaluation string', str);

        if(str.indexOf('fizz') > -1){
            console.log('buzz');
        }
    }

});