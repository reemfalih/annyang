import terser from '@rollup/plugin-terser';

export default {
  input: 'src/annyang.js',
  output: [
    {
      file: 'dist/annyang.js',
      format: 'iife',
      name: 'annyang',
    },
    {
      file: 'dist/annyang.mjs',
      format: 'esm',
    },
    {
      file: 'dist/annyang.cjs',
      format: 'cjs',
    },
  ],
  plugins: [
    // terser()
  ]
};
