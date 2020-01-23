import React from 'react';

import { BrowserRouter as Router } from "react-router-dom";
import { Switch, Route, Link, withRouter } from "react-router-dom";
import { TransitionGroup, CSSTransition } from "react-transition-group";

import IndexPage from './Pages/IndexPage/IndexPage';
import GuessPage from './Pages/GuessPage/GuessPage';
import _404Page from './Pages/404Page/404Page';

import './App.css';

// for header animation
function updHeaderClassName() {
	document.querySelector("#header").className = window.location.pathname == '/' ? 'index' : '';
}

class Content extends React.Component {
	componentWillMount() {
		this.unlisten = this.props.history.listen((location, action) => {
			updHeaderClassName();
		});
	}
	componentWillUnmount() {
		this.unlisten();
	}
	render() {
		return (
			<div id="content">
				<TransitionGroup className="transition-group">
					<CSSTransition
			          key={this.props.location.key}
			          timeout={{ enter: 150, exit: 150 }}
			          classNames="fade"
					>
						<section className="route-section">
							<Switch location={this.props.location}>
								<Route path="/" exact component={IndexPage} />
								<Route path="/guess/" component={GuessPage} />
								<Route component={_404Page} />
							</Switch>
						</section>
					</CSSTransition>
				</TransitionGroup>
			</div>
		);
	}
}
const ContentComponent = withRouter(Content);

export default function () {
	return (
		<div id="container">
			<Router>
				<div id="header" className={window.location.pathname == '/' ? 'index' : ''}>
					<h1>Musical Akinator</h1>
				</div>
				<ContentComponent />
			</Router>
		</div>
	);
}