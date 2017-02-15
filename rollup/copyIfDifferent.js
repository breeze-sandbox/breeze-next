/** 
 * Copy file but only if content is different
 */
var fs = require("fs-extra");
var isDifferent = require("./build-util").isDifferent;

var args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Usage: " + process.argv[0] + " " + process.argv[1] + " [srcfile] [destfile]\n" + 
  "Copies srcfile to destfile, if content of src is different from dest.");
  return;
}

var srcName = args[0];
var destName = args[1];

if (!fs.existsSync(srcName)) {
  console.error("Source file '" + srcName + "' does not exist.");
  return;
}

if (isDifferent(srcName, destName)) {
  fs.copySync(srcName, destName);
}
return;

