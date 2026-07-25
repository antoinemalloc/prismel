import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function ModalPortal({ children }: { children: React.ReactNode }) {
  const [el] = useState(() => document.createElement("div"));

  useEffect(() => {
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, [el]);

  return createPortal(children, el);
}
