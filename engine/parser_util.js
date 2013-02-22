
var KeyValueSeparator = {
	sep : 		'#@#@',

	// add new pattern for keyvalues extraction here
	KV_PATTERN_PROD_DETAILS : {
		alias : [
			{sep: ':', pattern: '<li><b>(.(?!<\/li>)|\n)+<\/b>(.(?!<\/b>)|\n)*<\/li>'},
			{sep: '<\/td>[\s]*<td class="value">', pattern: '<tr[^<>]*>[\s ]*<td class="label">.+<\/td>[\s ]*<td class="value">(.(?!<\/tr>)|[\n\r])*<\/td><\/tr>'}
		]	
	},

	KV_PATTERN_PROD_FEATURES : {
		alias : [
			{sep: '<ul[^>]*>', pattern: '<li>(.(?!<li>))+<\/li>'},
		]
	}, 

	KV_PATTERN_PROD_SPEC : {
		alias : [
			{sep: '<\/span><span>', pattern: '<div class="tsRow"><span class="tsLabel">.+<\/span><span>.+<\/span><\/div>'}
		]		
	},

	KV_PATTERN_PROD_DESC : {
		alias : [
			{sep: '<div class="productDescriptionWrapper">', pattern: '<h3 class="productDescriptionSource">.+<\/h3>(\s|\r|\n)*<div class="productDescriptionWrapper">((.?!<h3>)|\s|\r|\n)+<\/div>'}
		]
	}

};

KeyValueSeparator.parseKeyvalues = function (htmlfragment, mapper, isList) {
	var kvs = [], ret = [];
	var aliasId = -1;

	for (var i = mapper.alias.length - 1; i >= 0; i--) {
		if (htmlfragment.search(mapper.alias[i].sep) > 0) {
			kvs = htmlfragment.match(new RegExp(mapper.alias[i].pattern, 'g'));
			aliasId = i;
			console.log('hit!!!! at:'+i + ' kvs:'+kvs);
			break;
		}
	}

	if (aliasId >= 0 && kvs && kvs.length > 0) {
		console.log('kvs size:'+kvs.length+'\n');
		for (var i = 0; i < kvs.length; i++) {
			kvs[i] = kvs[i].replace(/\n/g,'');
			kvs[i] = kvs[i].replace(new RegExp(mapper.alias[aliasId].sep, 'g'), KeyValueSeparator.sep);
			kvs[i] = text(kvs[i]);
			console.log(kvs[i]);
		}

		for (var i = 0; i < kvs.length; i++) {
			kvs[i] = kvs[i].trim();
			if (isList) {
				ret.push(kvs[i]);
			} else {
				var kv = kvs[i].split(KeyValueSeparator.sep);
				if (kv.length == 2) {
					ret.push({k:kv[0].trim(),v:kv[1].trim()});
				} 
			}
		}
	}

	return ret;
}

KeyValueSeparator.text = text = function(htmlfragment) {
	return htmlfragment
		.replace(/<script[^<>]*>(.|\n|\r)*<\/script>|<style[^<>]*>(.|\n|\r)*<\/style>|&nbsp;/ig,'')
		.replace(/(<([^>]+)>)/ig,'');
}

module.exports = KeyValueSeparator;