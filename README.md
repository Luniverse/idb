# IDB
Promise-based wrapper around the [IndexedDB](https://developer.mozilla.org/de/docs/IndexedDB) API.

### Getting started
You would mostly want to make use of the IDB inside a [ServiceWorker](https://developers.google.com/web/fundamentals/primers/service-workers/):
```javascript
self.importScripts('idb.js');
```
Open a new IDB connection and setup the tables you need for your project:
```javascript
var idb = new IDB({
	table1: {},
	table2: {keyPath: 'id'},
	table3: {autoIncrement: true},
}, config);
```
The following settings can be passed in the optional `config` object:
- `name` sets the Database name (defaults to "IDB")
- `version` provides the version of the table structure (defaults to 1)
  - An increment in version triggers a database upgrade
- `upgrade` defines a function to perform when a database upgrade was performed

You can pass the follwing options for each table:
- `keyPath` specifies a "primary key" of inserted objects
- `autoIncrement` determines, whether inserted objects get an incrementing numeric key

The defined tables will be available for operations in the newly created `idb` object like `idb.table1`. Remember that all operations return a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

#### Inserting data
- `idb.<table>.put({id: 'foo', a: 'b'})`
  - Inserts the object with key "foo" when using `keyPath: 'id'`
  - Inserts the object with an automatically incremented key when using `autoIncrement: true`
- `idb.<table>.put('value')`
  - Inserts the value with an automatically incremented key when using `autoIncrement: true`
- `idb.<table>.put({id: 'foo', a: 'b'}, 'bar')`
  - Inserts the object with key "bar" independent of `autoIncrement` but only without `keyPath`

#### Selecting data
- `idb.<table>.get('foo')`
  - Selects the object or value with key "foo" (also works with numeric keys)
- `idb.<table>.all(filter)`
  - Applies a provided filtering function on all entries to decide which ones will be selected
  - Example: `idb.<table>.all(item => item.amount > 5)`

#### Deleting data
- `idb.<table>.delete('foo')`
  - Deletes the object or value with key "foo" (also works with numeric keys)
- `idb.<table>.clear()`
  - Deletes all entries in the table
