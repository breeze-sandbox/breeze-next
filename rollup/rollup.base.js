import rollup      from 'rollup';
import multiEntry  from 'rollup-plugin-multi-entry';
import { banner }  from './banner';

export default {
  entry: [
      './src/breeze.js',
      './src/interface-registry.js',
      './src/abstract-data-service-adapter.js'
      ],

  dest: './temp/breeze.base.es2015.js', // must be transpiled after
  moduleName: 'breeze',
  sourceMap: true,
  format: 'umd',
  banner: banner,
  plugins: [
      multiEntry()
  ]
}
