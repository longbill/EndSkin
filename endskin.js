var RootPath = '';
var fs = require('fs');

module.exports.setRoot = function(p)
{
	RootPath = p;
	if (!RootPath.match(/\/$/)) RootPath+='/';
}

module.exports.create = function(f)
{
	return new EndSkin(f);
}

function EndSkin(tmpId)
{
	if (!tmpId)
	{
		throw new Error('EndSkin: no template name passed');
		return;
	}
	var codeBlocks = [];

	this.templateReader = function(f,cb)
	{
		var file = RootPath+f;
		return fs.readFileSync(file,'utf-8');
	}
	
	this.getTemplateString = function(id)
	{
		var s = this.templateReader(id);
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
		return s;
	}
	
	this.data = {};
	
	this.assign = function(key,val)
	{
		if (key && val) this.data[key] = val;
		else if (typeof key == 'object')
			for(var k in key)
				this.data[k] = key[k];
		return this;
	}
	
	
	this.compile = function(page)
	{
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
			}
		}
		
		
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
				}
				else if (_ms = m.match(/\{else\s*if\((.*?)\)\}/i))
				{
					var cond = this._replace_var_name(_ms[1]);
					var code = '}\nelseif ('+cond+')\n{\n';
					codeBlocks.push(code);
					page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
				}
			}
		}
		
		if (ms = page.match(/\{\/if\}/ig))
		{
			for(i=0; m=ms[i]; i++)
			{
				var code = '}\n';
				codeBlocks.push(code);
				page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
			}
		}
		
		if (ms = page.match(/\{\/foreach\}/ig))
		{
			for(i=0; m=ms[i]; i++)
			{
				var code = '}\n}).call(this);\n';
				codeBlocks.push(code);
				page = page.replace(m,'{{{{EndSkin.codeblock['+(codeBlocks.length-1)+']}}}}');
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
		
		
		var arr = page.split(/\{\{\{\{EndSkin\.codeblock\[\d+\]\}\}\}\}/);
		var ms = page.match(/\{\{\{\{EndSkin\.codeblock\[(\d+)\]\}\}\}\}/g);

		var codes = ['var output = [];'];
		for(i=0;i<arr.length-1; i++)
		{
			codes.push('output.push('+JSON.stringify(arr[i])+');\n');
			var _ms = ms[i].match(/\{\{\{\{EndSkin\.codeblock\[(\d+)\]\}\}\}\}/);
			codes.push(codeBlocks[parseInt(_ms[1])]+'\n');
		}
		codes.push('output.push('+JSON.stringify(arr.pop())+');\n');
		codes.push("return output.join('');");


		return new Function(codes.join(''));
	}
	
	this._replace_var_name = function(s)
	{
		s = s.replace(/\$[a-z\_0-9\.]+/ig,function(s)
		{
			return 'this.show_val(\"' + s.replace('$','') + '\")';
		});
		return s;
	}
	
	
	
	this.show_val = function(s)
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
	}
	
	var s = this.getTemplateString(tmpId);
	if (!s) return;
	var cached_func = this.compile(s);
	
	this.html = function()
	{
		return cached_func.call(this);
	};
	
	return this;
};
