// const MiniCssExtractPlugin = require("mini-css-extract-plugin");
// const HTMLInlineCSSWebpackPlugin = require("html-inline-css-webpack-plugin").default;
const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = (env) => {
  if (!["chrome", "firefox"].includes(env.manifest)) {
    throw new Error(`Invalid manifest reference: "${env.manifest}"`);
  }
  if (!["development", "production"].includes(env.mode)) {
    throw new Error(`Invalid build mode: "${env.mode}"`);
  }
  return {
    mode: env.mode,
    target: "web",
    entry: {
      content: "./src/content/cellulart.ts",
      background: "./src/background/index.ts",
      popup: "./src/popup/popup.js",
      injected: "./src/inject/index.ts",
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
      clean: true,
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(`manifest-${env.manifest}.json`),
            to: path.resolve("dist/manifest.json"),
          },
          {
            from: path.resolve("src/inject/injector.js"),
            to: path.resolve("dist"),
          },
          {
            from: path.resolve("icons"),
            to: path.resolve("dist"),
          },
          {
            from: path.resolve("src/content/content.css"),
            to: path.resolve("dist"),
          },
          {
            from: path.resolve("src/popup"),
            to: path.resolve("dist/popup"),
          },
          {
            from: path.resolve("src/assets"),
            to: path.resolve("dist/assets"),
          },
        ],
      }),
    ],
    devtool: false,
    module: {
      rules: [
        {
          test: /.(ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                "@babel/preset-env",
                // ['@babel/preset-react', {'runtime': 'automatic'}],
                "@babel/preset-typescript",
              ],
            },
          },
        },
      ],
    },
  };
};
