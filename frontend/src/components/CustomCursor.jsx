import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const ringRef = useRef(null);
  const rx = useRef(0);
  const ry = useRef(0);
  const mx = useRef(0);
  const my = useRef(0);

  useEffect(() => {
    const onMove = (e) => {
      mx.current = e.clientX;
      my.current = e.clientY;
      if (cursorRef.current) {
        cursorRef.current.style.left = mx.current + "px";
        cursorRef.current.style.top = my.current + "px";
      }
    };

    document.addEventListener("mousemove", onMove);

    const animRing = () => {
      rx.current += (mx.current - rx.current) * 0.12;
      ry.current += (my.current - ry.current) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = rx.current + "px";
        ringRef.current.style.top = ry.current + "px";
      }
      requestAnimationFrame(animRing);
    };
    animRing();

    const interactables = document.querySelectorAll("a, button, .feature-card");
    const onEnter = () => {
      if (cursorRef.current) { cursorRef.current.style.width = "12px"; cursorRef.current.style.height = "12px"; }
      if (ringRef.current) { ringRef.current.style.width = "44px"; ringRef.current.style.height = "44px"; }
    };
    const onLeave = () => {
      if (cursorRef.current) { cursorRef.current.style.width = "8px"; cursorRef.current.style.height = "8px"; }
      if (ringRef.current) { ringRef.current.style.width = "32px"; ringRef.current.style.height = "32px"; }
    };

    interactables.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    return () => {
      document.removeEventListener("mousemove", onMove);
      interactables.forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
    };
  }, []);

  return (
    <>
      <div className="cursor" ref={cursorRef} />
      <div className="cursor-ring" ref={ringRef} />
    </>
  );
}