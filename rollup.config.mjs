import { readFileSync } from 'fs';

const { version } = JSON.parse(readFileSync('./package.json', 'utf8'));

const banner = `//! annyang
//! version : ${version}
//! author  : Tal Ater @TalAter
//! license : MIT
//! https://www.TalAter.com/annyang/`;

export default {
  input: 'src/annyang.js',
  output: [
    {
      file: 'dist/annyang.js',
      format: 'iife',
      name: 'annyang',
      banner,
    },
    {
      file: 'dist/annyang.mjs.js',
      format: 'esm',
      banner,
    },
    {
      file: 'dist/annyang.cjs.js',
      format: 'cjs',
      banner,
    },
  ],
};
