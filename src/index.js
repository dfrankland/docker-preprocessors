import Docker from 'dockerode';
import loaderUtils from 'loader-utils';
import { basename } from 'path';
import getDockerFile from './getDockerFile';

export default function (c, s, meta) {
  const callback = this.async();

  const {
    dockerOptions,
    image = 'apiaryio/emcc',
    command = path => ['sh', '-c', `"emcc ${path} -s WASM=1"`],
    streams = process.stdout,
    createOptions,
    startOptions,
    paths: {
      main: mainFilePath,
      emittedFiles: emittedFilePaths,
      sourceMap: sourceMapPath,
    } = {},
  } = loaderUtils.getOptions(this) || {};

  (async () => {
    try {
      const docker = new Docker(dockerOptions);

      const container = await docker.run(
        image,
        command(this.resourcePath),
        streams,
        createOptions,
        startOptions,
      );

      const { output: { StatusCode: statusCode = 0 } = {} } = container;
      const error = statusCode === 0 ?
        null :
        new Error(`Exit code returned unsuccessful: ${statusCode}`);

      const content = await getDockerFile({ container, path: mainFilePath });

      const sourceMap = sourceMapPath ?
        await getDockerFile({ container, path: sourceMapPath }) :
        null;

      await Promise.all((
        emittedFilePaths.map(async (emittedFilePath) => {
          const emittedFile = await getDockerFile({ container, path: emittedFilePath });
          this.emitFile(basename(emittedFilePath), emittedFile);
        })
      ));

      callback(error, content, sourceMap, { ...meta, 'docker-loader': { container } });

      try {
        await container.remove();
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
      }
    } catch (err) {
      callback(err, null, null, meta);
    }
  })();
}
