import * as path from 'path';
import webpack from 'webpack';
import fs from 'fs';
import CompressionPlugin from 'compression-webpack-plugin';
import DotenvPlugin from "webpack-dotenv-plugin";

const ENV = process.env.NODE_ENV;
const DIST = 'dist';
const ROOT = path.join(__dirname, 'src/app');
const OUTPUT_PATH = path.join(__dirname, `${DIST}/assets/app`);


let nodeModules = {};
fs.readdirSync('node_modules')
	.filter((x) => {
		return ['.bin'].indexOf(x) === -1;
	})
	.forEach((mod) => {
		nodeModules[mod] = 'commonjs ' + mod;
	});

let clientConfig = {
	entry: {
		app: './src/app/client'
	},
	output: {
		path: path.join(__dirname, `${OUTPUT_PATH}`),
		filename: '[name].js',
	},
	module: {
		loaders: [
			{
				loader: 'babel-loader',
				exclude: '/node_modules/',
			},
			{
				loader: 'json-loader',
				test: /\.json$/,
			},
		],
	},
	devtool: 'source-map',
	plugins: [
		/**
		 * @description
		 * Imports env vars for current environment
		 */
		new DotenvPlugin({
			sample: path.join(__dirname, '.env'),
			path: path.join(__dirname, `.env.${ENV}`),
		}),
		new webpack.EnvironmentPlugin([
			'NODE_ENV',
			'NODE_PORT',
		]),
	],
};

let serverConfig = {
	entry: {
		server: './src/app/server',
	},
	resolve: {
		modules: [path.join(__dirname, 'src/app')],
	},
	output: {
		path: path.join(__dirname, DIST),
		filename: '[name].js',
	},
	module: {
		loaders: [
			{
				loader: 'babel-loader',
			},
			{
				loader: 'json-loader',
				test: /\.json$/,
			},
		],
	},
	target: 'node',
	devtool: 'source-map',
	externals: nodeModules,
	plugins: [
		new webpack.BannerPlugin({
			banner: 'require("source-map-support").install();',
			raw: true,
			entryOnly: false,
		}),
	],
};


if (['staging', 'production'].indexOf(ENV) >= 0) {
	clientConfig.plugins.push(
		new CompressionPlugin({
			asset: '[path].gz[query]',
			algorithm: 'gzip',
			test: /\.js$|\.css$|\.html$/,
			threshold: 10240,
			minRatio: 0.8,
		}),
		new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.js')
	);

	clientConfig.entry = Object.assign({}, clientConfig.entry, {
		context: ROOT,
		devtool: 'cheap-module-source-map',
		entry: {
			vendor: [
				'react',
				'react-router',
				'redux',
				'react-dom',
				'redux-responsive'
			],
		},

		resolve: {
			modules: [ROOT, 'web_modules', 'node_modules', 'modules'],
		},

		output: {
			path: OUTPUT_PATH,
			filename: '[name].js',
			library: '[name]',
			publicPath: '/',
		},
	});
}


module.exports = [clientConfig, serverConfig];