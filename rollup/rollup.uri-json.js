import rollup      from 'rollup';

var root = 'adapter-uri-builder-json';
var moduleName = 'breezeUriJson';

var src = './src/' + root + '.js';
export default {
  entry: src,
  external: function(id) { console.log(id); return id !== src; },
  dest: './temp/' + root + '.es2015.js', // must be transpiled after
  moduleName: moduleName,
  sourceMap: true,
  format: 'umd'
}
