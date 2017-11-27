import webAssemblyModuleCpp from './factorial.cpp';
import webAssemblyModuleRust from './factorial.rs';

const { Memory, Table } = window.WebAssembly;
const deps = () => ({
  env: {
    memoryBase: 0,
    tableBase: 0,
    memory: new Memory({ initial: 256, limit: 512 }),
    table: new Table({ initial: 0, element: 'anyfunc' }),
  },
});

window.dockerLoaderTest = async (number) => {
  try {
    const {
      instance: {
        exports: {
          _factorial: factorialCpp = () => undefined,
        } = {},
      } = {},
    } = await webAssemblyModuleCpp(deps());

    const {
      instance: {
        exports: {
          factorial: factorialRust = () => undefined,
        } = {},
      } = {},
    } = await webAssemblyModuleRust(deps());

    const resultCpp = factorialCpp(number);
    const resultRust = factorialRust(number);

    if (resultCpp !== resultRust) {
      throw new Error((
        `C++ facotrial result "${resultCpp}" does not match Rust factorial result "${resultRust}"!`
      ));
    }

    return resultCpp;
  } catch (err) {
    return err.message;
  }
};
