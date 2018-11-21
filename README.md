# IDB
Easy-to-use wrapper around the massive [IndexedDB API](https://developer.mozilla.org/de/docs/IndexedDB).

## How to use
First, include the script into your document's head. As of now, there is no built-in support to [export as module](https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Statements/export), because they are [not yet supported](https://caniuse.com/#feat=es6-module) on most proprietary Android-Browsers. (And I'm really not a friend of polyfills :wink:)
```html
<script src="idb.min.js"></script>
```

By including, the `IDB` class becomes accessible within your global scope.
Next, connect to the DB you want to use for your project. Choose a name and setup the tables your DB should contain.
```javascript
IDB.connect({
	name: 'MyProjectStore',
	tables: [
		{name: 'test1'},
		{name: 'test2'}
	]
});
```

The tables you define get bound to the `IDB` context. Now, you are ready to perform transactions. For example, insert and read a value from `test1`:
```javascript
IDB.test1.set('key1', 'value1');
await IDB.test1.get('key1');
```

Which will yield `'value1'`. And that's it! You can now work with your DB.
For more details, have a look at the API specification. (coming soon)

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Acknowledgments
* Inspired by [Dexie](http://dexie.org/) and Jake Archibald's [idb](https://github.com/jakearchibald/idb)