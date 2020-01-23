let temp = {};
const getters = [
	(name) => JSON.parse(localStorage.getItem(name)),
	(name) => {
		let matches = document.cookie.match(new RegExp(
			"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
		));
		return matches ? JSON.parse(decodeURIComponent(matches[1])) : null;
	},
	(name) => temp[name]
];
const setters = [
	(name, value) => localStorage.setItem(name, JSON.stringify(value)),
	(name, value) => document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(JSON.stringify(value)),
	(name, value) => temp[name] = value
];

const Storage = {
	get: (name, def) => {
		let value = null;
		for (let i = 0; i < getters.length; ++i) {
			value = getters[i](name);
			if (value != null || typeof value !== 'undefined')
				break;
			else value = null;
		}
		if ((value == null || typeof value === 'undefined') && typeof def !== 'undefined') {
			Storage.set(name, def);
			return def;
		} else
			return value;
	},
	set: (name, value) => {
		for (let i = 0; i < setters.length; ++i)
			setters[i](name, value);
	}
};
window.Storage = Storage;
export default Storage;