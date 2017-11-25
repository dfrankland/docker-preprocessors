import { writeFileSync } from 'fs';
import { dirname, resolve as resolvePath } from 'path';
import { createFilter } from 'rollup-pluginutils';
import dockerPreprocessor from 'docker-preprocessor';

const PREFIX = '\0docker:';
const SUFFIX = '.wasm';

const matchesVirtualFile = id => id.startsWith(PREFIX) && id.endsWith(SUFFIX);
const createVirtualFileId = id => `${PREFIX}${id}${SUFFIX}`;
const revertVirtualFileId = id => (
  id.replace(new RegExp(`^\\${PREFIX}(.*?)\\${SUFFIX}$`), '$1')
);

const ast = {
  type: 'Program',
  sourceType: 'module',
  start: 0,
  end: null,
  body: [],
};

export default ({
  include,
  exclude,
  options,
} = {}) => {
  const filter = createFilter(include, exclude);

  const plugin = {
    name: 'docker',
    resolveId: (id, importer = '') => {
      const fullPath = resolvePath(dirname(importer), id);
      if (matchesVirtualFile(id) || !filter(fullPath)) return null;
      return createVirtualFileId(fullPath);
    },
    load: async function dockerTransform(id) {
      if (!matchesVirtualFile(id)) return null;
      try {
        const result = await dockerPreprocessor(options)(revertVirtualFileId(id));

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

        return { code: content.toString('binary'), map: sourceMap, ast };
      } catch (err) {
        return this.error(err);
      }
    },
  };

  return plugin;
};
