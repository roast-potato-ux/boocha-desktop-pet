import { invoke } from "@tauri-apps/api/core";
import {
  getCurrentWindow,
  LogicalSize,
  PhysicalPosition,
} from "@tauri-apps/api/window";

// The pet block (pet-shell) is 188px wide/tall; the window is wider than the pet
// so the quick-action buttons can arc along its right side without covering it.
// `.pet-column` (188px) sits at the left edge of the frame, the remaining
// 100px band holds the buttons. Must match .pet-scale-frame / .pet-anchor.
const petWindowBaseWidth = 288;
// The pet block (pet-shell) is 188px tall; on top of it we reserve a transparent
// headroom band (bubbleHeadroom = 52px) for the speech bubble so it floats above
// the pet's head without covering it. Must match .pet-scale-frame height.
const petWindowBaseHeight = 240;
const settingsWindowWidth = 720;
const settingsWindowHeight = 700;

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

    // Only remember the pet's spot the first time we expand: a second call while
    // the panel is already open would otherwise save the *centered* panel
    // position and strand the pet in the middle of the screen on close.
    if (!petWindowPosition) {
      const position = await window.outerPosition();
      petWindowPosition = { x: position.x, y: position.y };
    }

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
