import { getCurrentWindow } from "@tauri-apps/api/window";

interface DragWindow {
  startDragging: () => Promise<void>;
}

export type DragStartResult = "started" | "unavailable";

export function hasTauriInternals(candidate: object | null | undefined): boolean {
  return Boolean(
    candidate &&
      Object.prototype.hasOwnProperty.call(candidate, "__TAURI_INTERNALS__"),
  );
}

export function isNativePetWindowAvailable(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return hasTauriInternals(window);
}

export async function startPetDragFromWindow(
  dragWindow: DragWindow,
): Promise<DragStartResult> {
  try {
    await dragWindow.startDragging();
    return "started";
  } catch {
    return "unavailable";
  }
}

export async function startPetDrag(): Promise<DragStartResult> {
  return startPetDragFromWindow(getCurrentWindow());
}
