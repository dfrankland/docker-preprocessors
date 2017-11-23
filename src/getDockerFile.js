import tar from 'tar-stream';

export default ({ container, path }) => (
  new Promise(async (resolve) => {
    const extract = tar.extract();
    extract.on('entry', (header, entryStream, next) => {
      const data = { buffers: [], length: 0 };
      entryStream.on('data', (newData) => {
        data.buffers.push(newData);
        data.length += newData.length;
      });
      entryStream.on('end', () => {
        const { buffers, length } = data;
        resolve(Buffer.concat(buffers, length));
        next();
      });
    });
    (await container.getArchive({ path })).pipe(extract);
  })
);
