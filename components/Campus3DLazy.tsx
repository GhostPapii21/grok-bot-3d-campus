"use client";
import dynamic from "next/dynamic";
// WebGL scene, loaded only in the browser. Falls back to the SVG 3D engine when WebGL is missing.
const Campus3DLazy = dynamic(() => import("./Campus3D"), { ssr: false, loading: () => <div style={{ position: "absolute", inset: 0, background: "#141414" }} /> });
export default Campus3DLazy;
