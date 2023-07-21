interface Storage {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const chromeStorage: Storage = {
  getItem: (key) =>
    new Promise((resolve) =>
      chrome.storage.local.get(key, (data) => resolve(data[key]))
    ),
  setItem: (key, value) =>
    new Promise((resolve) =>
      chrome.storage.local.set({ [key]: value }, resolve)
    ),
  removeItem: (key) =>
    new Promise((resolve) => chrome.storage.local.remove(key, resolve)),
};

const browserStorage: Storage = {
  getItem: async <T>(key: string): Promise<T | null> => {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
  setItem: async <T>(key: string, value: T): Promise<void> => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  removeItem: async (key: string): Promise<void> => {
    localStorage.removeItem(key);
  },
};

export const storage: Storage =
  chrome.storage && chrome.storage.local ? chromeStorage : browserStorage;
