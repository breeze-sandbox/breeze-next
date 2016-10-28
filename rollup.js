import rollup      from 'rollup';
import multiEntry  from 'rollup-plugin-multi-entry';

export default {
  entry: [
        './src/entity-manager.js',
        './src/relation-array.js',
        './src/primitive-array.js',
        './src/complex-array.js'
      ],

  dest: 'build/breeze.es2015.js', // must be transpiled after
  moduleName: 'breeze',
  sourceMap: true,
  format: 'iife',
  plugins: [
      multiEntry()
  ]
}
