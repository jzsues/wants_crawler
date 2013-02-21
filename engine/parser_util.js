
var KeyValueSeparator = {
	sep : 		'#@#@',

	// add new pattern for keyvalues extraction here
	alias : [
		{sep: ':', pattern: '<li><b>(.(?!<\/li>)|\n)+<\/b>(.(?!<\/b>)|\n)*<\/li>'},
		{sep: '<\/td><td class="value">', pattern: '<tr[^<>]*><td class="label">.+<\/td><td class="value">.+<\/td><\/tr>'}
	]
};

KeyValueSeparator.parseKeyvalues = function (htmlfragment) {
	var kvs = [], ret = [];
	var aliasId = -1;

	//htmlfragment = htmlfragment.replace(/\n/ig,' ');
	//console.log('>>>>>>>>>>\n' + htmlfragment + '\n<<<<<<<<<<<<');

	for (var i = KeyValueSeparator.alias.length - 1; i >= 0; i--) {
		if (htmlfragment.search(KeyValueSeparator.alias[i].sep) > 0) {
			kvs = htmlfragment.match(new RegExp(KeyValueSeparator.alias[i].pattern, 'g'));
			aliasId = i;
			console.log('hit!!!! at:'+i + ' kvs:'+kvs);
			break;
		}
	}

	if (aliasId >= 0) {
		//console.log('kvs size:'+kvs.length+'\n');
		for (var i = 0; i < kvs.length; i++) {
			kvs[i] = kvs[i].replace(/\n/g,'');
			kvs[i] = kvs[i].replace(new RegExp(KeyValueSeparator.alias[aliasId].sep, 'g'), KeyValueSeparator.sep);
			kvs[i] = text(kvs[i]);
			console.log(kvs[i]);
		}

		for (var i = 0; i < kvs.length; i++) {
			kvs[i] = kvs[i].trim();
			var kv = kvs[i].split(KeyValueSeparator.sep);
			if (kv.length == 2) {
				ret.push({k:kv[0].trim(),v:kv[1].trim()});
			}
		}
	}

	return ret;
}

function text(htmlfragment) {
	return htmlfragment
		.replace(/<script[^<>]*>.*<\/script>|<style[^<>]*>.*<\/style>|&nbsp;/ig,'')
		.replace(/(<([^>]+)>)/ig,'');
}

module.exports = KeyValueSeparator;