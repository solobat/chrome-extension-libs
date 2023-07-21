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

const localStorage: Storage = {
  getItem: async <T>(key: string): Promise<T | null> => {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
  setItem: async <T>(key: string, value: T): Promise<void> => {
    window.localStorage.setItem(key, JSON.stringify(value));
  },
  removeItem: async (key: string): Promise<void> => {
    window.localStorage.removeItem(key);
  },
};

export const storage: Storage =
  chrome.storage && chrome.storage.local ? chromeStorage : localStorage;
