import rollup      from 'rollup';
import multiEntry  from 'rollup-plugin-multi-entry';
import { banner }  from './banner';

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

  dest: './temp/breeze.full.es2015.js', // must be transpiled after
  moduleName: 'breeze',
  sourceMap: true,
  format: 'umd',
  banner: banner,
  plugins: [
      multiEntry()
  ]
}
