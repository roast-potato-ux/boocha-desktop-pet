import { useEffect, useReducer, useRef, useState } from "react";
import { Bubble } from "./pet/Bubble";
import { PetSprite } from "./pet/PetSprite";
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
} from "./pet/nativeMenuClient";
import {
  applyDrag,
  getDefaultPetPosition,
  loadPetPosition,
  savePetPosition,
} from "./pet/petPlacement";
import { reducePetState } from "./pet/stateMachine";
import type { PetEvent, PetViewModel } from "./pet/types";
import { isNativePetWindowAvailable } from "./pet/windowControls";

const initialPet: PetViewModel = {
  state: "idle",
  bubble: null,
  lastInteractionAt: Date.now(),
};

function reducer(state: PetViewModel, event: PetEvent): PetViewModel {
  return reducePetState(state, event, Date.now());
}

function getViewport() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export default function App() {
  const [pet, dispatch] = useReducer(reducer, initialPet);
  const [remindersPaused, setRemindersPaused] = useState(false);
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

  useEffect(() => {
    const tick = () => {
      const result = evaluateMealReminder(new Date(), mealReminderState.current, {
        paused: remindersPaused,
      });
      mealReminderState.current = result.state;

      if (result.event) {
        dispatch(result.event);
      }
    };

    tick();
    const timer = window.setInterval(tick, 30 * 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [remindersPaused]);

  useEffect(() => {
    const tick = () => {
      const result = evaluateAmbientInteraction(
        Date.now(),
        pet,
        ambientInteractionState.current,
        Math.random(),
      );
      ambientInteractionState.current = result.state;

      if (result.event) {
        dispatch(result.event);
      }
    };

    const timer = window.setInterval(tick, 20 * 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [pet]);

  useEffect(() => {
    if (!pet.bubble) {
      return;
    }

    const interactionAt = pet.lastInteractionAt;
    const timer = window.setTimeout(() => {
      dispatch({ type: "clear-bubble", interactionAt });
    }, 8 * 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pet.bubble, pet.lastInteractionAt]);

  useEffect(() => {
    let unlistenStateRequests: (() => void) | null = null;
    let unlisten: (() => void) | null = null;
    let cancelled = false;

    void listenForPetStateRequests((state) => {
      dispatch({ type: "select-state", state });
    }).then((nextUnlisten) => {
      if (cancelled) {
        nextUnlisten();
        return;
      }

      unlistenStateRequests = nextUnlisten;
    });

    void listenForReminderPauseChanges((paused) => {
      setRemindersPaused(paused);
    }).then((nextUnlisten) => {
      if (cancelled) {
        nextUnlisten();
        return;
      }

      unlisten = nextUnlisten;
    });

    return () => {
      cancelled = true;
      unlistenStateRequests?.();
      unlisten?.();
    };
  }, []);

  return (
    <main className="pet-stage" aria-label="Booch desktop pet">
      <div
        className="pet-anchor"
        style={{ left: position.left, top: position.top }}
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
      >
        {pet.bubble ? <Bubble text={pet.bubble} /> : null}
        <PetSprite
          pet={pet}
          onClick={() => dispatch({ type: "pet-click" })}
          onToggleWork={() => dispatch({ type: "cycle-state" })}
        />
      </div>
    </main>
  );
}
