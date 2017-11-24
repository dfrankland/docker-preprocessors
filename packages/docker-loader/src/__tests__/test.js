import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { resolve as resolvePath } from 'path';
import puppeteer from 'puppeteer';

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
      'wasm-loader': require.resolve('wasm-loader'),
    },
  },
  module: {
    rules: [
      {
        test: /\.cpp?$/,
        use: [
          {
            loader: 'wasm-loader',
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
  it('compiles C++ to WebAssembly in a Docker container', async () => {
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
