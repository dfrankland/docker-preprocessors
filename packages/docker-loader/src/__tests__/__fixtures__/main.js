const webAssemblyModule = require('./factorial.cpp');

const { Memory, Table } = window.WebAssembly;

window.dockerLoaderTest = async (number) => {
  try {
    const {
      instance: {
        exports: {
          _factorial: factorial = () => undefined,
        } = {},
      } = {},
    } = await webAssemblyModule({
      global: {},
      env: {
        memoryBase: 0,
        tableBase: 0,
        memory: new Memory({ initial: 256, limit: 512 }),
        table: new Table({ initial: 0, element: 'anyfunc' }),
      },
    });

    return factorial(number);
  } catch (err) {
    return err.message;
  }
};
