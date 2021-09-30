import { setIcon } from "obsidian";
import * as React from "react";

interface Props {
  name: string;
  size?: number;
  className?: string;
}

export const Icon = ({
  name,
  className,
  size = 16,
}: Props): React.ReactElement => {
  const ref = React.useRef<HTMLDivElement>();

  React.useEffect(() => {
    if (ref.current) {
      setIcon(ref.current, name, size);
    }
  });

  return (
    <div
      className={className}
      ref={ref}
      style={{
        width: size,
        height: size,
      }}
    />
  );
};
