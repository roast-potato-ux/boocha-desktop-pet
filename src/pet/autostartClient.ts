import {
  disable,
  enable,
  isEnabled,
} from "@tauri-apps/plugin-autostart";

export interface AutostartApi {
  isEnabled: () => Promise<boolean>;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
}

const nativeAutostartApi: AutostartApi = {
  isEnabled,
  enable,
  disable,
};

export async function readAutostart(
  isNativeWindow: boolean,
  fallback: boolean,
  api: AutostartApi = nativeAutostartApi,
): Promise<boolean> {
  return isNativeWindow ? api.isEnabled() : fallback;
}

export async function setAutostart(
  isNativeWindow: boolean,
  enabled: boolean,
  api: AutostartApi = nativeAutostartApi,
): Promise<void> {
  if (!isNativeWindow) {
    return;
  }

  if (enabled) {
    await api.enable();
    return;
  }

  await api.disable();
}
