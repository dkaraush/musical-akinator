import React from 'react';

import './Widget.css';

const available = {
	'youtube': (media) => {
		let id = media.url.match(/^(?:https?\:)?(?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/(?:watch\?v=)?([A-Za-z0-9_-]{11})/);
		if (id === null || id.length < 1)
			return null;
		id = id[1];
		return <iframe type="text/html" className="youtube-widget"
  				src={"http://www.youtube.com/embed/"+id+"?enablejsapi=1"}
  				frameborder="0"></iframe>;
	}
};

export default function (props) {
	let track = props.track || props.data;

	if (track.media === null || track.media.length === 0)
		return null;

	for (let social in available) {
		for (let i = 0; i < track.media.length; ++i) {
			if (social === track.media[i].provider) {
				let widget = available[social](track.media[i]);
				if (widget !== null);
					return widget;
			}
		}
	}
	return null;
}