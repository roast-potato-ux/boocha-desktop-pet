import { useEffect, useRef } from "react";
import { removeBackgroundPixels, sampleCornerColor } from "./backgroundKeyer";

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
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }

          context.clearRect(0, 0, width, height);
          context.drawImage(video, 0, 0, width, height);

          const imageData = context.getImageData(0, 0, width, height);
          const keyColor = sampleCornerColor(imageData.data, width, height);
          removeBackgroundPixels(imageData.data, width, height, keyColor, 42);
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
