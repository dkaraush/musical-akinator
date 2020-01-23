import React from 'react';

import { BrowserRouter as Router } from "react-router-dom";
import { Switch, Route, Link, withRouter } from "react-router-dom";
import { TransitionGroup, CSSTransition } from "react-transition-group";

import IndexPage from './Pages/IndexPage/IndexPage';
import _404Page from './Pages/404Page/404Page';

import './App.css';

const Content = withRouter(({ location }) => {
	return (
		<div id="content">
			<TransitionGroup className="transition-group">
				<CSSTransition
		          key={location.key}
		          timeout={{ enter: 150, exit: 150 }}
		          classNames="fade"
				>
					<section className="route-section">
						<Switch location={location}>
							<Route path="/" exact component={IndexPage} />
							<Route component={_404Page} />
						</Switch>
					</section>
				</CSSTransition>
			</TransitionGroup>
		</div>
	);
});

export default function () {
	return (
		<div id="container">
			<Router>
				<div id="header">
					<h1>Musical Akinator</h1>
				</div>
				<Content />
			</Router>
		</div>
	);
}