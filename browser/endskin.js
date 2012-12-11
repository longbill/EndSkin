function EndSkin(tmpId)
{
	if (!tmpId)
	{
		throw new Error('EndSkin: no template name passed');
		return;
	}
	this.data = {};
	
	var s = this.getTemplateString(tmpId);
	if (!s) return '';
	var cached_func = this.compile(s);
	
	this.html = function()
	{
		if (typeof cached_func == 'function')
			return cached_func.call(this);
		else
			return cached_func.toString();
	};
	
	return this;
}


EndSkin.prototype.get = function(f)
{
	var dom = document.getElementById(f);
	if (dom) return dom.innerHTML;
	return 'EndSkin Error: no template '+f;
};

EndSkin.prototype.assign = function(key,val)
{
	if (key && val) this.data[key] = val;
	else if (typeof key == 'object')
		for(var k in key)
			this.data[k] = key[k];
	return this;
};

EndSkin.prototype._replace_var_name = function(s)
{
	s = s.replace(/\$[a-z\_0-9\.]+/ig,function(s)
	{
		return 'this.show_val(\"' + s.replace('$','') + '\")';
	});
	return s;
};

EndSkin.prototype.show_val = function(s)
{
	var arr = s.split('.');
	var val = this.data;
	for(var i=0;i<arr.length;i++)
	{
		var key = arr[i];
		if (!val[key]) return '';
		val = val[key];
	}
	if (typeof val == 'function') val = val();
	return val;
};

EndSkin.prototype.getTemplateString = function(id)
{
	var s = this.get(id);
	if (!s)
	{
		throw new Error('EndSkin: template "'+id+'" not found');
		return;
	}
	//TRIP.log(id);
	//TRIP.log(s);
	var ms = s.match(/\{include (.*?)\}/gi);
	if (ms) for(var i=0,m;m=ms[i]; i++)
	{
		var _ms = m.match(/\{include (.*?)\}/i);
		s = s.replace(m,this.getTemplateString(_ms[1]));
	}

	var ms = s.match(/\<\!\-\-\s*include (.*?)\s*\-\-\>/gi);
	if (ms) for(var i=0,m;m=ms[i]; i++)
	{
		var _ms = m.match(/\<\!\-\-\s*include (.*?)\s*\-\-\>/i);
		s = s.replace(m,this.getTemplateString(_ms[1]));
	}
	return s;
};


EndSkin.prototype.compile = function(page)
{
	var codeBlocks = [];
	var ms = null,i=0,m;
	if (ms = page.match(/\{(\$[a-zA-Z\_][a-zA-Z0-9\_\.\[\]\'\"]*)\}/ig))
	{
		for(i=0; m=ms[i]; i++)
		{
			var _ms = m.match(/\{(\$[a-zA-Z\_][a-zA-Z0-9\_\.\[\]\'\"]*)\}/i);
			var code = 'output.push('+this._replace_var_name(_ms[1])+');';
			codeBlocks.push(code);
			page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
		}
	}
	
	var foreachBegins = 0;
	if (ms = page.match(/\{(foreach\([^}]+\))\}/ig))
	{
		for(i=0; m=ms[i]; i++)
		{
			var _ms = m.match(/\{foreach\(\s*([a-z0-9\.\_\$]+)\s+as\s+([a-z0-9\_\$]+)\)\}/i);
			if (_ms)
			{
				var variable = this._replace_var_name(_ms[1]);
				var item = _ms[2].replace(/^\$/,'');
				var code = '(function()\n{\nvar __var = '+variable+';\nfor(var __key in __var)\n{\nthis.data[\"'+item+'\"] = __var[__key]; \n';
				codeBlocks.push(code);
				page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
				continue;
			}
			else
			{
				var _ms = m.match(/\{foreach\(\s*([a-z0-9\.\_\$]+)\s+as\s+([a-z0-9\_\$]+)\s*\=>\s*([a-z0-9\_\$]+)\)\}/i);
				if (_ms)
				{
					var variable = this._replace_var_name(_ms[1]);
					var _k_item = _ms[2].replace(/^\$/,'');
					var _v_item = _ms[3].replace(/^\$/,'');
					var code = '(function()\n{\nvar __var = '+variable+';\nfor(var __key in __var)\n{\nthis.data[\"'+_k_item+'\"] = __key;\nthis.data[\"'+_v_item+'\"] = __var[__key]; \n';
					codeBlocks.push(code);
					page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
					continue;
				}
			}
			foreachBegins++;
		}
	}
	
	var ifBegins = 0;
	if (ms = page.match(/\{(else\s*)?if\(.*?\)\}/ig))
	{
		for(i=0; m=ms[i]; i++)
		{
			var _ms = m.match(/\{if\((.*?)\)\}/i);
			if (_ms)
			{
				var cond = this._replace_var_name(_ms[1]);
				var code = 'if ('+cond+')\n{\n';
				codeBlocks.push(code);
				page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
				ifBegins++;
			}
			else if (_ms = m.match(/\{else\s*if\((.*?)\)\}/i))
			{
				var cond = this._replace_var_name(_ms[1]);
				var code = '}\nelse if ('+cond+')\n{\n';
				codeBlocks.push(code);
				page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
			}
		}
	}
	
	var ifEnds = 0;
	if (ms = page.match(/\{\/if\}/ig))
	{
		for(i=0; m=ms[i]; i++)
		{
			var code = '}\n';
			codeBlocks.push(code);
			page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
			ifEnds++;
		}
	}
	
	var foreachEnds = 0;
	if (ms = page.match(/\{\/foreach\}/ig))
	{
		for(i=0; m=ms[i]; i++)
		{
			var code = '}\n}).call(this);\n';
			codeBlocks.push(code);
			page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
			foreachEnds++;
		}
	}
	
	
	if (ms = page.match(/\{else\}/ig))
	{
		for(i=0; m=ms[i]; i++)
		{
			var code = '}\nelse\n{\n';
			codeBlocks.push(code);
			page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
		}
	}
	
	
	if (ms = page.match(/\{[a-z0-9\$\.\_]+\([^\}]*\)\}/ig))
	{
		for(i=0; m=ms[i]; i++)
		{
			var _ms = m.match(/\{([a-z0-9\$\.\_]+)\(([^\}]*)\)\}/i);
			var code = 'output.push('+_ms[1]+'('+this._replace_var_name(_ms[2])+'));';
			codeBlocks.push(code);
			page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
		}
	}
	
	if (ms = page.match(/<\%\=([\s\S]*?)\%>/ig))
	{
		for(i=0; m=ms[i]; i++)
		{
			var _ms = m.match(/<\%\=([\s\S]*?)\%>/i);
			var code = _ms[1].replace(/^\s+|\s+$/g,'').replace(/\;$/,'');
			code = 'output.push('+code+');';
			codeBlocks.push(code);
			page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
		}
	}
	
	if (ms = page.match(/<\%([\s\S]*?)\%>/ig))
	{
		for(i=0; m=ms[i]; i++)
		{
			var _ms = m.match(/<\%([\s\S]*?)\%>/i);
			var code = _ms[1];
			codeBlocks.push(code);
			page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
		}
	}
	
	
	var arr = page.replace(/\{\{\{\{EndSkin\.codeblock\[(\d+)\]\}\}\}\}/g,'{{{{EndSkin.codeblock}}}}').split('{{{{EndSkin.codeblock}}}}');
	var ms = page.match(/\{\{\{\{EndSkin\.codeblock\[(\d+)\]\}\}\}\}/g);

	var codes = ['var output = [];'];
	for(i=0;i<arr.length-1; i++)
	{
		codes.push('output.push('+this.stringify(arr[i])+');\n');
		var _ms = ms[i].match(/\{\{\{\{EndSkin\.codeblock\[(\d+)\]\}\}\}\}/);
		codes.push(codeBlocks[parseInt(_ms[1])]+'\n');
	}
	codes.push('output.push('+this.stringify(arr.pop())+');\n');
	codes.push("return output.join('');");


	try
	{
		return new Function(codes.join(''));
	}
	catch(e)
	{
		var err = [];
		if (foreachBegins > foreachEnds) err.push('missing '+(foreachBegins - foreachEnds)+' {/foreach}');
		if (foreachBegins < foreachEnds) err.push('too much {/foreach}');
		if (ifBegins > ifEnds) err.push('missing '+(ifBegins - ifEnds)+' {/if}');
		if (ifBegins < ifEnds) err.push('too much {/if}');
		var re = 'EndSkin Compile Error: \nview file:'+tmpId+'\n'+e.toString() + ';\n' + err.join(';\n');
		throw new Error(re);
		return re;
	}
};

EndSkin.prototype.stringify = function(s)
{
	if (window['JSON'] && JSON.stringify) return JSON.stringify(s);
	s = s.replace(/\\/g, '\\\\').
        replace(/\u0008/g, '\\b').
        replace(/\t/g, '\\t').
        replace(/\n/g, '\\n').
        replace(/\f/g, '\\f').
        replace(/\r/g, '\\r').
        replace(/'/g, '\\\'').
        replace(/"/g, '\\"');
	return '"'+s+'"';
};