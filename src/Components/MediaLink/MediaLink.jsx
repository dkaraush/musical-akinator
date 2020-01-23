import React from 'react';
import './MediaLink.css';

function capitilize(str) {
	str = str.replace(/_/g, ' ');
	str = str.trim();
	return str.slice(0, 1).toUpperCase() + str.slice(1);
}

export default function (props) {
	let img = false;
	if ((['apple_music', 'spotify', 'genius', 'soundcloud', 'youtube']).indexOf(props.social) >= 0)
		img = true;
	let size = props.size || 'small';
	return (
		<a className={"media-link " + size} href={props.link || props.href}>
			{img ? 
				<div style={{backgroundImage: 'url(/social/'+size+"/"+props.social+".svg)"}} /> : 
				capitilize(props.social)
			}
		</a>
	);
}