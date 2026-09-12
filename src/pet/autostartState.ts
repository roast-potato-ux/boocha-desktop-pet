import type { PetSettings } from "./petSettings";

export interface AutostartOperationTracker {
  begin: () => number;
  isCurrent: (operation: number) => boolean;
}

export interface AutostartSettingsSynchronization {
  persistedSettings: PetSettings;
  displayedSettings: PetSettings;
}

export function createAutostartOperationTracker(): AutostartOperationTracker {
  let latestOperation = 0;

  return {
    begin: () => {
      latestOperation += 1;
      return latestOperation;
    },
    isCurrent: (operation) => operation === latestOperation,
  };
}

export function withAutostartEnabled(
  settings: PetSettings,
  launchAtLogin: boolean,
): PetSettings {
  return {
    ...settings,
    startup: { launchAtLogin },
  };
}

export function synchronizeAutostartSettings(
  persistedSettings: PetSettings,
  displayedSettings: PetSettings,
  launchAtLogin: boolean,
): AutostartSettingsSynchronization {
  return {
    persistedSettings: withAutostartEnabled(
      persistedSettings,
      launchAtLogin,
    ),
    displayedSettings: withAutostartEnabled(displayedSettings, launchAtLogin),
  };
}
