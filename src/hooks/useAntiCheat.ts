import { useEffect, useRef, useState, useCallback } from "react";

interface UseAntiCheatOptions {
  enabled: boolean;
  onViolate: (reason: string) => void;
}

/**
 * Mendeteksi ketika peserta keluar dari tab ujian, membuka tab baru,
 * beralih aplikasi, atau mencoba screenshot / print.
 *
 * - visibilitychange: tab berpindah / minimize / beralih aplikasi
 * - blur: jendela ujian kehilangan fokus
 * - keydown: PrtScn, Ctrl+P, Ctrl+S, F12, Ctrl+Shift+I (devtools)
 *
 * Tidak ada peringatan — pelanggaran langsung menyelesaikan ujian.
 */
export function useAntiCheat({ enabled, onViolate }: UseAntiCheatOptions) {
  const onViolateRef = useRef(onViolate);
  onViolateRef.current = onViolate;

  const [violationCount, setViolationCount] = useState(0);
  const violatedRef = useRef(false);

  const handleViolation = useCallback((reason: string) => {
    if (violatedRef.current) return;
    violatedRef.current = true;
    setViolationCount((c) => c + 1);
    onViolateRef.current(reason);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    function onVisibilityChange() {
      if (document.hidden) {
        handleViolation("Tab ujian ditinggalkan / beralih ke aplikasi lain");
      }
    }

    function onBlur() {
      handleViolation("Jendela ujian kehilangan fokus");
    }

    function onKeyDown(e: KeyboardEvent) {
      const key = e.key;
      // PrintScreen
      if (key === "PrintScreen") {
        handleViolation("Tried to take a screenshot (PrintScreen)");
        return;
      }
      // Ctrl+P (print)
      if ((e.ctrlKey || e.metaKey) && key === "p") {
        e.preventDefault();
        handleViolation("Tried to print the exam page");
        return;
      }
      // Ctrl+S (save)
      if ((e.ctrlKey || e.metaKey) && key === "s") {
        e.preventDefault();
        handleViolation("Tried to save the exam page");
        return;
      }
      // F12 or Ctrl+Shift+I (devtools)
      if (key === "F12" || ((e.ctrlKey || e.metaKey) && e.shiftKey && (key === "I" || key === "i"))) {
        e.preventDefault();
        handleViolation("Tried to open developer tools");
        return;
      }
      // Ctrl+Shift+C (element inspector)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (key === "C" || key === "c")) {
        e.preventDefault();
        handleViolation("Tried to inspect exam elements");
        return;
      }
      // Ctrl+U (view source)
      if ((e.ctrlKey || e.metaKey) && (key === "u" || key === "U")) {
        e.preventDefault();
        handleViolation("Tried to view page source");
        return;
      }
    }

    function onContextMenu(e: MouseEvent) {
      e.preventDefault();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("contextmenu", onContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("contextmenu", onContextMenu);
    };
  }, [enabled, handleViolation]);

  const reset = useCallback(() => {
    violatedRef.current = false;
    setViolationCount(0);
  }, []);

  return { violationCount, reset };
}
