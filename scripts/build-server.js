import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  sourcemap: true,
  outfile: 'dist/server.cjs',
  plugins: [
    {
      name: 'bundle-jose-jwks-rsa',
      setup(build) {
        build.onResolve({ filter: /^[^./]/ }, args => {
          // Bundle jose and jwks-rsa directly into server.cjs so no CJS require('jose') happens at runtime
          if (
            args.path === 'jose' ||
            args.path.startsWith('jose/') ||
            args.path === 'jwks-rsa' ||
            args.path.startsWith('jwks-rsa/')
          ) {
            return null; // Let esbuild resolve and bundle it
          }
          return { external: true }; // All other node_modules stay external
        });
      }
    }
  ]
}).catch((err) => {
  console.error('esbuild failed:', err);
  process.exit(1);
});
