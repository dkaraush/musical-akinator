import React from 'react';

import { Redirect } from 'react-router-dom';

import TextOrRecordInput from '../../Components/TextOrRecordInput/TextOrRecordInput';
import Loading from '../../Components/Loading/Loading';
import Button from '../../Components/Button/Button';
import TrackBig from '../../Components/TrackBig/TrackBig';
import TrackSmall from '../../Components/TrackSmall/TrackSmall';
import Score from './Score';

import API from '../../Controllers/APIController';
import LastTracks from '../../Controllers/LastTracks';

import './GuessPage.css';

class GuessPage extends React.Component {
	constructor(props) {
		super(props);

		this.pushState = this._setState.bind(this, false);
		this.state = {};
		let storageState = Storage.get('guess-state');

		this.pushState(this.props.location.state);

		if (storageState) {
			this.pushState(storageState);
		}

		let input = null;
		if (this.state.input && this.state.input.type === 'text')
			input = this.state.input;
		if (this.props.location.state && this.props.location.state.input)
			input = this.props.location.state.input;

		if (!this.state.loaded && input)
			this.init(false, input);


		this.lastTracks = LastTracks.getData();
	}

	componentDidMount() {
		this.pushState = this._setState.bind(this, true);
	}

	_setState(mounted, newState) {
		// console.log('pushState(', newState, ')', '\n', new Error().stack.split('\n').slice(1).join('\n'))
		if (mounted)
			this.setState(newState||{});
		else this.state = Object.assign(this.state||{}, newState||{});
		// console.log('state = ', this.state);

		let toSave = Object.assign({}, Object.assign(this.state||{}, newState||{}));
		if (toSave)
			delete toSave.input;
		Storage.set('guess-state', toSave);
		// console.log('toSave: ', toSave);
	}

	init(newRequest, input) {
		this.props.location.state = input;

		let newState = {};
		if (input.type === 'text') 
			newState.q = input.value;
		newState.loading = true;
		this.pushState(newState);

		API.send(input)
		   .then((res) => {
				this.lastTracks = LastTracks.getData();
		   		if (res.result == null) {
		   			this.vote(false, true);
		   			this.pushState({voted: true});
		   		} else if (newRequest)
		   			this.pushState({voted: false});

		   		this.pushState({
		   			loading: false,
		   			loaded: true,
		   			track: res.result,
		   			score: res.score
		   		}, true);
		   })
		   .catch((error) => {
		   		this.pushState({loading: false, error: error});
		   })
	}

	vote(bool, strict) {
		if (!strict && this.state.voted)
			return;

		if (bool)
			LastTracks.push(this.state.track);

		this.pushState({voted: true});
		API.sendAnswer(bool)
		    .then((newScore) => {
		    	this.pushState({score: newScore})
		    });
	}

	render() {
		if (this.props.location.state === null ||
			typeof this.props.location.state === 'undefined') {
			return <Redirect to='/' />;
		}

		if (this.state.loading)
			return <div>
					<p className="center">Searching your track...</p>
					<Loading />
				   </div>;
		console.log(LastTracks)
		return (
			<div>
				<div className={"voting" + (this.state.voted || !this.state.track ? ' voted' : '')}>
					<div>
						<Score score={this.state.score} />
						<p>What about next song?</p>
						<TextOrRecordInput onSelect={this.init.bind(this, true)} />
					</div>
					<div>
						<br />
						<p>Is it {this.state.track ? <span><b>{this.state.track.artist} — {this.state.track.title}</b></span> : null}?</p>
						<div className="buttons">
							<Button invert onClick={this.vote.bind(this, true)}>Right!</Button>
							<Button onClick={this.vote.bind(this, false)}>No...</Button>
						</div>
					</div>
				</div>
				{!this.state.track ? 
					<div>
						<p className="center">Unfortunately, we didn't find any track. You won this round.</p>
					</div> : null
				}
				<div className={"last" + (this.state.voted && this.state.loaded && this.lastTracks.length > 0 ? ' visible' : '')}>
					<p><b>Last correctly guessed tracks:</b></p>
					{this.state.voted && this.state.loaded ? 
						this.lastTracks.map((track, i) => <TrackSmall track={track} key={i} /> )
						: null
					}
				</div>
				{this.state.track ? 
					<TrackBig track={this.state.track} q={this.state.q} /> : null
				}
			</div>
		);
	}
}

export default GuessPage;