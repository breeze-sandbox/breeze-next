var fs = require("fs-extra");
var isDifferent = require("./build-util").isDifferent;
var run = require("./build-util").run;

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
  " && npm run tsc-es5 -- --out temp/" + root + ".js temp/" + root + ".es2015.js";

var mincmd = "npm run minify -- --output temp/" + root + ".min.js temp/" + root + ".js";

var srcName = "temp/" + root + ".js";
var destName = "build/" + root + ".js";
var srcMin = "temp/" + root + ".min.js";
var destMin = "build/" + root + ".min.js";

run(cmd, function () {
  if (isDifferent(srcName, destName)) {
    fs.copySync(srcName, destName);

    run(mincmd, function () {
      if (isDifferent(srcMin, destMin)) {
        fs.copySync(srcMin, destMin);
      }
    })
  }
})

