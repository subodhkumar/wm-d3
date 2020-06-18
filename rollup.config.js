import npm from 'rollup-plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';
export default {
    input: `index.js`,
    plugins: [npm({jsnext: true})],
    output:[
        {
            file:'d3.js',
            format:'umd',
            name:'d3',
        },
        {
            file:'d3.min.js',
            format:'iife',
            name:'d3.min',
            plugins:[terser()]
        }
    ]
}

