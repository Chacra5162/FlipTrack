/**
 * IndexedDB Wrapper Module for FlipTrack
 *
 * Provides a promise-based API for IndexedDB operations.
 * Handles database initialization, CRUD operations, and metadata storage.
 * Falls back gracefully if IndexedDB is unavailable.
 *
 * @module idb
 */

const DB_NAME = 'fliptrack';
const DB_VERSION = 2;
const STORES = {
  inventory: { keyPath: 'id' },
  sales: { keyPath: 'id' },
  expenses: { keyPath: 'id' },
  supplies: { keyPath: 'id' },
  trash: { keyPath: 'id' },
  meta: { keyPath: 'key' },
  syncQueue: { keyPath: 'id', autoIncrement: true }
};

let db = null;
let isAvailable = true;
const operationQueue = [];
let isInitializing = false;

/**
 * Check if IndexedDB is available in the browser
 * @returns {boolean}
 */
function checkAvailability() {
  try {
    const idbFactory = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
    return !!idbFactory;
  } catch (e) {
    return false;
  }
}

/**
 * Log errors without throwing
 * @param {string} context - Where the error occurred
 * @param {Error} error - The error object
 */
function logError(context, error) {
  console.error(`[IDB ${context}]`, error?.message || error);
}

/**
 * Process queued operations after DB is initialized
 */
async function processQueue() {
  while (operationQueue.length > 0) {
    const { resolve, reject, fn } = operationQueue.shift();
    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }
}

/**
 * Wrap an operation to run after DB init (or queue it)
 * @param {Function} fn - Async function to execute
 * @returns {Promise}
 */
function withDB(fn) {
  return new Promise((resolve, reject) => {
    if (db !== null) {
      fn().then(resolve).catch(reject);
    } else if (isInitializing) {
      operationQueue.push({ resolve, reject, fn });
    } else {
      // DB not available
      reject(new Error('IndexedDB not initialized'));
    }
  });
}

/**
 * Initialize the IndexedDB database
 * Creates object stores if they don't exist
 *
 * @returns {Promise<IDBDatabase>} The opened database
 * @throws {Error} If IndexedDB is unavailable or opening fails
 */
export async function initDB() {
  if (db !== null) {
    return db;
  }

  if (!checkAvailability()) {
    isAvailable = false;
    throw new Error('IndexedDB is not available in this browser');
  }

  return new Promise((resolve, reject) => {
    isInitializing = true;

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      isInitializing = false;
      isAvailable = false;
      logError('open', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      db.onversionchange = () => {
        db.close();
        db = null;
        isInitializing = true; // queue operations during re-open
        // Re-open after the other tab's upgrade completes
        setTimeout(() => initDB().catch(e => {
          isInitializing = false;
          console.warn('IDB re-init failed:', e.message);
        }), 500);
      };
      isInitializing = false;
      processQueue();
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Create all object stores if they don't exist
      Object.entries(STORES).forEach(([storeName, config]) => {
        if (!database.objectStoreNames.contains(storeName)) {
          try {
            const opts = { keyPath: config.keyPath };
            if (config.autoIncrement) opts.autoIncrement = true;
            database.createObjectStore(storeName, opts);
          } catch (error) {
            logError(`create store ${storeName}`, error);
          }
        }
      });
    };
  });
}

/**
 * Get all records from a store
 *
 * @param {string} storeName - Name of the object store
 * @returns {Promise<Array>} Array of all records
 */
export async function getAll(storeName) {
  if (!isAvailable) return [];

  return withDB(async () => {
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onerror = () => {
          logError(`getAll ${storeName}`, request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          resolve(request.result);
        };
      } catch (error) {
        logError(`getAll ${storeName}`, error);
        reject(error);
      }
    });
  });
}

/**
 * Replace ALL records in a store with new ones.
 * Uses put() (upsert) for each item in a single transaction — avoids the
 * clear-then-write race condition where a crash between clear() and put()
 * could lose all data. Stale records that are no longer in the items array
 * are removed via a targeted cleanup pass within the same transaction.
 *
 * @param {string} storeName - Name of the object store
 * @param {Array} items - Array of items to store
 * @returns {Promise<void>}
 */
export async function putAll(storeName, items) {
  if (!isAvailable) return;

  return withDB(async () => {
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        // Build a set of IDs we're writing so we can remove stale records
        const keyPath = store.keyPath;
        const activeIds = new Set(items.map(item => item[keyPath]));

        // Upsert all current items
        items.forEach((item) => {
          try {
            store.put(item);
          } catch (error) {
            logError(`putAll add ${storeName}`, error);
          }
        });

        // Remove records that are no longer in the items array
        const cursorReq = store.openKeyCursor();
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (cursor) {
            if (!activeIds.has(cursor.key)) {
              try { store.delete(cursor.key); } catch (e) { logError(`putAll cleanup ${storeName}`, e); }
            }
            cursor.continue();
          }
        };

        transaction.onerror = () => {
          logError(`putAll transaction ${storeName}`, transaction.error);
          reject(transaction.error);
        };

        transaction.oncomplete = () => {
          resolve();
        };
      } catch (error) {
        logError(`putAll ${storeName}`, error);
        reject(error);
      }
    });
  });
}

/**
 * Insert or update a single record
 *
 * @param {string} storeName - Name of the object store
 * @param {Object} item - Item to store (must have an 'id' or 'key' field)
 * @returns {Promise<*>} The key of the stored item
 */
export async function putOne(storeName, item) {
  if (!isAvailable) return;

  return withDB(async () => {
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);

        request.onerror = () => {
          logError(`putOne ${storeName}`, request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          resolve(request.result);
        };
      } catch (error) {
        logError(`putOne ${storeName}`, error);
        reject(error);
      }
    });
  });
}

/**
 * Delete a record by its key
 *
 * @param {string} storeName - Name of the object store
 * @param {*} id - The key value to delete
 * @returns {Promise<void>}
 */
export async function deleteOne(storeName, id) {
  if (!isAvailable) return;

  return withDB(async () => {
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onerror = () => {
          logError(`deleteOne ${storeName}`, request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          resolve();
        };
      } catch (error) {
        logError(`deleteOne ${storeName}`, error);
        reject(error);
      }
    });
  });
}

/**
 * Get a metadata value by key
 *
 * @param {string} key - The metadata key
 * @returns {Promise<*>} The stored value, or undefined if not found
 */
export async function getMeta(key) {
  if (!isAvailable) return undefined;

  return withDB(async () => {
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(['meta'], 'readonly');
        const store = transaction.objectStore('meta');
        const request = store.get(key);

        request.onerror = () => {
          logError(`getMeta ${key}`, request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.value : undefined);
        };
      } catch (error) {
        logError(`getMeta ${key}`, error);
        reject(error);
      }
    });
  });
}

/**
 * Set a metadata value by key
 *
 * @param {string} key - The metadata key
 * @param {*} value - The value to store
 * @returns {Promise<void>}
 */
export async function setMeta(key, value) {
  if (!isAvailable) return;

  return withDB(async () => {
    return putOne('meta', { key, value });
  });
}

/**
 * Delete a metadata entry from IDB
 * @param {string} key - The metadata key to delete
 * @returns {Promise<void>}
 */
export async function deleteMeta(key) {
  if (!isAvailable) return;

  return withDB(async () => {
    return deleteOne('meta', key);
  });
}

/**
 * Clear all records from a store
 *
 * @param {string} storeName - Name of the object store
 * @returns {Promise<void>}
 */
export async function clearStore(storeName) {
  if (!isAvailable) return;

  return withDB(async () => {
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onerror = () => {
          logError(`clearStore ${storeName}`, request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          resolve();
        };
      } catch (error) {
        logError(`clearStore ${storeName}`, error);
        reject(error);
      }
    });
  });
}

/**
 * Get the count of records in a store
 *
 * @param {storeName} storeName - Name of the object store
 * @returns {Promise<number>} Count of records
 */
export async function getCount(storeName) {
  if (!isAvailable) return 0;

  return withDB(async () => {
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.count();

        request.onerror = () => {
          logError(`getCount ${storeName}`, request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          resolve(request.result);
        };
      } catch (error) {
        logError(`getCount ${storeName}`, error);
        reject(error);
      }
    });
  });
}

export default {
  initDB,
  getAll,
  putAll,
  putOne,
  deleteOne,
  getMeta,
  setMeta,
  deleteMeta,
  clearStore,
  getCount
};
