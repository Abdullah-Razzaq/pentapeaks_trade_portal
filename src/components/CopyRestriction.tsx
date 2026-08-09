"use client";

import { useEffect } from "react";

export default function CopyRestriction() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;

        const handleCopy = (e: ClipboardEvent) => {
          const target = e.target as HTMLElement;
          if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
            return;
          }
          e.preventDefault();
          alert("Cannot copy data: Direct copying of trade records is restricted on PentaPeaks International.");
        };

        const handleContextMenu = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
            return;
          }
          e.preventDefault();
        };

        document.addEventListener("copy", handleCopy);
        document.addEventListener("contextmenu", handleContextMenu);

        cleanup = () => {
          document.removeEventListener("copy", handleCopy);
          document.removeEventListener("contextmenu", handleContextMenu);
        };

    return () => {
      if (cleanup) cleanup();
    };


  }, []);

  return null;
}
