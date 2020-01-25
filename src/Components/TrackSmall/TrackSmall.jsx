import React from 'react';

import { ReactComponent as MusicPic } from '../../CommonAssets/music.svg';
import MediaLink from '../MediaLink/MediaLink';
import './TrackSmall.css';

export default function (props) {
	let track = props.track || props.data || {};

	let medias = (track.media || []).filter(x => x.provider !== 'apple_music').sort().map(social => {
		return <MediaLink 
					href={social.url||social.uri}
					social={social.provider}
					key={social.provider}
					size="small" />
	});

	return (
		<div className="track-small">
			<div className="cover">
				<div className="blank">
					<MusicPic />
				</div>
				<div className="img" style={{backgroundImage: 'url(' + track.cover + ')'}} />
			</div>
			<div className="info">
				<span>
					<h1>{track.title}</h1>
					<h2>{track.artist}</h2>
				</span>
			</div>
			<div className="media">
				<span>
					{ medias }
				</span>
			</div>
		</div>
	)
}