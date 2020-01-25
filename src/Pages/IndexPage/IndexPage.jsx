import React from 'react';

import TextOrRecordInput from '../../Components/TextOrRecordInput/TextOrRecordInput';
import { Redirect } from 'react-router-dom';
import API from '../../Controllers/APIController';

class IndexPage extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		if (this.state.redirect) {
			Storage.set('guess-state', this.state.redirect);
			return <Redirect to={{
				pathname: '/guess',
				state: this.state.redirect
			}} />;
		}

		return (
			<div>
				<p>Akinator tries to recognize and guess what song you are trying to find. You are welcome to type lyrics or hum song's rythm in microphone.</p>
				<TextOrRecordInput onSelect={(input) => {
					this.setState({redirect: {
						input
					}});
				}} />
				<br />
				<p><b>How does this work?</b></p>
				<p>We use these APIs:</p>
				<ul>
					<li><a href="https://audd.io/">audd.io</a> — for recognition and track's search</li>
					<li><a href="https://docs.genius.com/">Genius API</a> — for obtaining more info about songs</li>
					<li><a href="https://developers.deezer.com/api">Deezer API</a> — also for obtaining song's info (not so accurate)</li>
				</ul>
				<p>Website also tries to add widgets from following social medias: <b>YouTube</b>, <b>Deezer</b>, <b>Spotify</b>, <b>Soundcloud</b>.</p>
				<p>
					Now this website is based on
					{
						API.type === 'direct' ?
						<span> <b>its own</b>. (sends requests directly to API and simulates backend logic)</span> : 
						<span> <b>server</b>. (sends requests to backend server)</span>
					}
				</p>
				<p>Made by:</p>
				<ul>
					<li><b><a className="dev" href="https://dkaraush.me">Dmitriy Karaush</a></b> — <a href="https://github.com/dkaraush/musical-akinator">frontend</a> made with React.</li>
					<li><b><a className="dev" href="https://t.me/thejunglegiant">Oleksii Morozov</a></b> — <a href="https://github.com/thejunglegiant/backend-akinator">backend</a>.</li>
				</ul>
			</div>
		);	
	}
}
export default IndexPage;