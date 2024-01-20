// https://github.com/ipfs/aegir/blob/master/md/migration-to-v31.md
const esbuild = {
  external: ["rimraf"],
};

/** @type {import('aegir').PartialOptions} */
const options = {
  test: {
    browser: {
      config: {
        buildConfig: esbuild,
      },
    },
  },
  build: {
    config: esbuild,
  },
};

export default options;
