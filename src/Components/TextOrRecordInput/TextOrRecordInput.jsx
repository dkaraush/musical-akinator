import React from 'react';
import ReactDOM from 'react-dom';
import { ReactComponent as MicPic } from './mic.svg';
import { ReactComponent as ClosePic } from './close.svg';
import { ReactComponent as SendPic } from './send.svg';

import Button from '../Button/Button';
import './TextOrRecordInput.css';

const MAX_RECORD_LENGTH = 60; // 1 minute


// VERY simple linked list
class LinkedList {
	constructor() {
		this.tail = null;
	}

	push(val) {
		let tail = this.tail;
		this.tail = Object.assign(val, {
			next: tail
		});
	}
}

function classes(obj) {
	return Object.keys(obj).filter(key => obj[key]).join(' ');
}

class TextOrRecordInput extends React.Component {
	constructor(props) {
		super(props);

		this.canvasRendering = false;

		this.context = null;
		this.stream = null;
		this.source = null;
		this.processor = null;
		this.analyser = null;
		this.recorder = null;
		this.chunks = [];
		this.recordingStart = null;

		this.volumes = null;
		this.volumeMax = 0;

		this.statusRef = React.createRef();
		this.canvasRef = React.createRef();
		this.inputRef = React.createRef();

		this.state = {
			type: 'text',
			status: '',
			statusClass: ''
		};

		this.onResize = this.resizeCanvas.bind(this);

		this.callback = props.onSelect;
	}

	componentDidMount() {
		this.resizeCanvas();
		window.addEventListener('resize', this.onResize);
	}
	componentWillUnmount() {
		window.removeEventListener('resize', this.onResize);
	}

	resizeCanvas() {
		let root = ReactDOM.findDOMNode(this);
		let canvas = root.querySelector('canvas');

		canvas.width = root.clientWidth * window.devicePixelRatio;
		canvas.height = root.clientHeight * window.devicePixelRatio;
	}

	onMicClick() {
		this.setState({type: 'mic'});
		navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      		.then((stream) => {
      			this.stream = stream;

      			this.context = new AudioContext();
				this.analyser = this.context.createAnalyser();
			    this.source = this.context.createMediaStreamSource(this.stream);
			    this.processor = this.context.createScriptProcessor(1024, 1, 1);

			    this.recorder = new MediaRecorder(this.stream);
			    this.recorder.ondataavailable = (function (e) {
			    	this.chunks.push(e.data);
			    }).bind(this);

				this.recordingStart = Date.now();
				this.volumes = new LinkedList();
				this.volumeMax = 0;
				this.chunks = [];
				this.recorder.start();
				this.startCanvasRendering();

				this.source.connect(this.analyser);
				this.analyser.connect(this.processor);
				this.processor.connect(this.context.destination);
				this.processor.onaudioprocess = (e) => {
					if (this.stream === null || this.state.type !== 'mic' || this.volumes === null)
						return;
					if (Date.now() - this.recordingStart > MAX_RECORD_LENGTH * 1000) {
						this.stopStream(true);
						return;
					}

					this.analyser.fftSize = 2048;
					let bufferLength = this.analyser.frequencyBinCount;
					let dataArray = new Uint8Array(bufferLength);

					this.analyser.getByteFrequencyData(dataArray);

					let sum = 0;
					for (let i = 0; i < bufferLength; ++i)
						sum += dataArray[i];

					let volume = (sum / bufferLength);
					if (volume > this.volumeMax)
						this.volumeMax = volume;
					this.volumes.push({timestamp: Date.now(), volume: volume});
					// this.renderCanvas();

					this.statusRef.current.innerHTML = this.durationString(Date.now() - this.recordingStart);
				};
      		})
      		.catch(() => {
      			this.setState({
      				statusClass: 'error',
      				status: 'Failed to access microphone'
      			})
      		})
	}
	startCanvasRendering() {
		this.canvasRendering = true;

		let canvas = this.canvasRef.current;
		let ctx = canvas.getContext('2d');
		let render = () => {
			if (!this.canvasRendering)
				return;
			requestAnimationFrame(render.bind(this));

			let W = canvas.width,
				H = canvas.height;

			ctx.clearRect(0, 0, W, H);

			let calculateCoordinates = (function (node, w, h) {
				return {
					x: (node.timestamp - this.recordingStart) / (MAX_RECORD_LENGTH * 1000) * w,
					y: (1 - node.volume / this.volumeMax) * h
				};
			}).bind(this);

			ctx.beginPath();
			let node = this.volumes.tail, first = null, last = null;
			while (node != null) {
				let coordinates = calculateCoordinates(node, W, H);
				if (first == null)
					first = coordinates;
				ctx.lineTo(coordinates.x, coordinates.y);
				last = coordinates;
				node = node.next;
			}
			if (first != null && last != null) {
				ctx.lineTo(0, last.y);
				ctx.lineTo(0, H + 10);
				ctx.lineTo(first.x, H + 10);
			}
			ctx.closePath();

			ctx.lineWidth = window.devicePixelRatio * 1.5;
			ctx.lineCap = 'round';
			ctx.strokeStyle = '#1976d2';
			ctx.fillStyle = '#90caf9';
			ctx.stroke();
			ctx.fill();
		}
		render();
	}
	stopCanvasRendering() {
		this.canvasRendering = false;
	}

	stopStream(send) {
		if (this.stream === null)
			return;
		if (send) {
			this.recorder.onstop = () => {
				let blob = new Blob(this.chunks, { 'type' : this.recorder.mimeType });
				this.callback({type: 'audio', value: blob});
			}
		}
		this.recorder.stop();
		this.stopCanvasRendering();
		this.stream.getTracks().forEach(function (track) {
			track.stop();
		});
		this.stream = null;
	}
	durationString(millis) {
		let sec = Math.floor(millis / 1000);
		let min = Math.floor(sec / 60);
		sec = sec % 60;

		return this.addZeros(min) + ':' + this.addZeros(sec);
	}
	addZeros(str, n) {
		if (typeof n === 'undefined')
			n = 2;
		if (typeof str !== 'string')
			str = str + '';
		if (str.length >= n)
			return str;
		return '0'.repeat(n-str.length) + str;
	}

	onCloseClick() {
		this.setState({type: 'text'});
		this.stopStream(false);

		this.volumes = null;
		this.volumeMax = 0;

	}

	onInputChange() {
		this.updClassName();
	}

	onSendClick() {
		if (this.state.type === 'text') {
			let value = this.inputRef.current.value.trim();
			if (value.length > 0) 
				this.callback({type: 'text', value: value});
		} else {
			if (this.stream !== null)
				this.stopStream(true);
		}
	}

	updClassName() {
		let root = ReactDOM.findDOMNode(this);
		let value = this.inputRef.current.value.trim();
		root.className = classes({
			TextOrRecordInput: true,
			cansend: value.length > 0,
			mic: this.state.type === 'mic',
			text: this.state.type === 'text'
		});
	}

	render() {
		let input = this.inputRef.current, value;
		if (input != null)
			value = input.value;
		else value = '';

		return (
			<div className={classes({
					TextOrRecordInput: true,
					cansend: value.length > 0,
					mic: this.state.type === 'mic',
					text: this.state.type === 'text'
				})}>
				<div className="input-wrapper">
					<input 
						type="text"
						placeholder="Write lyrics here or press mic..."
						ref={this.inputRef}
						onChange={this.onInputChange.bind(this)}
						onKeyPress={this.onInputChange.bind(this)}
						onKeyUp={this.onInputChange.bind(this)} />
				</div>
				<div className={"status "+this.state.statusClass} ref={this.statusRef}>{this.state.status}</div>
				<canvas ref={this.canvasRef}></canvas>
				<Button 
					className="mic borderless round"
					onClick={this.onMicClick.bind(this)}>
					<MicPic />
				</Button>
				<Button
					className="close borderless round"
					onClick={this.onCloseClick.bind(this)}>
					<ClosePic />
				</Button>
				<Button
					className="send borderless round"
					onClick={this.onSendClick.bind(this)}>
					<SendPic />
				</Button>
			</div>
		);
	}
}

export default TextOrRecordInput;