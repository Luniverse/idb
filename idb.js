/*!
 * idb.js IndexedDB wrapper v3.2
 * Licensed under the MIT license
 * Copyright (c) 2023 Lukas Jans
 * https://github.com/ljans/idb
 */
class IDB {
	
	// Wrap IDBRequest in promise
	promise(request) {
		return new Promise((resolve, reject) => {
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);
		});
	}
	
	// Constructor
	constructor(tables, config={}) {
		this.tables = tables;
		this.config = config;
		
		// Bind table controllers
		for(const name of Object.keys(tables)) this[name] = new this.Table(name, this);
		
		// Establish an initial connection to catch upgrade events
		//this.connection.then(db => db.close());
	}
	
	// Establish a db connection
	get connection() {
		const request = indexedDB.open(this.config.name || 'IDB', this.config.version || 1);
		
		/**
		 * Always check for an upgade event, because querying a table when the database does not exists
		 * (either because it was deleted or initial creation is commented out in the constructor)
		 * causes indexedDB.open to create the database without any tables until another upgrade happens.
		 */
		request.onupgradeneeded = async e => {
			const db = request.result;
			
			// Clear old tables
			for(const name of db.objectStoreNames) if(!this.tables[name]) db.deleteObjectStore(name);
			
			// Create new tables
			for(const [name, options] of Object.entries(this.tables)) {
				if(!db.objectStoreNames.contains(name)) db.createObjectStore(name, options);
			}
			
			// Bubble upgrade event
			if(this.config.upgrade) await this.config.upgrade(e);
		}
		
		// Return a promise that resolves to the established connection
		return this.promise(request);
	}

	// Table controller
	get Table() {
		return class {
	
			// Constructor
			constructor(name, instance) {
				this.name = name;
				this.instance = instance;
			}
			
			// Perform operation in transaction (commit transaction and close connection so it's always possible to delete the db)
			async transaction(operation) {
				const db = await this.instance.connection;
				
				// Perform the operation
				const transaction = db.transaction(this.name, 'readwrite');
				const table = transaction.objectStore(this.name);
				var result = await operation(table);
				transaction.commit();
				
				// Wait for result and close connection
				if(result instanceof IDBRequest) result = await this.instance.promise(result);
				db.close();
				return result;
			}	
			
			// Read data by index
			get(index) {
				return this.transaction(table => table.get(index));
			}
			
			// Write data by index
			put(value, index) {
				return this.transaction(table => table.put(value, index));
			}
			
			// Delete data by index
			delete(index) {
				return this.transaction(table => table.delete(index));
			}
			
			// Clear all data
			clear() {
				return this.transaction(table => table.clear());
			}
			
			// Read all data
			all(filter) {
				return this.transaction(table => new Promise((resolve, reject) => {
					const rows = [];
					const request = table.openCursor();
					request.onerror = () => reject(request.error);
					
					// Iterate over cursor values
					request.onsuccess = () => {
						const cursor = request.result;
						if(cursor) {
							rows.push(cursor.value);
							cursor.continue();
						} else resolve(filter ? rows.filter(filter) : rows);
					}
				}));
			}
		}
	}
}