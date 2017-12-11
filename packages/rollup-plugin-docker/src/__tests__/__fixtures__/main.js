import wasmModuleCpp from './fibonacci.cpp';
import wasmModuleRust from './fibonacci.rs';

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
          _fibonacci: fibonacciCpp = () => undefined,
        } = {},
      } = {},
    } = await wasmModuleCpp(deps());

    const {
      instance: {
        exports: {
          fibonacci: fibonacciRust = () => undefined,
        } = {},
      } = {},
    } = await wasmModuleRust(deps());

    const resultCpp = fibonacciCpp(number);
    const resultRust = fibonacciRust(number);

    if (resultCpp !== resultRust) {
      throw new Error((
        `C++ fibonacci result "${resultCpp}" does not match Rust fibonacci result "${resultRust}"!`
      ));
    }

    return resultCpp;
  } catch (err) {
    return err.message;
  }
};
