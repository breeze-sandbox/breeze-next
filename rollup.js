import rollup      from 'rollup';
import multiEntry  from 'rollup-plugin-multi-entry';

export default {
  entry: [
      './src/breeze.js',
      './src/interface-registry.js',
      './src/adapter-ajax-jquery.js',
      './src/adapter-ajax-angular.js',
      './src/adapter-model-library-backing-store.js',
      './src/adapter-data-service-webapi.js',
      './src/adapter-uri-builder-odata.js',
      './src/adapter-uri-builder-json.js',
      ],

  dest: 'build/breeze.es2015.js', // must be transpiled after
  moduleName: 'breeze',
  sourceMap: true,
  format: 'iife',
  plugins: [
      multiEntry()
  ]
}
