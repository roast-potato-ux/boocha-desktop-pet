interface BubbleProps {
  text: string;
}

export function Bubble({ text }: BubbleProps) {
  return <p className="pet-bubble">{text}</p>;
}
