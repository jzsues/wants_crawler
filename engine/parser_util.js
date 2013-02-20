
var KeyValueSeparator = {
	sep : ':',
	prfx : '##',
	alias : [
		{sep: ':', prfx: '<li><b>'},
		{sep: '<\/td><td class="value">', prfx: '<td class="label">'}
	]
};

KeyValueSeparator.parseKeyvalues = function (htmlfragment) {
	for (var i = KeyValueSeparator.alias.length - 1; i >= 0; i--) {
		if (htmlfragment.search(KeyValueSeparator.alias[i].sep) > 0) {
			htmlfragment = htmlfragment.replace(new RegExp(KeyValueSeparator.alias[i].prfx, 'g'), KeyValueSeparator.prfx);
			htmlfragment = htmlfragment.replace(new RegExp(KeyValueSeparator.alias[i].sep,'g'), KeyValueSeparator.sep);
			break;
		}
	}

	var kvs = text(htmlfragment).split(KeyValueSeparator.prfx);
	var ret = [];
	for (var i = 0; i < kvs.length; i++) {
		kvs[i] = kvs[i].trim();
		var kv = kvs[i].split(KeyValueSeparator.sep);
		if (kv.length == 2) {
			ret.push({k:kv[0].trim(),v:kv[1].trim()});
		}
	};

	return ret;
}

function text(htmlfragment) {
	return htmlfragment.replace(/(<([^>]+)>)/ig,'');
}

module.exports = KeyValueSeparator;