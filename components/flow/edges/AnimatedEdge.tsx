"use client";

import { BaseEdge, EdgeProps, getSmoothStepPath } from "reactflow";

export default function AnimatedEdge(props: EdgeProps) {
  const [path] = getSmoothStepPath(props);

  return (
    <BaseEdge
      id={props.id}
      path={path}
      markerEnd={props.markerEnd}
      style={{
        stroke: "#6366F1",
        strokeWidth: 1.5,
        strokeDasharray: "6 4",
        animation: "dashmove 1s linear infinite"
      }}
    />
  );
}
