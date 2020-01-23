import React from 'react';
import './Loading.css';

function classes(obj) {
	let res = [];
	for (let key in obj)
		if (obj[key])
			res.push(key)
	return res.join(' ');
}

export default function (props) {
	return <div className={classes({
		loading: true,
		inline: props.inline
	})}></div>
}