import React from 'react';
import './Page.css';

let routes = {};
let pages = {};
export default function (props) {
	pages[props.id] = React.createRef();
	let isActive = props.route && window.location.pathname === props.route;
	let page = (
		<div
			id={props.id} 
			className={"page" + (isActive ? ' active' : '')}
			ref={pages[props.id]}
			>
			{props.children}
		</div>
	);
	if (isActive)
		document.body.className = props.id;
	if (props.route)
		routes[props.route] = props.id;
	return page;
}

function url(x) {
	if (x.indexOf('?') >= 0)
		x = x.substring(0, x.indexOf('?'));
	if (x.indexOf('#') >= 0)
		x = x.substring(0, x.indexOf('#'));
	return x;
}

export let RedirectID = function (toId) {
	document.body.className = toId;
	for (let pageId in pages) {
		let page = pages[pageId].current;
		page.className = 'page ' + (pageId === toId ? 'active' : '');
	}
}
export let Redirect = function (toRoute) {
	window.history.pushState("", "", toRoute);
	RedirectID(routes[url(toRoute)] || '404');
}

window.R = Redirect;

window.addEventListener('load', function () {
	let route = url(window.location.pathname);
	if (typeof routes[route] === 'undefined')
		RedirectID('404');
});