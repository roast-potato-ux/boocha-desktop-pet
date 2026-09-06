import { invoke } from "@tauri-apps/api/core";
import {
  getCurrentWindow,
  LogicalSize,
  PhysicalPosition,
} from "@tauri-apps/api/window";

const petWindowBaseWidth = 220;
const petWindowBaseHeight = 220;
const settingsWindowWidth = 460;
const settingsWindowHeight = 680;

// Remember where the pet window was before we expanded it into the settings
// panel, so we can put it back exactly after closing settings.
let petWindowPosition: { x: number; y: number } | null = null;

// Toggle native macOS vibrancy behind the settings panel. We route this through
// a custom Rust command (instead of the JS setEffects/clearEffects API) because
// clearEffects() is a silent no-op on macOS in Tauri 2.11.5 — it would leave the
// glass background stuck on after closing the settings panel.
async function setPanelVibrancy(enabled: boolean): Promise<void> {
  try {
    await invoke("set_panel_vibrancy", { enabled });
  } catch {
    // Browser preview and unsupported native contexts should keep working.
  }
}

export async function resizeWindowForPet(scale: number): Promise<void> {
  try {
    const window = getCurrentWindow();
    await window.setSize(
      new LogicalSize(
        Math.ceil(petWindowBaseWidth * scale),
        Math.ceil(petWindowBaseHeight * scale),
      ),
    );

    // Restore the pet's original screen position (centering the settings panel
    // would otherwise strand the pet in the middle of the screen).
    if (petWindowPosition) {
      await window.setPosition(
        new PhysicalPosition(petWindowPosition.x, petWindowPosition.y),
      );
      petWindowPosition = null;
    }

    // Drop the glass so the pet renders on a fully transparent surface.
    await setPanelVibrancy(false);
  } catch {
    // Browser preview and unsupported native contexts should keep working.
  }
}

export async function resizeWindowForSettingsPanel(): Promise<void> {
  try {
    const window = getCurrentWindow();
    const position = await window.outerPosition();
    petWindowPosition = { x: position.x, y: position.y };

    await window.setSize(
      new LogicalSize(settingsWindowWidth, settingsWindowHeight),
    );
    await window.center();

    // Only the settings panel needs the native glass.
    await setPanelVibrancy(true);
  } catch {
    // Browser preview and unsupported native contexts should keep working.
  }
}
