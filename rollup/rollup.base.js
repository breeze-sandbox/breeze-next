import rollup      from 'rollup';
import multiEntry  from 'rollup-plugin-multi-entry';

export default {
  entry: [
      './src/breeze.js',
      './src/interface-registry.js'
      ],

  dest: './temp/breeze.base.es2015.js', // must be transpiled after
  moduleName: 'breeze',
  sourceMap: true,
  format: 'iife',
  plugins: [
      multiEntry()
  ]
}
