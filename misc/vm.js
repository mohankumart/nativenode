/**
 * Example VM
 */

var vm = require('vm');

var context = {
    foo: 25
};

var script = new vm.Script(`

    foo = foo * 25;
    var bar = foo + 1;
    var fizz = 52;

`);


// Run the script

script.runInNewContext(context);

console.log(context);

