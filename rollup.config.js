import babel from 'rollup-plugin-babel';
import { dependencies } from './package.json';

export default {
  input: './src/index.js',
  external: [
    ...Object.keys(dependencies),
    'path',
  ],
  plugins: [
    babel({
      babelrc: false,
      sourceMaps: true,
      presets: [
        [
          'env',
          {
            modules: false,
            targets: {
              node: '6',
            },
          },
        ],
        'stage-0',
      ],
      plugins: [
        ['external-helpers'],
      ],
    }),
  ],
  output: {
    format: 'cjs',
    file: './dist/index.js',
    sourceMaps: true,
  },
};
