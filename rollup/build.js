const path = require("path");
const json = require("@rollup/plugin-json");
const babel = require("@rollup/plugin-babel");

const resolveFile = (filePath) => {
  return path.resolve(__dirname, filePath);
};

const plugins = [
  json({
    compact: true, // 压缩json
  }),
  babel({
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    babelHelpers: "bundled", // 使用打包的babel-helper
    presets: [
      [
        "@babel/env",
        {
          targets: {
            browsers: [
              "last 2 versions",
              "> 1%",
              "not ie <= 11",
              "not ie_mob <= 11",
            ],
          },
        },
      ],
    ],
  }),
];

module.exports = [
  {
    input: resolveFile("../src/webEyesSDK.js"),
    output: {
      file: resolveFile("../dist/monitor.js"),
      format: "iife",
      name: "monitor",
      sourcemap: true,
    },
    plugins,
  },
  {
    input: resolveFile("../src/webEyesSDK.js"),
    output: {
      file: resolveFile("../dist/monitor.esm.js"),
      format: "esm",
      name: "monitor",
      sourcemap: true,
    },
  },
  {
    input: resolveFile("../src/webEyesSDK.js"),
    output: {
      file: resolveFile("../dist/monitor.umd.js"),
      format: "umd",
      name: "monitor",
      sourcemap: true,
    },
  },
];
