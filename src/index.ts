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
    syncInterval?: number;
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
  let sync: Sync;

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
      getSync: () => {
        if (sync) {
          return sync;
        } else {
          sync = new Sync({ syncInterval: options.syncInterval });

          return sync;
        }
      },
      isAutoSync,
    },
    DB: {
      onDbUpdate,
      exportAndDownload,
      importDBFile,
    },
  };
}
