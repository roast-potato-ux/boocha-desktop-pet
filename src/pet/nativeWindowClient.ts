import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";

const petWindowBaseWidth = 220;
const petWindowBaseHeight = 220;
const settingsWindowWidth = 460;
const settingsWindowHeight = 680;

export async function resizeWindowForPet(scale: number): Promise<void> {
  try {
    await getCurrentWindow().setSize(
      new LogicalSize(
        Math.ceil(petWindowBaseWidth * scale),
        Math.ceil(petWindowBaseHeight * scale),
      ),
    );
  } catch {
    // Browser preview and unsupported native contexts should keep working.
  }
}

export async function resizeWindowForSettingsPanel(): Promise<void> {
  try {
    await getCurrentWindow().setSize(
      new LogicalSize(settingsWindowWidth, settingsWindowHeight),
    );
  } catch {
    // Browser preview and unsupported native contexts should keep working.
  }
}
