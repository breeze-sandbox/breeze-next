var rollup = require( 'rollup' );

var args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Usage: " + process.argv[0] + " " + process.argv[1] + " [filenameRoot] [moduleName]\n" + 
  "Example: node rollup.single.js adapter-ajax-angular breezeAjaxAngular");
  return;
}

// get from command-line arguments
var root = args[0];   // 'adapter-ajax-angular';
var moduleName = args[1]; // 'breezeAjaxAngular';

var src = './src/' + root + '.js';
var dest = './temp/' + root + '.es2015.js'; // must be transpiled after
var format = 'umd';

rollup.rollup({
  // path to main entry point
  entry: src,

  // which related modules to keep out of this bundle
  external: function(id) { console.log(id); return id !== src; },

}).then( function ( bundle ) {

  // Generate bundle + sourcemap
  return bundle.write({
    format: 'umd',
    // name of module (for umd/iife bundles)
    moduleName: moduleName,
    dest: dest,
    sourceMap: true
  });
}).then(function() {
    console.log("wrote " + dest);
}).catch(function(err) { 
    console.log(err); 
});