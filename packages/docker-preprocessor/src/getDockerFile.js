import tar from 'tar-stream';

export default async ({ container, path }) => {
  const extract = tar.extract();

  (await container.getArchive({ path })).pipe(extract);

  const stream = await new Promise((resolve) => {
    extract.on('entry', (header, entryStream) => resolve(entryStream));
  });

  const file = await new Promise((resolve) => {
    const data = { buffers: [], length: 0 };

    stream.on('data', (newData) => {
      data.buffers.push(newData);
      data.length += newData.length;
    });

    stream.on('end', () => {
      const { buffers, length } = data;
      resolve(Buffer.concat(buffers, length));
    });
  });

  return file;
};
