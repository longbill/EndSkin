const express = require('express');
const EndSkin = require('../endskin.js');
const app = express();

//set the root folder of view files
app.set('views',__dirname);

//set whether to cache templates, when developing, I suggest do not cache it
//app.enable('view cache');

//set endskin the engine for .html files
app.engine('html', EndSkin.__express);

app.get('/',function(req,res)
{
	//now use endskin to parse index.html!  the second parameter is the data object
	res.render('index.html',{a:"b", items: [{type:1,name:"aaa"},{name:"bbb",type:2},{name:"ccc"}]});
});

//start express server
app.listen(3000, () => {
	console.log('test server started on 3000');
});