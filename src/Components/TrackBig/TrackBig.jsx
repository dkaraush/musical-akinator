import React from 'react';

import { ReactComponent as MusicPic } from './music.svg';
import MediaLink from '../MediaLink/MediaLink';
import Widget from "../Widget/Widget";

import './TrackBig.css';

function highlightText(text, q) {
	if (q == null)
		return text;

	let lowercaseText = text.toLowerCase();
	q = q.toLowerCase().trim();
	let words = q.split(/ /g);

	let highlights = [];

	let x = 0;
	let minIndex, wordId = -1;
	do {
		minIndex = -1;
		wordId = -1;
		for (let i = 0; i < words.length; ++i) {
			let index = lowercaseText.indexOf(words[i], x);
			console.log(index, words[i], lowercaseText.substring(x))
			if (index == -1)
				continue;
			if (minIndex > index || minIndex == -1) {
				minIndex = index;
				wordId = i;
			}
		}
		if (wordId == -1 || minIndex == -1) 
			break;

		highlights.push([minIndex, minIndex + words[wordId].length]);
		x = minIndex + words[wordId].length + 1;
	} while (minIndex != -1);

	if (highlights.length == 0)
		return text;

	// merge nearby highlights
	for (let i = 0; i < highlights.length - 1; ++i) {
		let a = highlights[i],
			b = highlights[i+1];
		if (a[1] == b[0]) {
			highlights[i][1] = b[1];
			highlights.splice(i+1, 1);
			i--;
		}
	}

	let arr = [];
	x = 0;
	for (let i = 0; i < highlights.length; ++i) {
		let h = highlights[i];
		if (h[0] > x) {
			arr.push(text.substring(x, h[0]));
			x = h[0];
		}
		arr.push(<span className="highlight">{text.substring(h[0], h[1])}</span>);
		x = h[1];
	}
	if (x < text.length)
		arr.push(text.substring(x));
	return arr;
}

export default function (props) {
	let track = props.data || props.track;
	let q = props.q || null;

	let medias = track.media.map(social => {
		return <MediaLink href={social.url||social.uri} social={social.provider} size="big" />
	});

	return (
		<div className="track-wrapper">
			<div className="track-big">
				<div className="cover-wrapper">
					<div className="cover">
						<div className="bg">
							<MusicPic />
						</div>
						{track.cover ? <img src={track.cover} /> : null}
					</div>
				</div>
				<div className="info">
					<div className="meta">
						<h1>{highlightText(track.title, q)}</h1>
						<h2>{highlightText(track.artist, q)}</h2>
					</div>
					<div className="media">
						<span>
							{ medias }
						</span>
					</div>
				</div>
			</div>
			<Widget track={track} />
			{ track.lyrics !== null ?
				<div className="lyrics">
					<span className="header">Lyrics</span>
					<span>{highlightText(track.lyrics, q)}</span>
				</div>
				: null 
			}
		</div>
	);
}