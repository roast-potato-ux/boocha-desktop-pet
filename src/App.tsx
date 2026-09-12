import { useCallback, useEffect, useRef, useState } from "react";
import { Bubble } from "./pet/Bubble";
import { PetSprite } from "./pet/PetSprite";
import { QuickActions } from "./pet/QuickActions";
import { SettingsPanel } from "./pet/SettingsPanel";
import { TimerBadge } from "./pet/TimerBadge";
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
import {
  createInactiveFocusTimer,
  evaluateFocusTimer,
  startCountdown,
  startStopwatch,
  stopFocusTimer,
} from "./pet/focusTimer";
import type { FocusTimerState } from "./pet/focusTimer";
import { reducePetState } from "./pet/stateMachine";
import type { PetEvent, PetViewModel } from "./pet/types";
import { isNativePetWindowAvailable } from "./pet/windowControls";

const initialPet: PetViewModel = {
  state: "idle",
  previousState: null,
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
  const [focusTimer, setFocusTimer] = useState<FocusTimerState>(() =>
    createInactiveFocusTimer(),
  );
  const [timerDisplay, setTimerDisplay] = useState<string | null>(null);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [quickActionMode, setQuickActionMode] = useState<"main" | "countdown">(
    "main",
  );
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

  const focusTimerActive = focusTimer.mode !== null;
  const visiblePet = focusTimerActive
    ? { ...pet, state: "work" as const, bubble: null }
    : pet;

  const closeQuickActions = () => {
    setQuickActionsOpen(false);
    setQuickActionMode("main");
  };

  const startCountdownForMinutes = (minutes: number) => {
    setFocusTimer(startCountdown(Date.now(), minutes));
    setTimerDisplay(null);
    dispatchPet({ type: "select-state", state: "work" });
    closeQuickActions();
  };

  const toggleStopwatch = () => {
    if (focusTimer.mode === "stopwatch") {
      setFocusTimer(stopFocusTimer());
      setTimerDisplay(null);
      dispatchPet({ type: "select-state", state: "idle" });
      closeQuickActions();
      return;
    }

    setFocusTimer(startStopwatch(Date.now()));
    setTimerDisplay(null);
    dispatchPet({ type: "select-state", state: "work" });
    closeQuickActions();
  };

  useEffect(() => {
    const tick = () => {
      setFocusTimer((current) => {
        const result = evaluateFocusTimer(Date.now(), current);
        setTimerDisplay(result.display);

        if (result.completed) {
          const line =
            settings.timer.countdownCompleteLines[0] ?? "时间到，休息一下";
          dispatchPet({ type: "countdown-complete", bubble: line });
        }

        return result.state;
      });
    };

    tick();
    const timer = window.setInterval(tick, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [dispatchPet, settings.timer.countdownCompleteLines]);

  useEffect(() => {
    const tick = () => {
      const result = evaluateMealReminder(new Date(), mealReminderState.current, {
        blocked: focusTimer.mode !== null,
        meals: settings.meals,
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
  }, [dispatchPet, focusTimer.mode, settings.meals]);

  useEffect(() => {
    if (focusTimer.mode !== null) {
      return;
    }

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
  }, [dispatchPet, focusTimer.mode, pet, settings.durations.idleInteractionMinutes]);

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
      dispatchPet({ type: "return-previous" });
    }, settings.durations.eatSeconds * 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [dispatchPet, pet.state, settings.durations.eatSeconds]);

  useEffect(() => {
    if (settingsOpen) {
      void resizeWindowForSettingsPanel();
      return;
    }

    void resizeWindowForPet(settings.scale);
  }, [settings.scale, settingsOpen]);

  useEffect(() => {
    let unlistenStateRequests: (() => void) | null = null;
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
      unlistenSettingsRequests?.();
    };
  }, [dispatchPet]);

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
          settingsOpen
            ? {
                left: 0,
                top: 0,
                width: 188 * settings.scale,
                height: 240 * settings.scale,
              }
            : isNativePetWindowAvailable()
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
                height: 240 * settings.scale,
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
          event.preventDefault();
          setQuickActionsOpen((open) => !open);
          setQuickActionMode("main");
        }}
      >
        <div
          className="pet-scale-frame"
          style={{
            transform: `scale(${settings.scale})`,
          }}
        >
          {focusTimerActive && timerDisplay ? (
            <TimerBadge display={timerDisplay} />
          ) : null}
          {!focusTimerActive && pet.bubble ? <Bubble text={pet.bubble} /> : null}
          {quickActionsOpen ? (
            <QuickActions
              mode={quickActionMode}
              onShowCountdownOptions={() => setQuickActionMode("countdown")}
              onStartCountdown={startCountdownForMinutes}
              onStartCustomCountdown={() =>
                startCountdownForMinutes(settings.timer.customCountdownMinutes)
              }
              onToggleStopwatch={toggleStopwatch}
              onOpenSettings={() => {
                closeQuickActions();
                setSettingsOpen(true);
              }}
            />
          ) : null}
          <PetSprite
            pet={visiblePet}
            onClick={() => {
              if (!focusTimerActive) {
                dispatchPet({ type: "pet-click" });
              }
            }}
            onToggleWork={() => {
              if (!focusTimerActive) {
                dispatchPet({ type: "cycle-state" });
              }
            }}
          />
        </div>
      </div>
    </main>
  );
}
