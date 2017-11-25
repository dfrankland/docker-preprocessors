import { readFileSync } from 'fs';
import { resolve as resolvePath } from 'path';
import dockerPreprocessor from '../';

const helloWorldFixturePath = resolvePath(__dirname, './__fixtures__/hello_world.txt');
const helloWorldFixtureContent = readFileSync(helloWorldFixturePath, { encoding: 'utf8' });

describe('docker-preprocessor', () => {
  it('it imports', async () => {
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

    const { content } = await dockerPreprocessor(options)(helloWorldFixturePath);

    expect(content.toString('utf8')).toEqual(helloWorldFixtureContent.split('').reverse().join(''));
  });
});
