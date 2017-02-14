var exec = require('child_process').exec;

var args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Usage: " + process.argv[0] + " " + process.argv[1] + " [filenameRoot] [moduleName]\n" + 
  "Example: node rollup-module.js adapter-ajax-angular breezeAjaxAngular");
  return;
}

// get from command-line arguments
var root = args[0];   // 'adapter-ajax-angular';
var moduleName = args[1]; // 'breezeAjaxAngular';

var cmd = "node rollup/rollup-single.js " + root + " " + moduleName + 
  " && npm run tsc-es5 -- --out build/" + root + ".js temp/" + root + ".es2015.js" + 
  " && npm run minify -- --output build/" + root + ".min.js build/" + root + ".js";

exec(cmd, function(error, stdout, stderr) {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
        console.log('exec error: ' + error);
    }
});