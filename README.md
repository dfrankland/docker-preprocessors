# docker-preprocessors

A monorepo of loaders and plugins that utilize [Docker][docker] containers to
preprocess resources and assets.

## Modules

*   [`docker-preprocessor`][docker-preprocessor]

    A general-purpose module for preprocessing using [Docker][docker].

[docker-preprocessor]: https://github.com/dfrankland/docker-preprocessors/tree/master/packages/docker-preprocessor

*   [`docker-loader`][docker-loader]

    A [Webpack][webpack] loader that wraps `docker-preprocessor`.

[docker-loader]: https://github.com/dfrankland/docker-preprocessors/tree/master/packages/docker-loader
[webpack]: https://webpack.js.org/

*   [`rollup-plugin-docker`][rollup-plugin-docker]

    A [Rollup][rollup] plugin that wraps `docker-preprocessor`.

[rollup-plugin-docker]: https://github.com/dfrankland/docker-preprocessors/tree/master/packages/rollup-plugin-docker
[rollup]: https://rollupjs.org/

## Using the Monorepo

To test, build, and publish, etc. use the top-level `npm` scripts that utilize
[Lerna][lerna].

[lerna]: https://github.com/lerna/lerna/

[docker]: https://www.docker.com/
