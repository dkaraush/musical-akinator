import React from 'react';

import './Widgets.css';

const widgets = {
	'youtube': (media) => {
		let id = media.url.match(/^(?:https?\:)?(?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/(?:watch\?v=)?([A-Za-z0-9_-]{11})/);
		if (id === null || id.length < 1)
			return null;
		id = id[1];
		return <iframe
					key="youtube"
					type="text/html"
					className="youtube-widget"
  					src={"https://www.youtube.com/embed/"+id+"?enablejsapi=1"}
  					frameBorder="0"></iframe>;
	},
	'deezer': (media) => {
		let id = media.url.match(/^(?:https?\:)?(?:\/\/)?(?:www\.)?deezer\.com\/track\/(\d+)(?:\?.+)?(?:\#.+)?$/);
		console.log(id);
		if (id === null || id.length < 1)
			return null;
		id = id[1];

		return <iframe
					key="deezer"
					className="deezer-widget"
					scrolling="no"
					frameBorder="0"
					allowtransparency="true"
					src={"https://www.deezer.com/plugins/player?format=classic&autoplay=false&playlist=true&width=700&height=350&color=E08000&layout=&size=medium&type=tracks&app_id=1&id="+id} 
					width="100%" 
					height="95"></iframe>;
	},
	'soundcloud': (media) => {
		return <iframe
					key="soundcloud"
					width="100%"
					height="166"
					scrolling="no"
					frameBorder="no" 
					allow="autoplay"
				  	src={"https://w.soundcloud.com/player/?url=" + encodeURIComponent(media.url)}>
				</iframe>;
	},
	'spotify': (media) => {
		return <iframe
					key="spotify"
					width="100%"
					height="300"
					scrolling="no"
					frameBorder="0"
					allowtransparency="true"
					src={"https://open.spotify.com/embed?uri=" + encodeURIComponent(media.url)}>
				</iframe>;
	}
};

export default function (props) {
	let track = props.track || props.data;
	let multiple = props.multiple || false;

	if (track.media === null || track.media.length === 0)
		return null;

	let result = [];
	for (let social in widgets) {
		for (let i = 0; i < track.media.length; ++i) {
			if (social === track.media[i].provider) {
				let widget = widgets[social](track.media[i]);
				if (widget !== null) {
					if (!multiple)
						return widget;
					result.push(widget);
				}
				break;
			}
		}
	}
	return result;
}