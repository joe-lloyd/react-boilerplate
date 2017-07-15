import React from 'react';
import { Router, Route, IndexRoute } from 'react-router';

import App from '../components';
import Home from '../components/home';
import About from '../components/about';
// import NotFound from '../components/notfound';


/**
 * @class Routes
 *
 * @description
 * All of the routes for the app are listed here.
 * Order is important as the first one that matches a route will be the one used
 *
 */
export default class Routes {

	/**
	 * @description
	 * builds the routes for the application
	 *
	 * @param {Object} history
	 * @returns {XML}
	 */
	getRouter (history) {
		return (
			<Router history={history}>
				<Route path="/" component={App}>

					<Route path="/about" component={About} />

					{/*<Route path="**" component={NotFound} />*/}

					<IndexRoute component={Home} />

				</Route>
			</Router>
		);
	}

}
