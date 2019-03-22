# IDB

Easy-to-use wrapper around the massive [IndexedDB API](https://developer.mozilla.org/de/docs/IndexedDB).

## How to use

Open a new IDB connection and setup the tables you need for your project:

```javascript
IDB.open({
	test1: {},
	test2: {}
});
```

The tables you define get bound to the `IDB` context. Now, you are ready to perform transactions. For example, insert and select a value from `test1`:

```javascript
IDB.test1.put('value1', 'key1');
await IDB.test1.get('key1');
```

Which will yield `'value1'`. And that's it! You can now work with your IDB.
For more details, have a look at the API specification. (coming soon)

## Links

* Licensed under the [MIT License](LICENSE)
* Inspired by [Dexie](http://dexie.org/) and Jake Archibald's [idb](https://github.com/jakearchibald/idb)