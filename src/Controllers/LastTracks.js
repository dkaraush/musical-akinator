import Storage from './Storage';
import crc32 from 'crc/crc32';

const MAX_COUNT = 5;

class LastTracks {
	constructor() {
		this.data = Storage.get("last-data", {});
		this.list = Storage.get("last-list", []);

		this.clean();
	}

	calcHash(track) {
		return crc32(JSON.stringify(track));
	}

	push(track) {
		if (track.lyrics) {
			track = Object.assign({}, track); // clone object
			delete track.lyrics;
		}

		let hash = this.calcHash(track).toString(16), index;
		if ((index = this.list.indexOf(hash)) >= 0) {
			this.list.splice(index, 1);
			this.list.push(hash);
			return;
		}

		this.data[hash] = track;
		this.list.push(hash);
		this.clean();
		this.save();
	}

	clean() {
		if (this.list.length > MAX_COUNT)
			this.list.splice(0, this.list.length - MAX_COUNT);
		for (let hash in this.data) {
			if (this.list.indexOf(hash) < 0) {
				delete this.data[hash];
				continue;
			}
		}
		for (let i = 0; i < this.list.length; ++i) {
			if (typeof this.data[this.list[i]] === 'undefined') {
				this.list.splice(i, 1);
				i--;
			}
		}
	}

	save() {
		Storage.set('last-data', this.data);
		Storage.set('last-list', this.list);
	}

	length() {
		return Math.max(this.list.length, MAX_COUNT);
	}

	getData() {
		return this.list.slice().reverse().map(hash => this.data[hash]);
	}
}

export default new LastTracks();