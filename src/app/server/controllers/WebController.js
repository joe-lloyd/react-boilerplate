import { useRouterHistory, RouterContext, match } from 'react-router';
import ReactDOMServer from 'react-dom/server';
import { createMemoryHistory } from 'history';
import UserAgent from 'express-useragent';
import { Provider } from 'react-redux';
import Promise from 'bluebird';
import React from 'react';
import Helmet from 'react-helmet';

import Routes from '../../universal/routes';
import configureStore from '../../universal/state/store/configureStore';
import { setUserAgent } from '../../universal/state/action/useragent';

const styleSrc = `/css/app.min.css?ver=${process.env.APP_V}`;
const scriptSrcs = [
	`/app/app.js?ver=${process.env.APP_V}`,
];
const favSrc = '/img/fav';

// dont include vendor file for local env
if (['staging', 'production'].indexOf(process.env.NODE_ENV) > -1 ) {
	scriptSrcs.unshift(`/app/vendor.js?ver=${process.env.APP_V}`);
}

/**
 * @class WebController
 *
 * @description
 * The web controller takes care of routing and other requests needed on the server.
 *
 */
export class WebController {

	/**
	 * @description
	 * Router function that uses react router to match the route that is
	 * requested and send the correctly rendered page
	 *
	 * @public
	 * @param {Object} req
	 * @param {Object} res
	 * @param {Object} next
	 */
	webAction (req, res, next) {
		const source = req.headers['user-agent'];
		const browser = UserAgent.parse(source);
		const history = useRouterHistory(createMemoryHistory)();
		const store = configureStore();
		const routes = new Routes();

		store.dispatch(setUserAgent(browser));

		match({ routes: routes.getRouter(history), location: req.url }, (error, redirectLocation, renderProps) => {
			if (error) {
				res.status(500).send(error.message);
			} else if (redirectLocation) {
				res.redirect(302, redirectLocation.pathname + redirectLocation.search);
			} else if (renderProps) {
				this.preRenderMiddleware(store.dispatch, renderProps.components, renderProps.params).then(() => {
					const reduxState = encodeURIComponent(JSON.stringify(store.getState()));

					const htmlBody = WebController.buildHtmlBody(store, renderProps);

					let head = Helmet.rewind();

					const htmlHead = (`
						${head.title}
						${head.meta.toString()}
						${head.link.toString()}
						${head.htmlAttributes.toString()}
					`);

					res.render('index', { htmlHead, htmlBody, scriptSrcs, styleSrc, browser, reduxState, favSrc });
				}).catch(() => {
					res.redirect('/404');
				});
			} else {
				res.status(404).send('Not found');
			}
		});
	}

	/**
	 * @description
	 * This function checks if a component has the static need array.
	 * If it does it will make sure all of the actions listed there are fired before the page is rendered.
	 *
	 * @param {*} dispatch
	 * @param {*} components
	 * @param {Object} params
	 * @returns {*}
	 */
	preRenderMiddleware (dispatch, components, params) {
		const needs = components.reduce((prev, current) => {
			if (!current) {
				return prev;
			}
			const need = 'need' in current ? current.need : [];
			const wrappedNeed = 'WrappedComponent' in current &&
			'need' in current.WrappedComponent ? current.WrappedComponent.need : [];
			return prev.concat(need, wrappedNeed);
		}, []);
		const promises = needs.map((need) => dispatch(need(params)));
		return Promise.all(promises);
	}

	/**
	 * @description
	 * A factory to build the page, it returns the correct page.
	 * renders with store and props inside a redux Provider component.
	 *
	 * @param {Object} store
	 * @param {Object} renderProps
	 * @returns {*}
	 */
	static buildHtmlBody (store, renderProps) {
		return ReactDOMServer.renderToString(
			<Provider store={store}>
				{ <RouterContext {...renderProps} /> }
			</Provider>,
		);
	}

	/**
	 * server management of uselss favicon.ico request
	 *
	 * @param {Object} req
	 * @param {Object} res
	 * @param {Object} next
	 */
	webFavIcon (req, res, next) {
		res.writeHead(200, { 'Content-Type': 'image/x-icon' });
		res.end();
	}
}
