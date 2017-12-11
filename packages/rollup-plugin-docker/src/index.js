import { writeFileSync } from 'fs';
import { dirname, resolve as resolvePath } from 'path';
import { createFilter } from 'rollup-pluginutils';
import dockerPreprocessor from 'docker-preprocessor';

export default ({
  include,
  exclude,
  options,
} = {}) => {
  const filter = createFilter(include, exclude);

  const plugin = {
    name: 'docker',

    transform: async function dockerTransform(code, id) {
      if (!filter(id)) return null;

      try {
        const result = await dockerPreprocessor(options)(id);

        const {
          error,
          content,
          sourceMap = { mappings: '' },
          emittedFiles,
        } = result;

        if (error) this.warn(error);

        plugin.onwrite = ({
          dest = '',
          file: buildFilePath = dest,
        } = {}) => {
          const buildDirPath = dirname(buildFilePath);
          emittedFiles.forEach(({ fileName, content: emittedFileContent }) => {
            writeFileSync(resolvePath(buildDirPath, fileName), emittedFileContent);
          });
        };

        return { code: content.toString('binary'), map: sourceMap };
      } catch (err) {
        return this.error(err);
      }
    },
  };

  return plugin;
};
