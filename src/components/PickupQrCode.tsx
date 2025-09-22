import { useMemo } from 'react';

import { generateQrMatrix } from '@/lib/qr';
import { cn } from '@/lib/utils';

export type PickupQrCodeProps = {
  value: string;
  size?: number;
  className?: string;
  ariaLabel?: string;
};

const quietZone = 4;

export const PickupQrCode = ({ value, size = 240, className, ariaLabel }: PickupQrCodeProps) => {
  const matrix = useMemo(() => generateQrMatrix(value), [value]);
  const dimension = matrix.length + quietZone * 2;

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${dimension} ${dimension}`}
      width={size}
      height={size}
      className={cn('text-slate-900 dark:text-slate-100', className)}
      shapeRendering="crispEdges"
    >
      <rect width={dimension} height={dimension} fill="white" />
      {matrix.map((row, rowIndex) =>
        row.map((value, colIndex) =>
          value ? (
            <rect
              key={`${rowIndex}-${colIndex}`}
              x={colIndex + quietZone}
              y={rowIndex + quietZone}
              width={1}
              height={1}
              fill="currentColor"
            />
          ) : null,
        ),
      )}
    </svg>
  );
};
