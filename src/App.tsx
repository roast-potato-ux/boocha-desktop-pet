import { useEffect, useReducer, useRef, useState } from "react";
import { Bubble } from "./pet/Bubble";
import { PetSprite } from "./pet/PetSprite";
import {
  createInitialMealReminderState,
  evaluateMealReminder,
} from "./pet/mealScheduler";
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
  const [position, setPosition] = useState(() => {
    const savedPosition = loadPetPosition(window.localStorage);
    return savedPosition ?? getDefaultPetPosition(getViewport());
  });
  const mealReminderState = useRef(createInitialMealReminderState());
  const dragState = useRef<{
    startPointer: { x: number; y: number };
    startPosition: { left: number; top: number };
  } | null>(null);

  useEffect(() => {
    const tick = () => {
      const result = evaluateMealReminder(new Date(), mealReminderState.current);
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
