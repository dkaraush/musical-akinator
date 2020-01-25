import Storage from './Storage';
import crc32 from 'crc/crc32';

function randomString(n) {
	if (typeof n !== 'number')
		n = 16;
	const q = "1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
	return Array.from({length: n}, () => q[Math.round(Math.random() * (q.length-1))]).join('');
}
function queryToStr(obj) {
	return Object.keys(obj).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(obj[key])).join('&');
}
function cutObject(keys, obj) {
	let nobj = {};
	for (let i = 0, key; i < keys.length; ++i) {
		key = keys[i];
		if (typeof obj[key] === 'undefined')
			nobj[key] = null;
		else nobj[key] = obj[key];
	}
	return nobj;
}

let cache = Storage.get('cache', {});
function updCache() {
	for (let key in cache)
		if (Date.now() - cache[key].t > 1000 * 60 * 60)
			delete cache[key];
}
const escapeCORS = 'https://cors-anywhere.herokuapp.com/';
function httpCache(method, url, before, callback, isCORS) {
	if (arguments.length === 3) {
		callback = before;
		before = undefined;
	}

	let k = crc32(method + ' ' + url).toString(16);
	if (cache[k] && typeof cache[k].r !== 'undefined' && cache[k].r !== null && !before) {
		callback(true, cache[k].r);
		return;
	}

	http(method, url, before, function (status, res) {
		if (!before && status) {
			cache[k] = {t: Date.now(), r: res};
			updCache();
			Storage.set('cache', cache);
		}

		callback.apply(this, Array.prototype.slice.apply(arguments));
	})
}
function http(method, url, before, callback, isCORS) {
	if (arguments.length === 3) {
		callback = before;
		before = undefined;
	}


	let xhr = new XMLHttpRequest();
	xhr.open(method, url, true);

	xhr.onreadystatechange = () => {
		if (xhr.readyState !== 4) return;

		if (xhr.status === 200) {
			let res = xhr.responseText;
			try {
				res = JSON.parse(res);
			} catch (e) {}

			callback(true, res);
		} else {
			console.warn("Failed to send HTTP request: bad status code (" + xhr.status + ")");
			callback(false, "Bad status code: " + xhr.status);
		}
	}
	// xhr.onerror = (err) => {
	// 	if (!isCORS)
	// 		http(method, escapeCORS + (url), before, callback, true);
	// 	else
	// 		console.log(err);
	// }

	if (isCORS) {
		// xhr.setRequestHeader("Origin", window.location.href);
		xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	}

	if (typeof before !== 'function')
		xhr.send();	
	else before(xhr);
}

class APIController {
	constructor(type, options) {
		this.type = type;
		this.options = options;
		this.session_id = Storage.get('session', randomString(16));
	}
	endpoint(name) {
		let a = APIController.endpoint[this.type];
		if (typeof a === 'string')
			return a;
		if (typeof a === 'object' && typeof name === 'undefined')
			return a.audd;
		return a[name];
	}
	query(type, req) {
		let obj = {};
		if (req.type === 'text')
			obj.q = req.value;

		if (type === 'direct') {
			obj.return = 'timecode,lyrics,apple_music,deezer,spotify';
			obj.api_token = this.options.audd_token;
		} else
			obj.session = this.session_id;
		return obj;
	}

	simulateAnswer(bool) {
		let score = Storage.get('score', {computer: 0, human: 0});
		score[bool ? 'computer' : 'human']++;
		Storage.set('score', score);
		return score;
	}
	simulateScore() {
		return Storage.get('score', {computer: 0, human: 0});
	}
	simulateAPIServerResponse(obj) {
		return new Promise((resolve, reject) => {

			let response = (result) => {
				resolve({
					result: result,
					score: this.simulateScore()
				})
			};

			if (obj && obj.status !== 'error' && obj.result !== null) {
				let track = obj.result.list ? obj.result.list[0] : obj.result[0];
				if (typeof track === 'undefined' || track === null) {
					response(null);
					return;
				}
				if (typeof track.media === 'string')
					track.media = JSON.parse(track.media);
				if (track.media)
					track.media = track.media.map(cutObject.bind(this, ['provider', 'url']));

				let promises = [
					this.geniusSearch(track),
					this.deezerSearch(track)
				];
				Promise.all(promises)
					.then(() => {
						response(cutObject(['title', 'media', 'artist', 'lyrics', 'cover'], track));
					});
			} else
				response(null)
		});
	}

	putMediaToTrack(track, media) {
		if (!Array.isArray(track.media))
			track.media = [];
		
		if (track.media.map(m => m.provider).indexOf(media.provider) < 0)
			track.media.push(media);
	}
	putGeniusData(data, track) {
		if (data.path) {
			this.putMediaToTrack(track, {provider: 'genius', url: "https://genius.com" + data.path});
		}
		if (data.media) {
			for (let i = 0; i < data.media.length; ++i)
				this.putMediaToTrack(track, data.media[i]);
		}
		if (data.song_art_image_url)
			track.cover = data.song_art_image_url;
		if (!track.song_id && data.id)
			track.song_id = data.id;
	}
	probablyEqual(a, b) {
		let len = Math.min(a.length, b.length);
		return a.toLowerCase().trim().substring(0, len) === b.toLowerCase().trim().substring(0, len);
	}
	geniusSearch(track) {
		return new Promise((resolve, reject) => {
			let url = this.endpoint('genius');
			if (track.song_id)
				url += 'songs/' + track.song_id + '?access_token=' + this.options.genius_token;
			else 
				url += 'search?' + queryToStr({q: track.artist + ' ' + track.title, access_token: this.options.genius_token});

			http('GET', url,
				(status, data) => {
					if (status && data.response && data.response.hits) {
						let appropriate = null;
						for (let i = 0; i < data.response.hits.length; ++i) {
							let hit = data.response.hits[i];
							if (hit.result && 
								hit.result.title &&
								hit.result.primary_artist.name &&
								this.probablyEqual(hit.result.title, track.title) &&
								this.probablyEqual(hit.result.primary_artist.name, track.artist)) {
								appropriate = hit.result;
								break;
							}
						}
						if (appropriate !== null) {
							this.putGeniusData(appropriate, track);
							if (track.song_id) {
								this.geniusSearch(track)
									.then(resolve)
									.catch(reject);
								return;
							}
						}
					} else if (status && data.response && data.response.song) {
						this.putGeniusData(data.response.song, track);
					}
					resolve();
				}
			);
		});
	}
	deezerSearch(track) {
		return new Promise((resolve, reject) => {
			http('GET', escapeCORS + this.endpoint('deezer') + 'search?' + queryToStr({
				q: "track:\""+track.title+"\" artist:\""+track.artist+"\"",
				strict: "on"
			}), (x) => x.send(), (status, data) => {
				if (status && data.data && data.data.length > 0) {
					data = data.data[0];
					if (data.link) {
						this.putMediaToTrack(track, {provider: 'deezer', url: data.link});
					}

					if (data.album && data.album.cover_big)
						track.cover = data.album.cover_big;
					else if (data.artist && data.artist.picture_big)
						track.cover = data.artist.picture_big;
				}
				resolve();
			}, true);
		})
	}


	sendAnswer(bool) {
		return new Promise((resolve, reject) => {
			if (this.type === 'backend') {
				http('POST', 
					 this.endpoint() +
					 APIController.path[this.type][bool]
					 + '?' + queryToStr({session: this.session_id}),
					 (status, data) => {
					 	(status ? resolve : reject)(data);
					 }
				);
			} else {
				resolve(this.simulateAnswer(bool));
			}
		})
	}

	send(requestObject) {
		console.log("API.send(", requestObject, ")")
		return new Promise((resolve, reject) => {
			let url = this.endpoint() + 
					  APIController.path[this.type][requestObject.type] + 
					  '?' + queryToStr(this.query(this.type, requestObject));
			let xhr = new window.XMLHttpRequest();
			xhr.open('POST', url, true);
			let onResponse = (status, data) => {
				if (!status) {
					reject(data);
					return;
				}

				console.log("<= ", data);

				if (this.type === 'direct') {
					this.simulateAPIServerResponse(data)
						.then(resolve)
						.catch(reject);
				} else
					resolve(data);
			};

			let func = this.type === 'direct' ? httpCache : http;

			if (requestObject.type === 'text' && this.type === 'direct')
				func('POST', url, onResponse);
			else {
				func('POST', url, (xhr) => {
					if (requestObject.type === 'audio') {
						let data = new window.FormData();
						console.log(requestObject)
						data.append("file", requestObject.value);
						window.data = data;
						xhr.send(data);
					} else if (requestObject.type === 'text') {
						xhr.send();
					}
				}, onResponse);
			}
		});
	}
}
APIController.endpoint = {
	'direct': {
		audd: 'https://api.audd.io/', 
		genius: 'https://api.genius.com/', 
		deezer: 'https://api.deezer.com/'
	},
	'backend': process.env.REACT_APP_API_BACKEND_ENDPOINT
	// backend: "http://localhost:9333/"
};
APIController.path = {
	'direct': {
		// audd.io
		'audio': 'recognizeWithOffset/',
		'text': 'findLyrics/'
	},
	'backend': {
		'audio': 'humming',
		'text': 'lyrics',

		'true': 'right',
		'false': 'wrong'
	}
};

let api;
if (Storage.get('backend'))
	api = new APIController('backend');
else
	api = new APIController(process.env.REACT_APP_API_TYPE, {
		audd_token: process.env.REACT_APP_AUDD_TOKEN,
		genius_token: process.env.REACT_APP_GENIUS_TOKEN
	});
window.api = api;
export default api;