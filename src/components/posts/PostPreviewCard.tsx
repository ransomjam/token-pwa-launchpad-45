import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type PostPreviewCardProps = {
  title: string;
  priceXAF: number;
  coverPhoto: string;
  caption: string;
  className?: string;
};

export const PostPreviewCard = forwardRef<HTMLDivElement, PostPreviewCardProps>(
  ({ title, priceXAF, coverPhoto, caption, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-3xl bg-white shadow-lux',
          className
        )}
      >
        <div className="relative aspect-square w-full overflow-hidden">
          <img
            src={coverPhoto}
            alt={title}
            className="h-full w-full object-cover"
          />
          <div className="absolute top-3 right-3 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-glow">
            {priceXAF.toLocaleString()} XAF
          </div>
          <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-primary backdrop-blur">
            ProList
          </div>
        </div>
        <div className="p-4">
          <h3 className="mb-2 text-lg font-bold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-3">{caption}</p>
        </div>
      </div>
    );
  }
);

PostPreviewCard.displayName = 'PostPreviewCard';
