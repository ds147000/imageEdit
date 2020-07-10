import { join } from 'path'
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import pluginTypescript from 'rollup-plugin-typescript2'

// rollup.config.js
export default {
    // 核心选项
    input: "./index.ts",     // 必须
    output: {  // 必须 (如果要输出多个，可以是一个数组)
        // 核心选项
        file: join('./dist', process.env.type === 'cjs' ? "index.js" : "image-edit.min.js"),    // 必须
        format: process.env.type === 'cjs' ? "cjs" : "iife",  // 必须
        name: "ImageEdit",
    },
    plugins: [
        resolve(),
        commonjs(),
        pluginTypescript()
    ],
};