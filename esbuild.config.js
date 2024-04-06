const esbuild = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');
const AnalyzerPlugin = require('esbuild-analyzer');

const analyze = process.env.ANALYZE_BUILD === "true";
const version = process.versions.node;
esbuild.build({
    bundle: false,
    charset: 'utf8',
    entryPoints: ["./src/**/*.ts"],
    format: 'cjs',
    keepNames: true,
    metafile: analyze,
    minify: false,
    outdir: 'dist',
    platform: 'node',
    plugins: [
        analyze ? AnalyzerPlugin() : undefined,
        nodeExternalsPlugin(),
    ].filter(x => x),
    sourcemap: true,
    target: `node${version}`,
    treeShaking: true,
}).catch(() => process.exit(1));
