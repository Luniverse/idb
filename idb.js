/*!
 * idb.js IndexedDB wrapper v1.0
 * Licensed under the MIT license
 * Copyright (c) 2018 Lukas Jans
 * https://luniverse.de/
 */
function IDB(setup) {
	
	// Connect to DB
	let connection = new Promise((resolve, reject) => {
		var request = indexedDB.open(setup.name, setup.version || 1);
		
		// Reject or resolve connection request
		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		// Perform upgrade
		request.onupgradeneeded = () => {
			var db = request.result;
			
			// Clear old tables
			for(var name of db.objectStoreNames) db.deleteObjectStore(name);
			
			// Create new tables
			for(var table of setup.tables) db.createObjectStore(table.name, table.options);
		}
	});
	
	// Table controller
	let Table = function(name) {
		
		// Start transaction
		let transaction = () => new Promise((resolve, reject) => {
			connection.then(db => {
				resolve(db.transaction(name, 'readwrite').objectStore(name))
			})
		});
		
		// Default promise from request
		let promise = request => new Promise((resolve, reject) => {
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);
		});
		
		// Insert data
		this.set = (index, value) => transaction().then(table => promise(table.put(value, index)));
		
		// Select data by index
		this.get = index => transaction().then(table => promise(table.get(index)));
		
		// Select all data
		this.all = () => transaction().then(table => new Promise((resolve, reject) => {
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
		
		// Select data by condition
		this.where = condition => this.all().then(rows => {		
			var filtered = {};
			for(var index in rows) {
				if(condition(rows[index])) filtered[index] = rows[index];
			}
			return filtered;
		});
		
		// Clear data
		this.clear = () => transaction().then(table => promise(table.clear()));
		
		// Delete entry by index
		this.delete = index => transaction().then(table => promise(table.delete(index)));
		
		// Add new entry
		this.add = value => transaction().then(table => promise(table.put(value)));
	}
	
	// Create table controllers
	for(var table of setup.tables) this[table.name] = new Table(table.name);
}