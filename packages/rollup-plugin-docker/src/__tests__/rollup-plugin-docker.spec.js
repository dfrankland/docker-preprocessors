import { rollup } from 'rollup';
import wasm from 'rollup-plugin-wasm';
import { resolve as resolvePath } from 'path';
import puppeteer from 'puppeteer';
import docker from '../';

const rollupConfig = {
  input: resolvePath(__dirname, './__fixtures__/main.js'),
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
    wasm(),
  ],
};

describe('rollup-plugin-docker', () => {
  it('compiles C++ to WebAssembly in a Docker container', async () => {
    const bundle = await rollup(rollupConfig);
    const outputOptions = { format: 'iife' };
    const { code } = await bundle.generate(outputOptions);
    await bundle.write({
      ...outputOptions,
      file: resolvePath(__dirname, '../../build/bundle.js'),
    });

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('about:blank');

    const result = await page.evaluate(`
      ${code}
      window.dockerLoaderTest(10);
    `);

    expect(result).toEqual(89);

    await browser.close();
  });
});
