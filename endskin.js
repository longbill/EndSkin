let RootPath = '';
const fs = require('fs');
const path = require('path');

module.exports.setRoot = function(p) {
	RootPath = p;
};

module.exports.create = function(f) {
	return new EndSkin(f);
};

exports.cache = {};

function EndSkin(tmpId) {
	if (!tmpId) {
		throw new Error('EndSkin: no template name passed');
		return;
	}
	let codeBlocks = [];

	this.templateReader = function(f,cb) {
		let file = path.resolve(RootPath, f);
		return fs.readFileSync(file,'utf-8');
	};
	
	this.getTemplateString = function(id) {
		let s = this.templateReader(id), ms;
		if (!s) {
			throw new Error('EndSkin: template "'+id+'" not found');
			return;
		}

		if (ms = s.match(/\{include (.*?)\}/gi)) {
			for(let i=0,m;m=ms[i]; i++) {
				let _ms = m.match(/\{include (.*?)\}/i);
				s = s.replace(m,this.getTemplateString(_ms[1]));
			}
		}

		if (ms = s.match(/\<\!\-\-\s*include (.*?)\s*\-\-\>/gi)) {
			for(let i=0,m;m=ms[i]; i++) {
				let _ms = m.match(/\<\!\-\-\s*include (.*?)\s*\-\-\>/i);
				s = s.replace(m,this.getTemplateString(_ms[1]));
			}
		}
		return s;
	}
	
	this.data = {};
	
	this.assign = function(key,val) {
		if (key && val) {
			this.data[key] = val;
		} else if (typeof key == 'object') {
			for(let k in key) this.data[k] = key[k];
		}
		return this;
	};
	
	
	this.compile = function(page) {
		let ms = null,i=0,m,_ms;
		if (ms = page.match(/\{(\$[a-zA-Z\_][a-zA-Z0-9\_\.\[\]\'\"]*)\}/ig)) {
			for(i=0; m=ms[i]; i++) {
				let _ms = m.match(/\{(\$[a-zA-Z\_][a-zA-Z0-9\_\.\[\]\'\"]*)\}/i);
				let code = 'output.push('+this._replace_var_name(_ms[1])+');';
				codeBlocks.push(code);
				page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
			}
		}
		
		let foreachBegins = 0;
		if (ms = page.match(/\{(foreach\([^}]+\))\}/ig)) {
			for(i=0; m=ms[i]; i++) {
				if (_ms = m.match(/\{foreach\(\s*([a-z0-9\.\_\$]+)\s+as\s+([a-z0-9\_\$]+)\)\}/i)) {
					let variable = this._replace_var_name(_ms[1]);
					let item = _ms[2].replace(/^\$/,'');
					let code = '(function()\n{\nvar __var = '+variable+';\nfor(var __key in __var)\n{\nthis.data[\"'+item+'\"] = __var[__key]; \n';
					codeBlocks.push(code);
					page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
					continue;
				} else {
					if (_ms = m.match(/\{foreach\(\s*([a-z0-9\.\_\$]+)\s+as\s+([a-z0-9\_\$]+)\s*\=>\s*([a-z0-9\_\$]+)\)\}/i)) {
						let variable = this._replace_var_name(_ms[1]);
						let _k_item = _ms[2].replace(/^\$/,'');
						let _v_item = _ms[3].replace(/^\$/,'');
						let code = '(function()\n{\nvar __var = '+variable+';\nfor(var __key in __var)\n{\nthis.data[\"'+_k_item+'\"] = __key;\nthis.data[\"'+_v_item+'\"] = __var[__key]; \n';
						codeBlocks.push(code);
						page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
						continue;
					}
				}
				foreachBegins++;
			}
		}
		
		let ifBegins = 0;
		if (ms = page.match(/\{(else\s*)?if\(.*?\)\}/ig)) {
			for(i=0; m=ms[i]; i++) {
				let _ms = m.match(/\{if\((.*?)\)\}/i);
				if (_ms) {
					let cond = this._replace_var_name(_ms[1]);
					let code = 'if ('+cond+')\n{\n';
					codeBlocks.push(code);
					page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
					ifBegins++;
				} else if (_ms = m.match(/\{else\s*if\((.*?)\)\}/i)) {
					let cond = this._replace_var_name(_ms[1]);
					let code = '}\nelse if ('+cond+')\n{\n';
					codeBlocks.push(code);
					page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
				}
			}
		}
		
		let ifEnds = 0;
		if (ms = page.match(/\{\/if\}/ig)) {
			for(i=0; m=ms[i]; i++) {
				let code = '}\n';
				codeBlocks.push(code);
				page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
				ifEnds++;
			}
		}
		
		let foreachEnds = 0;
		if (ms = page.match(/\{\/foreach\}/ig)) {
			for(i=0; m=ms[i]; i++) {
				let code = '}\n}).call(this);\n';
				codeBlocks.push(code);
				page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
				foreachEnds++;
			}
		}
		
		
		if (ms = page.match(/\{else\}/ig)) {
			for(i=0; m=ms[i]; i++) {
				let code = '}\nelse\n{\n';
				codeBlocks.push(code);
				page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
			}
		}
		
		
		if (ms = page.match(/\{[a-z0-9\$\.\_]+\([^\}]*\)\}/ig)) {
			for(i=0; m=ms[i]; i++) {
				let _ms = m.match(/\{([a-z0-9\$\.\_]+)\(([^\}]*)\)\}/i);
				let code = 'output.push('+_ms[1]+'('+this._replace_var_name(_ms[2])+'));';
				codeBlocks.push(code);
				page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
			}
		}
		
		if (ms = page.match(/<\%\=([\s\S]*?)\%>/ig)) {
			for(i=0; m=ms[i]; i++) {
				let _ms = m.match(/<\%\=([\s\S]*?)\%>/i);
				let code = _ms[1].replace(/^\s+|\s+$/g,'').replace(/\;$/,'');
				code = 'output.push('+code+');';
				codeBlocks.push(code);
				page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
			}
		}
		
		if (ms = page.match(/<\%([\s\S]*?)\%>/ig)) {
			for(i=0; m=ms[i]; i++) {
				let _ms = m.match(/<\%([\s\S]*?)\%>/i);
				let code = _ms[1];
				codeBlocks.push(code);
				page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
			}
		}
		
		
		let arr = page.split(/\{\{\{\{EndSkin\.codeblock\[\d+\]\}\}\}\}/);
		ms = page.match(/\{\{\{\{EndSkin\.codeblock\[(\d+)\]\}\}\}\}/g);

		let codes = ['var output = [];'];
		for(i=0;i<arr.length-1; i++) {
			codes.push('output.push('+JSON.stringify(arr[i])+');\n');
			let _ms = ms[i].match(/\{\{\{\{EndSkin\.codeblock\[(\d+)\]\}\}\}\}/);
			codes.push(codeBlocks[parseInt(_ms[1])]+'\n');
		}
		codes.push('output.push('+JSON.stringify(arr.pop())+');\n');
		codes.push("return output.join('');");


		try {
			return new Function(codes.join(''));
		} catch(e) {
			let err = [];
			if (foreachBegins > foreachEnds) err.push('missing '+(foreachBegins - foreachEnds)+' {/foreach}');
			if (foreachBegins < foreachEnds) err.push('too much {/foreach}');
			if (ifBegins > ifEnds) err.push('missing '+(ifBegins - ifEnds)+' {/if}');
			if (ifBegins < ifEnds) err.push('too much {/if}');
			let re = 'EndSkin Compile Error: \nview file:'+tmpId+'\n'+e.toString() + ';\n' + err.join(';\n');
			throw new Error(re);
			return re;
		}
	}
	
	this._replace_var_name = function(s) {
		s = s.replace(/\$[a-z\_0-9\.]+/ig,function(s) {
			return 'this.show_val(\"' + s.replace('$','') + '\")';
		});
		return s;
	}
	
	
	
	this.show_val = function(s) {
		let arr = s.split('.');
		let val = this.data;
		for(let i=0;i<arr.length;i++) {
			let key = arr[i];
			if (val[key] == undefined) return '';
			val = val[key];
		}
		if (typeof val == 'function') val = val();
		return val;
	}
	
	let s = this.getTemplateString(tmpId);
	if (!s) return;
	let cached_func = this.compile(s);
	
	this.html = function() {
		if (typeof cached_func == 'function')
			return cached_func.call(this);
		else
			return cached_func.toString();
	};
	
	return this;
};



/*
* express 3.x, 4.x support
*/
exports.renderFile = function(filename, options, fn) {
	let key = filename + ':func', tmpId = '';

	if('function' == typeof options) {
		fn = options, options = {};
	}

	if (options.settings && options.settings.views) {
		RootPath = options.settings.views;
		tmpId = filename;
	} else {
		RootPath = path.dirname(filename);
		tmpId = path.basename(filename);
	}
	try {
		if (options.cache && exports.cache[key]) {
			exports.cache[key].data = options;
			fn(null,exports.cache[key].html());
		} else {
			let func = new EndSkin(tmpId);
			exports.cache[key] = func;
			func.assign(options);
			fn(null,func.html());
		}
	} catch(err) {
		fn(err);
	}
};


exports.__express = exports.renderFile;
