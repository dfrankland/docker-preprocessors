import Docker from 'dockerode';
import { basename } from 'path';
import getDockerFile from './getDockerFile';

export default ({
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
}) => async (resourcePath) => {
  const docker = new Docker(dockerOptions);

  const container = await docker.run(
    image,
    command(resourcePath),
    streams,
    createOptions,
    startOptions,
  );

  const { output: { StatusCode: statusCode = 0 } = {} } = container;

  const result = {
    container,

    error: (
      statusCode === 0 ?
        null :
        new Error(`Exit code returned unsuccessful: ${statusCode}`)
    ),

    content: await getDockerFile({ container, path: mainFilePath }),

    sourceMap: (
      sourceMapPath ?
        await getDockerFile({ container, path: sourceMapPath }) :
        null
    ),

    emittedFiles: await Promise.all((
      (Array.isArray(emittedFilePaths) ? emittedFilePaths : []).map(async (emittedFilePath) => {
        const emittedFile = await getDockerFile({ container, path: emittedFilePath });
        return {
          emittedFilePath,
          fileName: basename(emittedFilePath),
          content: emittedFile,
        };
      })
    )),
  };

  (async () => {
    try {
      await container.remove();
    } catch (err) {
      console.error(err); // eslint-disable-line no-console
    }
  })();

  return result;
};
