import loaderUtils from 'loader-utils';
import dockerPreprocessor from 'docker-preprocessor';

export default function (c, s, meta) {
  const callback = this.async();
  const options = loaderUtils.getOptions(this) || {};
  (async () => {
    try {
      const {
        container,
        error,
        content,
        sourceMap,
        emittedFiles,
      } = await dockerPreprocessor(options)(this.resourcePath);

      emittedFiles.forEach((
        ({ fileName, content: emittedFileContent }) => this.emitFile(fileName, emittedFileContent)
      ));

      callback(error, content, sourceMap, { ...meta, 'docker-loader': { container } });
    } catch (err) {
      callback(err, null, null, meta);
    }
  })();
}
