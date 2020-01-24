import React from 'react';
import './MediaLink.css';

function capitilize(str) {
	str = str.replace(/_/g, ' ');
	str = str.trim();
	return str.slice(0, 1).toUpperCase() + str.slice(1);
}

class MediaLink extends React.Component {
	constructor(props) {
		super(props);

		this.social = props.social;
		this.link = props.link || props.href;
		this.img = false;
		if ((['apple_music', 'spotify', 'genius', 'soundcloud', 'youtube', 'deezer']).indexOf(props.social) >= 0)
			this.img = true;
		
		this.state = {size: props.size === 'big' ? (window.innerWidth < 700 ? 'small' : 'big') : props.size || 'small'};
		this.onResize = this.resize.bind(this);
	}

	componentDidMount() {
		if (this.props.size === 'big')
			window.addEventListener('resize', this.onResize);
	}

	componentWillMount() {
		if (this.props.size === 'big')
			window.removeEventListener('resize', this.onResize);
	}
		
	resize() {
		let newSize = (window.innerWidth < 700 ? 'small' : 'big');
		if (newSize != this.state.size)
			this.setState({size: newSize});
	}

	render() {
		return (
			<a className={"media-link " + this.state.size} href={this.link} title={capitilize(this.social)} target="_blank">
				{this.img ? 
					<div style={{backgroundImage: 'url(/social/'+this.state.size+"/"+this.social+".svg)"}} /> : 
					capitilize(this.social)
				}
			</a>
		);
	}
}

export default MediaLink;