# rollup-plugin-docker

A [Rollup][rollup] plugin that wraps
[`docker-preprocessor`][docker-preprocessor].

[rollup]: https://rollupjs.org/
[docker-preprocessor]: https://github.com/dfrankland/docker-preprocessors/tree/master/packages/docker-preprocessor

## Install

```bash
npm install --save-dev rollup-plugin-docker
```

## [Usage][rollup-wiki-plugins]

[rollup-wiki-plugins]: https://github.com/rollup/rollup/wiki/Plugins

`rollup-plugin-docker` is for tasks that require lots of setup or configuration
of the host machine. A good example is compiling C++ to WebAssembly (wasm),
which requires Emscripten to be compiled, configured, and installed.

This can also be used for multiple times within a configuration for different
file types, allowing for easy seperation of concerns via Docker containers.

**file.js**

```js
import wasmModule from 'file.cpp';
```

**rollup.config.js**

```js
import docker from 'rollup-plugin-docker';
import wasmModule from 'rollup-plugin-wasm-module';

export default {
  plugins: [
    docker({
      include: ['**/*.cpp'],
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
              -o target.wasm \
            ;
          `,
        ],
        paths: {
          main: '/src/target.wasm',
          emittedFiles: [
            '/src/target.wast',
          ],
          sourceMap: '/src/target.wasm.map',
        },
      },
    }),
    wasmModule({
      include: ['**/*.cpp', '**/*.rs'],
    }),
  ],
};
```

## Options

All options are defined by and are passed directly to
[`docker-preprocessor`][docker-preprocessor]; check its documentation for more a
in-depth explanation.

[docker-preprocessor]: https://github.com/dfrankland/docker-preprocessors/tree/master/packages/docker-preprocessor
