import { rollup } from 'rollup';
import { resolve as resolvePath } from 'path';
import puppeteer from 'puppeteer';
import { Duplex } from 'stream';
import docker from '../';

jest.setTimeout(15000);

// Better logging to console when using Jest
const consoleLogStream = () => new Duplex({
  write(chunk, encoding, callback) {
    if (Buffer.isBuffer(chunk)) console.log(chunk.toString('utf8')); // eslint-disable-line no-console
    callback();
  },
});

const rollupConfig = {
  input: resolvePath(__dirname, './__fixtures__/main.js'),
  plugins: [
    docker({
      include: ['**/*.cpp'],
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
    docker({
      include: ['**/*.rs'],
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
    }),
    // Not using `rollup-plugin-wasm` here because it causes a `RangeError` due
    // to a bug.
    {
      name: 'wasm',
      transform: (code, id) => {
        if (!code || !/\.wasm$/.test(id)) return null;
        const src = JSON.stringify([...Buffer.from(code, 'binary')]);
        return `export default WebAssembly.compile(Uint8Array.from(${src}))`;
      },
    },
  ],
};

describe('rollup-plugin-docker', () => {
  it('compiles C++ and Rust to WebAssembly in a Docker container', async () => {
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
