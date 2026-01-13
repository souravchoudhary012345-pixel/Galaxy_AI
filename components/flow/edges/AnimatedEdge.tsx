"use client";

import { BaseEdge, EdgeProps, getSmoothStepPath } from "reactflow";

export default function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
}: EdgeProps) {
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge
      id={id}
      path={path}
      markerEnd={markerEnd}
      style={{
        stroke: "#6366f1", // Fallback or base color
        strokeWidth: 2,
        strokeDasharray: "12 12",
        animation: "filament-flow 30s linear infinite",
        // Note: True gradient stroke requires SVG <defs> which is complex in this component wrapper without wrapping the <svg>.
        // Applying the requested animation class instead if possible, or inline style.
        opacity: 0.8,
        ...style,
      }}
    />
  );
}
