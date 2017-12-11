# docker-loader

A [Webpack][webpack] loader that wraps
[`docker-preprocessor`][docker-preprocessor].

[webpack]: https://webpack.js.org/

## Install

```bash
npm install --save-dev docker-loader
```

## [Usage][webpack-loader-concepts]

[webpack-loader-concepts]: https://webpack.js.org/concepts/loaders/

`docker-loader` is for tasks that require lots of setup or configuration of the
host machine. A good example is compiling C++ to WebAssembly (wasm), which
requires Emscripten to be compiled, configured, and installed.

This can also be used for multiple times within a configuration for different
file types, allowing for easy seperation of concerns via Docker containers.

**file.js**

```js
import wasmModule from 'file.cpp';
```

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.cpp?$/,
        use: [
          {
            loader: 'wasm-module-loader',
          },
          {
            loader: 'docker-loader',
            options: {
              image: 'apiaryio/emcc',
              createOptions: {
                Binds: ['/:/host'],
              },
              command: path => [
                'sh',
                '-c',
                `
                  emcc \
                    /host${path} \
                    -g \
                    -Os \
                    -s WASM=1 \
                    -s SIDE_MODULE=1 \
                    -s ONLY_MY_CODE=1 \
                    -o targetCpp.wasm \
                  ;
                `,
              ],
              paths: {
                main: '/src/targetCpp.wasm',
                emittedFiles: [
                  '/src/targetCpp.wast',
                ],
                sourceMap: '/src/targetCpp.wasm.map',
              },
            },
          },
        ],
      },
    ],
  },
};
```

## Options

All options are defined by and are passed directly to
[`docker-preprocessor`][docker-preprocessor]; check its documentation for more a
in-depth explanation.

[docker-preprocessor]: https://github.com/dfrankland/docker-preprocessors/tree/master/packages/docker-preprocessor
