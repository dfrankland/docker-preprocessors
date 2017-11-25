import wasm from './fibonacci.cpp';

const { instantiate, Memory, Table } = window.WebAssembly;

window.dockerLoaderTest = async (number) => {
  try {
    const {
      exports: {
        _fibonacci: fibonacci = () => undefined,
      } = {},
    } = await instantiate(await wasm, {
      global: {},
      env: {
        memoryBase: 0,
        tableBase: 0,
        memory: new Memory({ initial: 256, limit: 512 }),
        table: new Table({ initial: 0, element: 'anyfunc' }),
      },
    });

    return fibonacci(number);
  } catch (err) {
    return err.message;
  }
};
