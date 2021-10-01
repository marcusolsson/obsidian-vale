import { setIcon } from "obsidian";
import * as React from "react";

interface Props {
  name: string;

  onClick?: () => void;
  size?: number;
  className?: string;
}

export const Icon = ({
  name,
  onClick,
  size = 16,
  className,
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
      onClick={onClick}
    />
  );
};
