var EndSkin = require('../');
EndSkin.setRoot(__dirname);

var t = EndSkin.create('index.html');
var items = [{type:1,name:"aaa"},{name:"bbb",type:2},{name:"ccc"}];



//t.assign('items',items);
t.data.items = items;
//t.assign({ items: items });
t.assign({a:'b'});

console.log(t.html());

t.data = {};

console.log(t.html());