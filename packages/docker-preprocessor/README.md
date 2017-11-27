# docker-preprocessor

A general-purpose module for preprocessing using [Docker][docker].

[docker]: https://www.docker.com/

## Install

```bash
npm install --save-dev docker-preprocessor
```

## Usage

`docker-preprocessor` can be used for extremely complex (Emscripten, for C++ to
WebAssembly compilation) to very simple tasks (checking output of a Node.js
version). It is meant to be unopinionated and easy to fit into any preprocessor
toolchain.

**file.txt**

```
Hello, World!
```

**preprocessor.js**

```js
import dockerPreprocessor from 'docker-preprocessor';

const options = {
  image: 'node',
  createOptions: {
    Binds: ['/:/host'],
    WorkingDir: '/src',
  },
  command: path => [
    'sh',
    '-c',
    `
      node \
        -e \
        " \
          const { readFileSync, writeFileSync } = require('fs'); \
          const content = readFileSync('/host${path}', { encoding: 'utf8' }).split('').reverse().join(''); \
          writeFileSync('./result', content); \
        " \
      ;
    `,
  ],
  paths: {
    main: '/src/result',
  },
};

const { content } = await dockerPreprocessor(options)('file.txt');

console.log(bufferOfContentsReversedByDockerContainer.toString('utf8')); // !dlroW ,olleH
```

## Documentation

### dockerPreprocessor(options)

*   `options` [`<Object>`][mdn docs type object]

    *   `dockerOptions` [`<Object>`][mdn docs type object] Options passed to
        [`dockerode`][dockerode getting started]'s instantiation of a `Docker`
        object.

    *   `image` [`<string>`][mdn docs type string] Image and tag string to
        create a Docker container with. Defaults to `'ubuntu'` (which defaults
        to the `latest` tag).

    *   `command` [`<Function>`][mdn docs type function] A function that takes a
        `path` string and returns an [*exec* array][docker cmd]. The `path`
        string is provided by `dockerPreprocessorRunner`. Defaults to
        `() => ['bash']`.

    *   `streams` `<Writable>`, [`<Array>`][mdn docs type array] A
        `Writable` stream or an array of `Writable` streams to pipe to from a
        Docker container. See [`dockerode`][dockerode equivalent example] for a
        more in-depth explanation. Defaults to `process.stdout`.

    *   `[createOptions]` [`<Object>`][mdn docs type object] Optional options
        used for container creation. See
        [`dockerode`][dockerode equivalent example] for a more in-depth
        explanation.

    *   `[startOptions]` [`<Object>`][mdn docs type object] Optional options
        used for container start. See
        [`dockerode`][dockerode equivalent example] for a more in-depth
        explanation.

    *   `paths` [`<Object>`][mdn docs type object] An object with paths to file
        locations within the Docker container to retrieve and return as
        `Buffer`s.

        *   `main` [`<string>`][mdn docs type string] A path to the main content
            to be retrieved.

        *   `[emittedFiles]` [`<Array>`][mdn docs type array] An optional array
            of paths as strings, to be emitted to the final build directory.

        *   `[sourceMap]` [`<string>`][mdn docs type string] Optional path to
            the source mapping file, usually for the `main` content.

[dockerode getting started]: https://github.com/apocas/dockerode#getting-started
[docker cmd]: https://docs.docker.com/engine/reference/builder/#cmd
[dockerode equivalent example]: https://github.com/apocas/dockerode#equivalent-of-docker-run-in-dockerode

Returns a function, `dockerPreprocessorRunner`.

#### dockerPreprocessorRunner(filePath)

*   `filePath` [`<string>`][mdn docs type string] Path to a source file. This
    string is given to the `command` function property given to
    `dockerPreprocessor` in its option object.

Returns a `Promise` which resolves to a `result` object.

*   `result` [`<Object>`][mdn docs type object]

    *   `container` [`<Object>`][mdn docs type object] The container object
        created by [`dockerode`][dockerode].

    *   `error` [`<null>`][mdn docs type null], [<Error>][mdn docs type error]
        Returns `null` if the exit code is `0` or returns an error.

    *   `content` `<Buffer>`

    *   `sourceMap` `<Buffer>` Defaults to `null`.

    *   `emittedFiles` [`<Array>`][mdn docs type array] Default to `[]`.

[dockerode]: https://github.com/apocas/dockerode

[mdn docs type object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[mdn docs type function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function
[mdn docs type array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
[mdn docs type string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type
[mdn docs type null]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/null
[mdn docs type error]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
