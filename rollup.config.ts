import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import sourceMaps from 'rollup-plugin-sourcemaps';
import camelCase from 'lodash.camelcase';
import typescript from 'rollup-plugin-typescript2';
import json from 'rollup-plugin-json';

const pkg = require('./package.json');

const libraryName = 'create-mobx-container';

export default {
  input: `src/${libraryName}.tsx`,
  output: [
    { file: pkg.main, name: camelCase(libraryName), format: 'umd' },
    { file: pkg.module, format: 'es' }
  ],
  sourcemap: true,
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  external: ['mobx', 'mobx-react', 'react', 'react-dom'],
  watch: {
    include: 'src/**'
  },
  plugins: [
    // Allow json resolution
    json(),
    // Compile TypeScript files
    typescript({ useTsconfigDeclarationDir: true }),
    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
    commonjs({
      include: 'node_modules/**',
      namedExports: {
        'node_modules/react/index.js': [
          'Component',
          'PureComponent',
          'Fragment',
          'Children',
          'createElement'
        ],
        'node_modules/react-dom/index.js': ['findDOMNode', 'unstable_batchedUpdates']
      }
    }),
    // Allow node_modules resolution, so you can use 'external' to control
    // which external modules to include in the bundle
    // https://github.com/rollup/rollup-plugin-node-resolve#usage
    resolve(),

    // Resolve source maps to the original source
    sourceMaps()
  ]
};
