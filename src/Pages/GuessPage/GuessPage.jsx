import React from 'react';

import { Redirect } from 'react-router-dom';

import Loading from '../../Components/Loading/Loading';
import Button from '../../Components/Button/Button';
import TrackBig from '../../Components/TrackBig/TrackBig';

import API from '../../Controllers/APIController';


class GuessPage extends React.Component {
	constructor(props) {
		super(props);

		this.state = {voted: false};

		if (this.props.location.state) {
			let state = this.props.location.state;
			if (state.type === 'text')
				this.state.q = state.value;
			this.state.loading = true;

			API.send(state)
			   .then((res) => {
			   		this.setState({
			   			loading: false, 
			   			track: res.result,
			   			voted: res.result == null ? true : false,
			   			score: res.score
			   		});
			   		if (res.result == null)
			   			this.vote(false);
			   })
			   .catch((error) => {
			   		this.setState({loading: false, error: error});
			   })
		}
	}

	vote(bool) {
		API.sendAnswer(bool)
		    .then((newScore) => {
		    	this.setState({score: newScore, voted: true})
		    });
	}

	render() {

		if (this.props.location.state === null) {
			return <Redirect to='/' />;
		}

		if (this.state.loading)
			return <Loading />;

		return (
			<div>
				{/*!this.state.voted ? 
					<div className="voting">
						<p>Have I guessed right?</p>
						<Button onClick={this.vote.bind(this, true)}>Right!</Button>
						<Button onClick={this.vote.bind(this, false)}>No...</Button>
					</div> : null
				*/}
				{this.state.track ? 
					<TrackBig data={this.state.track} q={this.state.q} /> :
					<p>Didn't find a track :C</p>
				}
			</div>
		);
	}
}

export default GuessPage;