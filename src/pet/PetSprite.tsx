import boochEat from "../assets/booch-eat.mov";
import boochIdle from "../assets/booch-idle.mov";
import boochWork from "../assets/booch-work.mov";
import { KeyedVideo } from "./KeyedVideo";
import type { PetViewModel } from "./types";
import { startPetDrag } from "./windowControls";

interface PetSpriteProps {
  pet: PetViewModel;
  onClick: () => void;
  onToggleWork: () => void;
}

export function PetSprite({ pet, onClick, onToggleWork }: PetSpriteProps) {
  const videoSrc = {
    idle: boochIdle,
    work: boochWork,
    eat: boochEat,
  }[pet.state];

  return (
    <button
      className={`pet-shell pet-shell--${pet.state}`}
      type="button"
      onClick={onClick}
      onDoubleClick={onToggleWork}
      onMouseDown={(event) => {
        if (event.button === 0) {
          void startPetDrag();
        }
      }}
      aria-label={`渣熊${pet.state}`}
    >
      <KeyedVideo src={videoSrc} />
    </button>
  );
}
