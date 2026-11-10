"use client";
import dynamic from "next/dynamic";
const RoomInterior3DLazy = dynamic(() => import("./RoomInterior3D"), {
  ssr: false,
  loading: () => <div style={{ position: "absolute", inset: 0, background: "#141414", zIndex: 8 }} />,
});
export default RoomInterior3DLazy;
