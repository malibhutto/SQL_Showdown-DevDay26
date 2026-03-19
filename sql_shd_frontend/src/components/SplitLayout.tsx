import type { ReactNode } from "react";
import "./SplitLayout.css";

interface SplitLayoutProps {
  left: ReactNode;
  right: ReactNode;
}

export function SplitLayout({ left, right }: SplitLayoutProps) {
  return (
    <div className="split-layout">
      <div className="split-left">{left}</div>
      <div className="split-divider">
        <div className="divider-grip"></div>
      </div>
      <div className="split-right">{right}</div>
    </div>
  );
}
