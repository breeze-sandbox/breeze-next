import rollup      from 'rollup';
import multiEntry  from 'rollup-plugin-multi-entry';

export default {
  entry: [
      './src/breeze.js',
      './src/interface-registry',
      './src/adapter-ajax-jquery',
      './src/adapter-ajax-angular',
      './src/adapter-model-library-backing-store',
      './src/adapter-data-service-webapi',
      './src/adapter-uri-builder-odata',
      './src/adapter-uri-builder-json',
      ],

  dest: 'build/breeze.es2015.js', // must be transpiled after
  moduleName: 'breeze',
  sourceMap: true,
  format: 'iife',
  plugins: [
      multiEntry()
  ]
}
