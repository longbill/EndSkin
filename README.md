# EndSkin Template Engine for NodeJS and Javascript #

## How to ##

	//require the module
	var EndSkin = require('endskin');

	//set the root folder of your view files
	EndSkin.setRoot(__dirname+'/test/');

	//create an endskin instance
	var t = EndSkin.create('index.html');

	//prepare the data to be passed to the view files
	var items = [{type:1,name:"aaa"},{name:"bbb"},{name:"ccc"}];

	//use any of these three methods to pass data
	t.assign('items',items);
	t.data.items = items;
	t.assign({ items: items });

	//call html() method to get the output
	console.log(t.html());

	//re-use the instance,  re-set data
	t.data = {};

	//re-call html() method to get the output
	console.log(t.html());

## Methods ##

	module.setRoot(<String> Root folder path);

	module.create(<String> view file name in Root folder);

	the create() method returns an endskin instance. You can use this instance many times.

## endskin Instance ##

### Properties ###

	<Object> endskin.data
	This is the data object used when you call html() method.
	You can set this property to any value.

### Methods ##
	
	endskin.assign(<Object>);

		The keys in the object passed to assign() will be copied to endskin.data

		endskin.assign(<String> key, value);

		This method will add a key to the endskin.data

		To pass data to an endskin instance. You can use any of the three ways:

			endskin.data.key = value;
			endskin.assign(key,value);
			endskin.assign({ key: value });

		To clear data and reuse the instance. You can set endskin.data to an empty object.

			endskin.data = {};

	endskin.html();

		This method will generate output of the endskin instance.


## Syntax in view file ##

### Variables ###
	
	{$varname}
	this will show the data you setted to endskin.data.varname

	{$obj.keyname}  will show  endskin.data.obj.keyname

	<%=this.data.varname%> will show endskin.data.varname

	<%=global.varname%> will show global.varname ( the nodejs runtime global )

	<%=new Date().toString()%> will show the current datetime string

### if/else ###

	{if($varname)}
	...
	{/if}

	{if($varname == 1 || $varname <= -1)} ... {/if}

	{if($items.length > 0)} ... {else} ... {/if}

### Loops ###

	for example, we passed endskin.data.items = [{type:1,name:"aaa"},{name:"bbb"},{name:"ccc"}];

	{foreach($items as $item)}
		{$item.name}
	{/foreach}

	{foreach($items as $i=>$item)}
		{$i}. {$item.name}
	{/foreacn}

### templates including ###

	{include sub-template.html}

	the file name after "include" is based on the Root folder you setted with EndSkin.setRoot()

	You can include any amount of templates. You can also use include in sub-template.html.
	




	


