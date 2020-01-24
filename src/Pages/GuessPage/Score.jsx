import React from 'react';
import './Score.css';

function capitilize(str) {
	str = str.replace(/_/g, ' ');
	str = str.trim();
	return str.slice(0, 1).toUpperCase() + str.slice(1);
}

export default function (props) {
	let score = props.score || {};

	let elements = [];
	let players = Object.keys(score);
	for (let i = 0, x = 0; i < players.length; ++i) {
		elements.push(
			<span key={++x} className="player">
				<span className="name">
					{capitilize(players[i])}
				</span>
				<span className="value">
					{score[players[i]]}
				</span>
			</span>
		);

		if (players.length - 1 !== i) {
			elements.push(<span key={++x} className="separator">:</span>);
		}
	}
	return <div className="score"><div>{elements}</div></div>;
}