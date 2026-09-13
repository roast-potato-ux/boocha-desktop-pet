import boochaEat from "../assets/boocha-eat.mov";
import boochaIdle from "../assets/boocha-idle.mov";
import boochaWork from "../assets/boocha-work.mov";
import boochaSurprise from "../assets/boocha-surprise.mov";
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
    idle: boochaIdle,
    work: boochaWork,
    eat: boochaEat,
    surprise: boochaSurprise,
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
