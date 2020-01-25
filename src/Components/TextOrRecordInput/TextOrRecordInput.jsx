import React from 'react';
import ReactDOM from 'react-dom';
import { ReactComponent as MicPic } from './mic.svg';
import { ReactComponent as ClosePic } from './close.svg';
import { ReactComponent as SendPic } from './send.svg';
import { ReactComponent as WarnPic } from './warn.svg';

import Button from '../Button/Button';
import './TextOrRecordInput.css';

const MAX_RECORD_LENGTH = 25; // 25 seconds (audd.io)


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

		this.audioSupported = typeof MediaRecorder !== 'undefined' && 
			(!!navigator.getUserMedia || 
				(navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia));

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

		this.inputDivRef = React.createRef();
		this.statusRef = React.createRef();
		this.canvasRef = React.createRef();
		this.inputRef = React.createRef();

		this.state = {
			type: 'text',
			status: '',
			statusClass: ''
		};

		this.onResize = this.resizeCanvas.bind(this);
		this.onKeyPress = this.catchEnter.bind(this);

		this.callback = props.onSelect;
	}

	componentDidMount() {
		this.resizeCanvas();
		window.addEventListener('resize', this.onResize);
		window.addEventListener('keypress', this.onKeyPress);
	}
	componentWillUnmount() {
		window.removeEventListener('resize', this.onResize);
		window.removeEventListener('keypress', this.onKeyPress);
	}

	resizeCanvas() {
		let root = this.inputDivRef.current;
		let canvas = this.canvasRef.current;
		if (canvas == null || root == null)
			return;

		canvas.width = root.clientWidth * window.devicePixelRatio;
		canvas.height = root.clientHeight * window.devicePixelRatio;
		this.renderCanvas(false);
	}
	renderCanvas(loop) {
		let canvas = this.canvasRef.current;
		if (canvas == null)
			return;
		let ctx = canvas.getContext('2d');

		if (loop) {
			if (!this.canvasRendering)
				return;
			requestAnimationFrame(this.renderCanvas.bind(this, loop));
		}

		let W = canvas.width,
			H = canvas.height;

		ctx.clearRect(0, 0, W, H);
		if (this.recordingStart === null)
			return;

		let calculateCoordinates = (function (node, w, h) {
			return {
				x: (node.timestamp - this.recordingStart) / (MAX_RECORD_LENGTH * 1000) * w,
				y: (1 - node.volume / this.volumeMax) * h
			};
		}).bind(this);

		ctx.beginPath();
		if (this.volumes == null) {
			ctx.moveTo(0, H + 10);
			ctx.lineTo(0, H/2);
			ctx.lineTo((Date.now() - this.recordingStart) / (MAX_RECORD_LENGTH * 1000) * W, H/2);
			ctx.lineTo((Date.now() - this.recordingStart) / (MAX_RECORD_LENGTH * 1000) * W, H + 10);
		} else {
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
		}
		ctx.closePath();

		ctx.lineWidth = window.devicePixelRatio * 1.5;
		ctx.lineCap = 'round';
		ctx.strokeStyle = '#1976d2';
		ctx.fillStyle = '#90caf9';
		ctx.stroke();
		ctx.fill();
	}

	onMicClick() {
		this.setState({type: 'mic'});
		let getUserMedia = (window.navigator.mediaDevices ? window.navigator.mediaDevices.getUserMedia : null) || window.navigator.getUserMedia;
		if (!getUserMedia) {
			this.micError('getUserMedia() is not accessible');
			return;
		}

		window.navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      		.then((stream) => {
      			this.stream = stream;

      			let AudioContext = window.AudioContext
									|| window.webkitAudioContext
									|| false;

				if (!this.audioSupported) {
					this.micError('Your browser doesn\'t support audio recording');
	      			return;
				}

				this.chunks = [];
				this.recorder = new MediaRecorder(this.stream);
			    this.recorder.ondataavailable = (function (e) {
			    	this.chunks.push(e.data);
			    }).bind(this);
				this.recorder.start();
				this.recordingStart = Date.now();

				if (AudioContext) {

	      			this.context = new AudioContext();
					this.analyser = this.context.createAnalyser();
				    this.source = this.context.createMediaStreamSource(this.stream);
				    this.processor = this.context.createScriptProcessor(1024, 1, 1);

					this.volumes = new LinkedList();
					this.volumeMax = 0;

					this.source.connect(this.analyser);
					this.analyser.connect(this.processor);
					this.processor.connect(this.context.destination);
					this.setState({
						statusClass: 'info', 
						status: this.durationString(Date.now() - this.recordingStart)
					});
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

						this.statusRef.current.innerHTML = this.durationString(Date.now() - this.recordingStart);
					};
				} else {
					this.volumes = null;
					setTimeout(() => {
						if (Date.now() - this.recordingStart >= MAX_RECORD_LENGTH * 1000)
							this.stopStream(true);
					}, MAX_RECORD_LENGTH * 1000);
				}

				this.startCanvasRendering();
      		})
      		.catch((err) => {
      			this.micError(err);
      		})
	}
	micError(err) {
		this.setState({
			statusClass: 'error',
			status: 'Failed to access microphone: ' + (err+'')
		});
		this.recordingStart = null;
		this.renderCanvas(false);
		this.stream = null;
	}
	startCanvasRendering() {
		this.canvasRendering = true;
		this.renderCanvas(true);
	}
	stopCanvasRendering() {
		if (!this.canvasRendering)
			this.renderCanvas(false); // render last time
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

	send() {
		if (this.state.type === 'text') {
			let value = this.inputRef.current.value.trim();
			if (value.length > 0) 
				this.callback({type: 'text', value: value});
		} else {
			if (this.stream !== null)
				this.stopStream(true);
		}
	}

	catchEnter(e) {
		if (e.keyCode == 13 && this.inputDone())
			this.send();
	}

	inputDone() {
		let input = this.inputRef.current, value;
		if (input != null)
			value = input.value;
		else value = '';

		return (
			(this.state.type == 'text' && value.length > 0) ||
			(this.state.type == 'mic' && this.audioSupported && this.state.statusClass != 'error')
		);
	}

	updClassName() {
		let root = ReactDOM.findDOMNode(this);
		let inputDiv = root.children[root.children.length - 1];

		let value = this.inputRef.current.value.trim();
		inputDiv.className = classes({
			TextOrRecordInput: true,
			cansend: value.length > 0,
			mic: this.state.type === 'mic',
			text: this.state.type === 'text'
		});
	}

	warnText() {
		if ( !window.navigator.getUserMedia && 
			 (!window.navigator.mediaDevices ||
			 !window.navigator.mediaDevices.getUserMedia) &&
			 window.location.protocol === 'http:')
			return "Can't access microphone through http:// protocol (use https)";
		return "Your browser doesn't support microphone recording.";
	}

	render() {
		return (
			<div className="TextOrRecordInputWrapper">
				{
					!this.audioSupported ?
					<div className="warning">
						<WarnPic />
						{this.warnText()}
					</div> : null
				}
				<div className={classes({
						TextOrRecordInput: true,
						cansend: this.inputDone(),
						mic: this.state.type === 'mic',
						text: this.state.type === 'text'
					})}
					ref={this.inputDivRef}>
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
						className={"mic borderless round" + (!this.audioSupported ? ' hidden' : '')}
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
						onClick={this.send.bind(this)}>
						<SendPic />
					</Button>
				</div>
			</div>
		);
	}
}

export default TextOrRecordInput;