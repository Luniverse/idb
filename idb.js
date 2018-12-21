/*!
 * idb.js IndexedDB wrapper v2.4
 * Licensed under the MIT license
 * Copyright (c) 2018 Lukas Jans
 * https://github.com/luniverse/idb
 */
class IDB {
	
	// Static connector
	static open(tables, options={}) {
		
		// Connect to DB
		this.connection = new Promise((resolve, reject) => {
			const request = indexedDB.open(options.name || 'IDB', options.version || 1);
			
			// Reject or resolve connection request
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);

			// Perform upgrade
			request.onupgradeneeded = () => {
				const db = request.result;
				
				// Clear old tables
				for(const name of db.objectStoreNames) db.deleteObjectStore(name);
				
				// Create new tables
				for(const table of tables) db.createObjectStore(table.name, table.options);
			}
		});
		
		// Bind table controllers
		for(const table of tables) this[table.name] = new IDB.Table(table.name);
	}
}


// Table controller
IDB.Table = class {
	
	// Constructor
	constructor(name) {
		this.name = name;
	}
	
	// Perform operation in transaction
	transaction(operation) {
		return IDB.connection.then(db => {
			
			// Retrieve operation result
			const transaction = db.transaction(this.name, 'readwrite');
			const table = transaction.objectStore(this.name);
			const result = operation(table);
			
			// Return promise or wrap IDBRequest in promise
			if(result instanceof Promise) return result;
			else return new Promise((resolve, reject) => {
				result.onerror = () => reject(result.error);
				result.onsuccess = () => resolve(result.result);
			});
		});
	}
	
	// Write data
	put(value, index) {
		return this.transaction(table => table.put(value, index));
	}
	
	// Read data by index
	get(index) {
		return this.transaction(table => table.get(index));
	}
	
	// Select all data
	all() {
		return this.transaction(table => new Promise((resolve, reject) => {
			var rows = {};
			var request = table.openCursor();
			request.onerror = () => reject(request.error);
			
			// Iterate over cursor values
			request.onsuccess = () => {
				var cursor = request.result;
				if(cursor) {
					rows[cursor.key] = cursor.value;
					cursor.continue();
				} else resolve(rows);
			}
		}));
	}
	
	// Select data by condition
	where(condition) {
		return this.all().then(rows => {	
			var filtered = {};
			for(var index in rows) {
				if(condition(rows[index])) filtered[index] = rows[index];
			}
			return filtered;
		});
	}
	
	// Clear data
	clear() {
		return this.transaction(table => table.clear());
	}
	
	// Delete entry by index
	delete(index) {
		return this.transaction(table => table.delete(index));
	}
}