import Express from 'express';
let compression = require('compression');

import { WebController } from './controllers/WebController';
import { ErrorController } from './controllers/ErrorController';

let server = new Express();

let environmentPort = process.env.NODE_PORT;
let port = environmentPort;

/**
 * @description
 * Function to check if the main html should be compressed or not
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {boolean}
 */
function shouldCompress (req, res) {
	let compress = false;
	if (req.get('accept')) {
		let accept = req.get('accept').split(',');

		if (accept[0] === 'text/html') {
			compress = true;
		}
	}
	return compress;
}

if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
	server.all('/app/*.js', (req, res, next) => {
		let arrayOfStrings = req.url.split('?');
		req.url = `${arrayOfStrings.join('.gz?')}`;
		res.set('Content-Encoding', 'gzip');
		res.set('Content-Type', 'application/javascript');
		next();
	});

	server.all('/css/*.css', (req, res, next) => {
		let arrayOfStrings = req.url.split('?');
		req.url = `${arrayOfStrings.join('.gz?')}`;
		res.set('Content-Type', 'text/css');
		res.set('Content-Encoding', 'gzip');
		next();
	});

	server.use(compression({ filter: shouldCompress }));
}

server.use(Express.static('dist/assets'));

server.set('views', 'dist/assets/views');
server.set('view engine', 'ejs');

server.all('/img/fav/favicon.ico', ::(new WebController()).webFavIcon);

server.get('*', ::(new WebController()).webAction);

// server.use(::(new ErrorController()).errorAction);

server.listen(port);

console.log(`Server is listening to port: ${port}`);
