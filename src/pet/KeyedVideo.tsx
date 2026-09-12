import { useEffect, useRef } from "react";
import { applyBottomFeather } from "./bottomFeather";
import { removeBackgroundPixels, sampleCornerColor } from "./backgroundKeyer";
import { getBoochaVideoCropRect } from "./videoCrop";

const boochaBackgroundThreshold = 18;
const bottomFeatherRows = 56;

interface KeyedVideoProps {
  src: string;
}

export function KeyedVideo({ src }: KeyedVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    let animationFrame = 0;
    let stopped = false;

    const renderFrame = () => {
      if (stopped) {
        return;
      }

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const width = video.videoWidth;
        const height = video.videoHeight;
        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (width > 0 && height > 0 && context) {
          const crop = getBoochaVideoCropRect(width, height);

          if (
            canvas.width !== crop.sourceWidth ||
            canvas.height !== crop.sourceHeight
          ) {
            canvas.width = crop.sourceWidth;
            canvas.height = crop.sourceHeight;
          }

          context.clearRect(0, 0, crop.sourceWidth, crop.sourceHeight);
          context.drawImage(
            video,
            crop.sourceX,
            crop.sourceY,
            crop.sourceWidth,
            crop.sourceHeight,
            0,
            0,
            crop.sourceWidth,
            crop.sourceHeight,
          );

          const imageData = context.getImageData(
            0,
            0,
            crop.sourceWidth,
            crop.sourceHeight,
          );
          const keyColor = sampleCornerColor(
            imageData.data,
            crop.sourceWidth,
            crop.sourceHeight,
          );
          removeBackgroundPixels(
            imageData.data,
            crop.sourceWidth,
            crop.sourceHeight,
            keyColor,
            boochaBackgroundThreshold,
          );
          applyBottomFeather(
            imageData.data,
            crop.sourceWidth,
            crop.sourceHeight,
            bottomFeatherRows,
          );
          context.putImageData(imageData, 0, 0);
        }
      }

      animationFrame = window.requestAnimationFrame(renderFrame);
    };

    void video.play().catch(() => undefined);
    animationFrame = window.requestAnimationFrame(renderFrame);

    return () => {
      stopped = true;
      window.cancelAnimationFrame(animationFrame);
    };
  }, [src]);

  return (
    <>
      <video
        ref={videoRef}
        key={src}
        className="pet-source-video"
        src={src}
        autoPlay
        loop
        muted
        playsInline
      />
      <canvas ref={canvasRef} className="pet-video" aria-hidden="true" />
    </>
  );
}
