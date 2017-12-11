import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { resolve as resolvePath } from 'path';
import puppeteer from 'puppeteer';
import { Duplex } from 'stream';

jest.setTimeout(15000);

// Better logging to console when using Jest
const consoleLogStream = () => new Duplex({
  write(chunk, encoding, callback) {
    if (Buffer.isBuffer(chunk)) console.log(chunk.toString('utf8')); // eslint-disable-line no-console
    callback();
  },
});

const webpackConfig = {
  entry: resolvePath(__dirname, './__fixtures__/main.js'),
  output: {
    path: resolvePath(__dirname, '../../build'),
    filename: './bundle.js',
  },
  devtool: 'inline-source-map',
  resolveLoader: {
    alias: {
      'docker-loader': require.resolve('../'),
      'wasm-module-loader': require.resolve('wasm-module-loader'),
    },
  },
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
              streams: consoleLogStream(),
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
      {
        test: /\.rs?$/,
        use: [
          {
            loader: 'wasm-module-loader',
          },
          {
            loader: 'docker-loader',
            options: {
              image: 'rustlang/rust:nightly',
              streams: consoleLogStream(),
              createOptions: {
                Binds: ['/:/host'],
              },
              command: path => [
                'sh',
                '-c',
                `
                  mkdir /src \
                  && \
                  cd /src \
                  && \
                  rustup target add wasm32-unknown-unknown \
                  && \
                  rustc \
                    --target=wasm32-unknown-unknown \
                    /host${path} \
                    -O \
                    -o targetRust.wasm \
                  ;
                `,
              ],
              paths: {
                main: '/src/targetRust.wasm',
                // `wasm32-unknown-unknown` doesn't output anything, but binary
                // `wasm` files. If you want to emit other files, or sourcemaps,
                // `wabt` tools like `wasm2wat` will need to be used.
                // emittedFiles: [
                //   '/src/targetRust.wast',
                // ],
                // sourceMap: '/src/targetRust.wasm.map',
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'docker-loader test',
      template: resolvePath(__dirname, './__fixtures__/index.html'),
      inject: 'head',
    }),
  ],
};

const compiler = webpack(webpackConfig);

describe('docker-loader', () => {
  it('compiles C++ and Rust to WebAssembly in a Docker container', async () => {
    const bundle = await new Promise((resolve, reject) => {
      compiler.run((err, stats) => {
        console.log(stats.toString()); // eslint-disable-line no-console
        return stats.compilation.errors.length ?
          reject((
            new Error(stats.compilation.errors)
          )) :
          resolve((
            stats.compilation.assets[webpackConfig.output.filename].source()
          ));
      });
    });

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('about:blank');

    const result = await page.evaluate(`
      ${bundle}
      window.dockerLoaderTest(10);
    `);

    expect(result).toEqual(3628800);

    await browser.close();
  });
});
