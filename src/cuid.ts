import { storage } from "./storage";

let STORAGE_KEY = "cuid";

function init() {
  const id = crypto.randomUUID();

  storage.setItem(STORAGE_KEY, id);

  return id;
}

async function restoreCuid() {
  const res = await storage.getItem<string>(STORAGE_KEY);

  return res;
}

export async function getCuid() {
  const id = await restoreCuid();

  if (id) {
    return id;
  } else {
    return init();
  }
}

export function initCuid(key: string) {
  STORAGE_KEY = key;
}
