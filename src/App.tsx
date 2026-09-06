import { useCallback, useEffect, useRef, useState } from "react";
import { Bubble } from "./pet/Bubble";
import { PetSprite } from "./pet/PetSprite";
import { SettingsPanel } from "./pet/SettingsPanel";
import {
  createInitialAmbientInteractionState,
  evaluateAmbientInteraction,
} from "./pet/ambientInteractionScheduler";
import {
  createInitialMealReminderState,
  evaluateMealReminder,
} from "./pet/mealScheduler";
import {
  listenForPetStateRequests,
  listenForReminderPauseChanges,
  listenForSettingsPanelRequests,
} from "./pet/nativeMenuClient";
import {
  resizeWindowForPet,
  resizeWindowForSettingsPanel,
} from "./pet/nativeWindowClient";
import {
  applyDrag,
  getDefaultPetPosition,
  loadPetPosition,
  savePetPosition,
} from "./pet/petPlacement";
import {
  loadPetSettings,
  savePetSettings,
} from "./pet/petSettings";
import type { PetSettings } from "./pet/petSettings";
import { reducePetState } from "./pet/stateMachine";
import type { PetEvent, PetViewModel } from "./pet/types";
import { isNativePetWindowAvailable } from "./pet/windowControls";

const initialPet: PetViewModel = {
  state: "idle",
  bubble: null,
  lastInteractionAt: Date.now(),
};

function getViewport() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export default function App() {
  const [pet, setPet] = useState(initialPet);
  const [settings, setSettings] = useState(() =>
    loadPetSettings(window.localStorage),
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [position, setPosition] = useState(() => {
    const savedPosition = loadPetPosition(window.localStorage);
    return savedPosition ?? getDefaultPetPosition(getViewport());
  });
  const mealReminderState = useRef(createInitialMealReminderState());
  const ambientInteractionState = useRef(createInitialAmbientInteractionState());
  const dragState = useRef<{
    startPointer: { x: number; y: number };
    startPosition: { left: number; top: number };
  } | null>(null);

  const dispatchPet = useCallback(
    (event: PetEvent) => {
      setPet((current) =>
        reducePetState(current, event, Date.now(), settings.bubbles),
      );
    },
    [settings.bubbles],
  );

  const persistSettings = (nextSettings: PetSettings) => {
    const savedSettings = savePetSettings(window.localStorage, nextSettings);
    setSettings(savedSettings);
  };

  useEffect(() => {
    const tick = () => {
      const result = evaluateMealReminder(new Date(), mealReminderState.current, {
        paused: settings.remindersPaused,
        meals: settings.meals,
        focusQuietHours: settings.focusQuietHours,
      });
      mealReminderState.current = result.state;

      if (result.event) {
        dispatchPet(result.event);
      }
    };

    tick();
    const timer = window.setInterval(tick, 30 * 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [dispatchPet, settings.focusQuietHours, settings.meals, settings.remindersPaused]);

  useEffect(() => {
    const tick = () => {
      const result = evaluateAmbientInteraction(
        Date.now(),
        pet,
        ambientInteractionState.current,
        Math.random(),
        {
          idleInteractionMinutes: settings.durations.idleInteractionMinutes,
        },
      );
      ambientInteractionState.current = result.state;

      if (result.event) {
        dispatchPet(result.event);
      }
    };

    const timer = window.setInterval(tick, 20 * 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [dispatchPet, pet, settings.durations.idleInteractionMinutes]);

  useEffect(() => {
    if (!pet.bubble) {
      return;
    }

    const interactionAt = pet.lastInteractionAt;
    const timer = window.setTimeout(() => {
      dispatchPet({ type: "clear-bubble", interactionAt });
    }, 8 * 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [dispatchPet, pet.bubble, pet.lastInteractionAt]);

  useEffect(() => {
    if (pet.state !== "eat") {
      return;
    }

    const timer = window.setTimeout(() => {
      dispatchPet({ type: "return-idle" });
    }, settings.durations.eatSeconds * 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [dispatchPet, pet.state, settings.durations.eatSeconds]);

  useEffect(() => {
    if (pet.state !== "work") {
      return;
    }

    const timer = window.setTimeout(() => {
      dispatchPet({ type: "return-idle" });
    }, settings.durations.workMinutes * 60 * 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [dispatchPet, pet.state, settings.durations.workMinutes]);

  useEffect(() => {
    if (settingsOpen) {
      void resizeWindowForSettingsPanel();
      return;
    }

    void resizeWindowForPet(settings.scale);
  }, [settings.scale, settingsOpen]);

  useEffect(() => {
    let unlistenStateRequests: (() => void) | null = null;
    let unlisten: (() => void) | null = null;
    let unlistenSettingsRequests: (() => void) | null = null;
    let cancelled = false;

    void listenForPetStateRequests((state) => {
      dispatchPet({ type: "select-state", state });
    }).then((nextUnlisten) => {
      if (cancelled) {
        nextUnlisten();
        return;
      }

      unlistenStateRequests = nextUnlisten;
    });

    void listenForReminderPauseChanges((paused) => {
      persistSettings({ ...settings, remindersPaused: paused });
    }).then((nextUnlisten) => {
      if (cancelled) {
        nextUnlisten();
        return;
      }

      unlisten = nextUnlisten;
    });

    void listenForSettingsPanelRequests(() => {
      setSettingsOpen(true);
    }).then((nextUnlisten) => {
      if (cancelled) {
        nextUnlisten();
        return;
      }

      unlistenSettingsRequests = nextUnlisten;
    });

    return () => {
      cancelled = true;
      unlistenStateRequests?.();
      unlisten?.();
      unlistenSettingsRequests?.();
    };
  }, [dispatchPet, settings]);

  return (
    <main
      className={`pet-stage${settingsOpen ? " pet-stage--settings" : ""}`}
      aria-label="Booch desktop pet"
    >
      {settingsOpen ? (
        <SettingsPanel
          settings={settings}
          onSave={(nextSettings) => {
            persistSettings(nextSettings);
            setSettingsOpen(false);
          }}
          onClose={() => setSettingsOpen(false)}
        />
      ) : null}
      <div
        className={`pet-anchor${isNativePetWindowAvailable() ? " pet-anchor--native" : ""}`}
        style={
          isNativePetWindowAvailable()
            ? {
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
              }
            : {
                left: position.left,
                top: position.top,
                width: 188 * settings.scale,
                height: 220 * settings.scale,
              }
        }
        onPointerDown={(event) => {
          if (event.button !== 0 || isNativePetWindowAvailable()) {
            return;
          }

          dragState.current = {
            startPointer: { x: event.clientX, y: event.clientY },
            startPosition: position,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragState.current) {
            return;
          }

          setPosition(
            applyDrag({
              ...dragState.current,
              currentPointer: { x: event.clientX, y: event.clientY },
              viewport: getViewport(),
            }),
          );
        }}
        onPointerUp={(event) => {
          if (!dragState.current) {
            return;
          }

          const nextPosition = applyDrag({
            ...dragState.current,
            currentPointer: { x: event.clientX, y: event.clientY },
            viewport: getViewport(),
          });

          dragState.current = null;
          event.currentTarget.releasePointerCapture(event.pointerId);
          setPosition(nextPosition);
          savePetPosition(window.localStorage, nextPosition);
        }}
        onContextMenu={(event) => {
          // Right-clicking the pet opens the settings panel, so you don't have
          // to hunt for the menu bar tray icon.
          event.preventDefault();
          setSettingsOpen(true);
        }}
      >
        <div
          className="pet-scale-frame"
          style={{
            transform: `scale(${settings.scale})`,
          }}
        >
          {pet.bubble ? <Bubble text={pet.bubble} /> : null}
          <PetSprite
            pet={pet}
            onClick={() => dispatchPet({ type: "pet-click" })}
            onToggleWork={() => dispatchPet({ type: "cycle-state" })}
          />
        </div>
      </div>
    </main>
  );
}
