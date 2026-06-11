export const idbSet = (key, val) => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("ReportAppDB", 1);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore("store");
    };
    req.onsuccess = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("store")) {
        // Edge case where upgrade didn't run properly
        db.close();
        indexedDB.deleteDatabase("ReportAppDB");
        return reject(new Error("Store missing, DB reset needed."));
      }
      const tx = db.transaction("store", "readwrite");
      tx.objectStore("store").put(val, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
};

export const idbGet = (key, defaultVal = null) => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("ReportAppDB", 1);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore("store");
    };
    req.onsuccess = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("store")) {
        return resolve(defaultVal);
      }
      const tx = db.transaction("store", "readonly");
      const getReq = tx.objectStore("store").get(key);
      getReq.onsuccess = () => resolve(getReq.result !== undefined ? getReq.result : defaultVal);
      getReq.onerror = () => reject(getReq.error);
    };
    req.onerror = () => reject(req.error);
  });
};

export const idbRemove = (key) => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("ReportAppDB", 1);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore("store");
    };
    req.onsuccess = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("store")) return resolve();
      const tx = db.transaction("store", "readwrite");
      tx.objectStore("store").delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
};
