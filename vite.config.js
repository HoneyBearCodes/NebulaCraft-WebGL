const isCodeSandbox = 'SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env;

export default {
  root: './src/',
  publicDir: '../public/',
  base: './',
  server: {
    host: true,
    open: !isCodeSandbox,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemaps: true,
  },
};
