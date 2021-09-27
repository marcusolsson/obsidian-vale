import { setIcon } from "obsidian";
import * as React from "react";

interface Props {
  name: string;
  size?: number;
}

export const Icon = ({ name, size = 16 }: Props) => {
  const ref = React.useRef<HTMLDivElement>();

  React.useEffect(() => {
    if (ref.current) {
      setIcon(ref.current, name, size);
    }
  });

  return (
    <div
      ref={ref}
      style={{
        width: size,
        height: size,
      }}
    />
  );
};
