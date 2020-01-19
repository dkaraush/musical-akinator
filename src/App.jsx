import React from 'react';

import IndexPage from './Pages/IndexPage/IndexPage';
import _404Page from './Pages/404Page/404Page';

import './App.css';

export default function () {
	return (
		<div id="content">
			<div id="header">
				<h1>Musical Akinator</h1>
			</div>
			<section id="pages-wrapper">
				<IndexPage />
				<_404Page />
			</section>
		</div>
	);
}