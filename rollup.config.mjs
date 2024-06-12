

export default {
  input: 'src/annyang.js',
  output: [
    {
      file: 'dist/annyang.js',
      format: 'iife',
      name: 'annyang',
    },
    {
      file: 'dist/annyang.mjs.js',
      format: 'esm',
    },
    {
      file: 'dist/annyang.cjs.js',
      format: 'cjs',
    },
  ],
};
