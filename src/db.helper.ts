import Dexie from "dexie";
import { exportDB, importInto } from "dexie-export-import";
import download from "downloadjs";
import { throttle } from "lodash";

export interface DBState {
  db: Dexie | null;
  dbNames: string[];
  extName: string;
}

const state: DBState = {
  db: null,
  dbNames: [],
  extName: "extension",
};

export function initDBHelper(extName: string, db: Dexie, dbNames: string[]) {
  state.extName = extName;
  state.db = db;
  state.dbNames = dbNames;
}

export async function exportAndDownload() {
  const blob = await exportDB(state.db);

  download(blob, `${state.extName}-export.json`, "application/json");
}

function readBlob(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onabort = (ev) => reject(new Error("file read aborted"));
    reader.onerror = (event) => reject(event.target.error);
    reader.onload = (event) => resolve(event.target.result);
    reader.readAsText(blob);
  });
}

export async function exportAsJson() {
  const blob = await exportDB(state.db);

  return readBlob(blob);
}

export async function importDBFile(blob) {
  await importInto(state.db, blob, {
    clearTablesBeforeImport: true,
  });
}

export function onDbUpdate(callback) {
  const dbNames = state.dbNames;
  const eventNames = ["creating", "updating", "deleting"];
  const unbindFns = [];
  const cb = throttle(callback, 1000);

  dbNames.forEach((name) => {
    eventNames.forEach((event) => {
      state.db[name].hook(event, cb);
      unbindFns.push(() => {
        state.db[name].hook(event).unsubscribe(cb);
      });
    });
  });

  return unbindFns;
}

export interface DBModule {
  onDbUpdate: typeof onDbUpdate;
  exportAndDownload: typeof exportAndDownload;
  importDBFile: typeof importDBFile;
}
