/*!
 * idb.js IndexedDB wrapper v2.0
 * Licensed under the MIT license
 * Copyright (c) 2018 Lukas Jans
 * https://github.com/Luniversity/idb
 */
class IDB {
	static connect(setup) {
		
		// Connect to DB
		this.connection = new Promise((resolve, reject) => {
			const request = indexedDB.open(setup.name, setup.version || 1);
			
			// Reject or resolve connection request
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);

			// Perform upgrade
			request.onupgradeneeded = () => {
				const db = request.result;
				
				// Clear old tables
				for(const name of db.objectStoreNames) db.deleteObjectStore(name);
				
				// Create new tables
				for(const table of setup.tables) db.createObjectStore(table.name, table.options);
			}
		});
		
		// Bind table controllers
		for(const table of setup.tables) this[table.name] = new IDB.Table(table.name);
	}
}

// Table controller
IDB.Table = class {
	constructor(name) {
		this.name = name;
	}
	
	// Start new transaction
	transaction() {
		return new Promise((resolve, reject) => {
			IDB.connection.then(db => {
				resolve(db.transaction([this.name], 'readwrite').objectStore(this.name));
			});
		});
	}
	
	// Wrap request in promise
	promise(request) {
		return new Promise((resolve, reject) => {
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);
		});
	}
	
	// Insert data
	set(index, value) {
		return this.transaction().then(table => this.promise(table.put(value, index)));
	}
	
	// Select data by index
	get(index) {
		return this.transaction().then(table => this.promise(table.get(index)));
	}
	
	// Select all data
	all() {
		return this.transaction().then(table => new Promise((resolve, reject) => {
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
		return this.transaction().then(table => this.promise(table.clear()));
	}
	
	// Delete entry by index
	delete(index) {
		return this.transaction().then(table => this.promise(table.delete(index)));
	}
	
	// Add new entry
	add(value) {
		return this.transaction().then(table => this.promise(table.put(value)));
	}
}