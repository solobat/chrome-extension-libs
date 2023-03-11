import { getCuid, initCuid } from "./cuid";
import {
  DBModule,
  DBState,
  exportAndDownload,
  importDBFile,
  initDBHelper,
  onDbUpdate,
} from "./db.helper";
import { Sync, SyncModule, isAutoSync } from "./sync";
import {
  getWebDavURL,
  initClientWithConfig,
  initWebdav,
  isWebDavConfiged,
  removeWebDavConfig,
  saveConfig,
  WebdavModule,
  WebdavState,
} from "./webdav";

export type LibsOptions = DBState &
  WebdavState & {
    storageKey: string;
  };

export interface ExtLibs {
  getCuid: typeof getCuid;
  Webdav: WebdavModule;
  Sync: SyncModule;
  DB: DBModule;
}

export function getLibs(options: LibsOptions): ExtLibs {
  initCuid(options.storageKey);
  initDBHelper(options.extName, options.db, options.dbNames);
  initWebdav(options.extName, options.ROOT_PATH);

  return {
    getCuid,
    Webdav: {
      removeWebDavConfig,
      getWebDavURL,
      isWebDavConfiged,
      saveConfig,
      initClientWithConfig,
    },
    Sync: {
      SyncClass: Sync,
      isAutoSync,
    },
    DB: {
      onDbUpdate,
      exportAndDownload,
      importDBFile,
    },
  };
}
