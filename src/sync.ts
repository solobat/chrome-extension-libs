import { throttle } from "lodash";

import {
  STORAGE_KEYS,
  SYNC_STATUS,
  WEBDAV_MAX_SYNC_INTERVAL,
  WEBDAV_MIN_SYNC_INTERVAL,
} from "./constant";
import { onDbUpdate } from "./db.helper";
import { SimpleEvent } from "./event";
import { tuple } from "./types";
import { createDataSyncTick, isWebDavConfiged } from "./webdav";
import { storage } from "./storage";

const EventTypes = tuple("received", "uploaded");

export type EventType = (typeof EventTypes)[number];

export function isAutoSync() {
  return storage.getItem<Number>(STORAGE_KEYS.AUTO_SYNC).then((res) => {
    return res === 1;
  });
}

export class Sync extends SimpleEvent<EventType> {
  syncStatus;
  syncTimer = 0;
  syncInterval = WEBDAV_MAX_SYNC_INTERVAL;

  constructor(options?: { syncInterval?: number }) {
    super();
    this.syncInterval = options?.syncInterval ?? WEBDAV_MAX_SYNC_INTERVAL;
    this.tryStartSync();
    this.setupAutoSync();
  }

  setupAutoSync() {
    onDbUpdate(() => {
      isAutoSync().then((bool) => {
        if (bool) {
          this.tryStartSync();
        }
      });
    });
  }

  stopSync() {
    clearInterval(this.syncTimer);
    this.syncStatus = SYNC_STATUS.WAIT;
  }

  async runDataSyncTick() {
    try {
      const newReceived = await createDataSyncTick();

      if (newReceived) {
        this.emit("received");
      }
      this.syncStatus = SYNC_STATUS.SUCCESS;
    } catch (error) {
      console.log(error);
      this.syncStatus = SYNC_STATUS.FAIL;
    }
  }

  private getSyncInterval() {
    const interval = this.syncInterval || WEBDAV_MAX_SYNC_INTERVAL;

    return interval;
  }

  startSync = throttle(async function (this: Sync) {
    this.stopSync();
    this.syncStatus = SYNC_STATUS.BEGIN;
    await this.runDataSyncTick();

    const inerval = this.getSyncInterval();

    this.syncTimer = setInterval(async () => {
      await this.runDataSyncTick();
    }, inerval) as any;
  }, WEBDAV_MIN_SYNC_INTERVAL);

  tryStartSync() {
    if (isWebDavConfiged()) {
      this.startSync();
    }
  }
}

export interface SyncModule {
  isAutoSync: typeof isAutoSync;
  getSync: () => Sync;
}
