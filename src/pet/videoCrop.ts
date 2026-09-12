export interface VideoCropRect {
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
}

const bottomRecordingArtifactRatio = 0.04;

export function getBoochaVideoCropRect(
  videoWidth: number,
  videoHeight: number,
): VideoCropRect {
  const bottomTrim = Math.min(
    Math.ceil(videoHeight * bottomRecordingArtifactRatio),
    Math.max(0, videoHeight - 1),
  );

  return {
    sourceX: 0,
    sourceY: 0,
    sourceWidth: videoWidth,
    sourceHeight: videoHeight - bottomTrim,
  };
}
