import React from 'react';
import ReactDOM from 'react-dom';
import './Button.css';

class Button extends React.Component {
	constructor(props) {
		super(props);

		this.enterHandler = this.onEnter.bind(this);
		this.state = {
			disabled: props.disabled
		};
	}
	
	_down(element, event) {
		if (this.state.disabled)
			return;
		let rect = element.getBoundingClientRect();
		let x = (event.clientX - rect.left), y = (event.clientY - rect.top);
		let R = Math.max(
					Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)),
					Math.sqrt(Math.pow(x-rect.width, 2) + Math.pow(y, 2)),
					Math.sqrt(Math.pow(x, 2) + Math.pow(y-rect.height, 2)),
					Math.sqrt(Math.pow(x-rect.width, 2) + Math.pow(y-rect.height, 2))
				);

		let ripple = document.createElement('div');
		ripple.className = 'ripple';
		ripple.style.position = 'absolute';
		ripple.style.transition = 'all 0.25s cubic-bezier(0.215, 0.61, 0.355, 1)';
		ripple.style.borderRadius = '50%';
		ripple.style.opacity = '1';
		ripple.style.top = y + "px";
		ripple.style.left = x + "px";
		ripple.style.width = ripple.style.height = '0px';
		ripple.id = 's' + Date.now();
		setTimeout(function () {
			ripple.style.opacity = '0.75';
			ripple.style.top = (y-R) + "px";
			ripple.style.left = (x-R) + "px";
			ripple.style.width = ripple.style.height = R*2 + 'px';
		}, 10);

		element.append(ripple);
	}
	_up(element, event) {
		let ripples = element.querySelectorAll('.ripple');
		if (ripples == null)
			return;

		for (let i = 0; i < ripples.length; ++i) {
			let ripple = ripples[i];
			let start = parseInt(ripple.id.substring(1));
			if (Date.now() - start > 250) {
				ripple.style.opacity = '0';
				setTimeout(ripple.remove.bind(ripple), 250);
			} else {
				setTimeout(function () {
					ripple.style.opacity = '0';
					setTimeout(ripple.remove.bind(ripple), 250);
				}, 250 - (Date.now() - start))
			}
		}
	}

	componentDidMount() {
		let element = ReactDOM.findDOMNode(this);
		element.style.position = 'relative';
		element.style.overflow = 'hidden';

		this.down = this._down.bind(this, element);
		this.up = this._up.bind(this, element);
		element.addEventListener('mousedown', this.down);
		document.body.addEventListener('mouseup', this.up);
	}
	componentWillMount() {
		if (this.props.enter)
			window.addEventListener('keyup', this.enterHandler);
	}
	componentWillUnmount() {
		if (this.props.enter)
			window.removeEventListener('keyup', this.enterHandler);

		document.body.removeEventListener('mouseup', this.up);
	}
	componentWillReceiveProps(nextProps) {
		if (nextProps.disabled !== this.state.disabled)
			this.setState({ disabled: nextProps.disabled });
	}
	onEnter(event) {
		if (event.keyCode === 13 && !event.ctrlKey && !event.metaKey) {
			if (typeof this.props.onClick === 'function' && !this.props.disabled)
				this.props.onClick();
		}
	}

	redirect(to) {
		if (this.props.disabled)
			return;
		window.location.href = to;
	}

	render() {
		let className = this.props.className || '';
		if (this.props.invert)
			className += ' invert';
		if (this.state.disabled)
			className += ' disabled';
		return ( 
			<div className={className+' button'} 
				 id={this.props.id} 
				 onClick={(function () {
				 	if (this.props.disabled)
				 		return;
				 	(this.props.to ? this.redirect.bind(this, this.props.to) : this.props.onClick)();	
				 }).bind(this)}
				 style={this.props.style}>
				 {this.props.children}
			</div> 
		);
	}
}

export default Button;
