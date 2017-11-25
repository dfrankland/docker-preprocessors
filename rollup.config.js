import babel from 'rollup-plugin-babel';
import glob from 'glob';
import { resolve as resolvePath, dirname } from 'path';

const plugins = () => [
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
];

export default glob.sync((
  resolvePath(__dirname, './packages/*/package.json')
)).map((packageJsonPath) => {
  const {
    main,
    dependencies = {},
    devDependencies = {},
  } = require(packageJsonPath); // eslint-disable-line global-require, import/no-dynamic-require
  const dir = dirname(packageJsonPath);
  return {
    input: resolvePath(dir, './src/index.js'),
    output: {
      file: resolvePath(dir, main),
      format: 'cjs',
      sourceMaps: true,
    },
    external: [
      ...Object.keys(dependencies),
      ...Object.keys(devDependencies),
      'path',
      'fs',
    ],
    plugins: plugins(),
  };
});
