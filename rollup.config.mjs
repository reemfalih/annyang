// import terser from '@rollup/plugin-terser';
// import livereload from 'rollup-plugin-livereload';
// import serve from 'rollup-plugin-serve';

// const isProduction = !process.env.ROLLUP_WATCH;

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
  plugins: [
    // terser()
    // !isProduction &&
    //   serve({
    //     open: true,
    //     contentBase: ['demo'],
    //     port: 8080,
    //   }),
    // !isProduction &&
    //   livereload({
    //     watch: 'dist',
    //   }),
  ],
};
