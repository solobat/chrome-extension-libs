import axios from "axios";
import dayjs from "dayjs";
import { createClient, getPatcher, RequestOptions } from "webdav/web";

import fetchAdapter from "@vespaiach/axios-fetch-adapter";

import { getCuid } from "./cuid";
import { exportAsJson, importDBFile } from "./db.helper";
import { storage } from "./storage";

const client = axios.create({ adapter: fetchAdapter as any });

getPatcher().patch("request", (opts: RequestOptions) => client(opts as any));

let webDavClient;

interface Config {
  url: string;
  username: string;
  password: string;
}

if (typeof window === "undefined") {
  globalThis.document = {
    createElement: () => {
      const elem = {
        value: "",
        innerHTML(text: any) {
          elem.value = text;
        },
      };

      return elem;
    },
  } as any;
}

Object.defineProperties(globalThis.document, {});
function configClient(config: Config) {
  const { url, username, password } = config;
  const client = createClient(url, {
    username,
    password,
    headers: {
      Accept: "application/json",
    },
  });

  return client;
}

const WEBDAV_CONFIG_KEY = "webdav_config";

async function restoreConfig(): Promise<Config | null> {
  const res = await storage.getItem<Config>(WEBDAV_CONFIG_KEY);

  return res || null;
}

export interface WebdavModule {
  removeWebDavConfig: typeof removeWebDavConfig;
  getWebDavURL: typeof getWebDavURL;
  isWebDavConfiged: typeof isWebDavConfiged;
  saveConfig: typeof saveConfig;
  initClientWithConfig: typeof initClientWithConfig;
}

export function removeWebDavConfig() {
  storage.removeItem(WEBDAV_CONFIG_KEY);
  webDavClient = null;
}

export async function getWebDavURL(): Promise<string> {
  const config = await restoreConfig();

  if (config) {
    return config.url;
  } else {
    return "";
  }
}

export function isWebDavConfiged(): boolean {
  const config = restoreConfig();

  if (config) {
    return true;
  } else {
    return false;
  }
}

export function saveConfig(config: Config) {
  try {
    storage.setItem(WEBDAV_CONFIG_KEY, config);
  } catch (error) {}
}

export interface WebdavState {
  ROOT_PATH: string;
  extName: string;
}

const state: WebdavState = {
  ROOT_PATH: "/",
  extName: "",
};

export function initWebdav(extName: string, rootPath: string) {
  state.extName = extName;
  state.ROOT_PATH = rootPath;
}

export async function initClientWithConfig(config: Config) {
  const client = configClient(config);

  try {
    if ((await client.exists(state.ROOT_PATH)) === false) {
      await client.createDirectory(state.ROOT_PATH);
    }

    webDavClient = client;

    return client;
  } catch (error) {
    console.log(error);

    return null;
  }
}

async function getClient() {
  if (webDavClient) {
    return webDavClient;
  } else {
    const config = await restoreConfig();

    if (config) {
      return initClientWithConfig(config);
    } else {
      return Promise.reject("failed to init");
    }
  }
}

async function getDataFullFileName() {
  const suffix = dayjs().format("YYYY-MM-DD");
  const cuid = await getCuid();

  return `${state.ROOT_PATH}/${state.extName}-export_${suffix}_${cuid}.json`;
}

export async function saveData() {
  const client = await getClient();

  if (client) {
    try {
      const data = await exportAsJson();
      const name = await getDataFullFileName();

      await client.putFileContents(name, data);
    } catch (error) {
      return Promise.reject(error);
    }
  } else {
    return Promise.reject("client init failed...");
  }
}

async function restoreData() {
  const client = await getClient();

  if (client) {
    const files = await client.getDirectoryContents(state.ROOT_PATH);

    return files || [];
  } else {
    return [];
  }
}

function parseFileName(name = "") {
  const [base, date, cuid] = name.split(".json")[0].split("_");

  return {
    base,
    date,
    cuid,
  };
}

async function isCreatedBy(file) {
  const info = parseFileName(file.basename);
  const cuid = await getCuid();

  if (info.cuid === cuid) {
    return true;
  } else {
    return false;
  }
}

async function getFileContents(file) {
  return await webDavClient.getFileContents(file.filename, {
    format: "binary",
  });
}

async function renameFileWithCuid(file) {
  await webDavClient.moveFile(file.filename, getDataFullFileName());
}

function sortFiles(files) {
  return files.sort((a, b) =>
    Number(new Date(a.lastmod)) > Number(new Date(b.lastmod)) ? -1 : 1
  );
}

export async function createDataSyncTick() {
  const files = await restoreData();

  sortFiles(files);
  const latest = files[0];

  if (latest) {
    if (await isCreatedBy(latest)) {
      await saveData();

      return false;
    } else {
      const content = await getFileContents(latest);
      const blob = new Blob([content]);

      if (content) {
        await importDBFile(blob);
        await renameFileWithCuid(latest);

        return true;
      } else {
        return false;
      }
    }
  } else {
    await saveData();

    return false;
  }
}
