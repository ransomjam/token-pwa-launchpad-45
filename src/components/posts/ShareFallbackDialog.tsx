import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check, Download, MessageCircle, Facebook } from 'lucide-react';
import { toast } from 'sonner';

type ShareFallbackDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  caption: string;
};

export const ShareFallbackDialog = ({ open, onOpenChange, imageUrl, caption }: ShareFallbackDialogProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      toast.error('Copy not supported. Long-press to copy manually.');
      return;
    }

    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      toast.success('Caption copied');
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy caption', err);
      toast.error('Copy not supported. Long-press to copy manually.');
    }
  };

  const encodedCaption = encodeURIComponent(caption);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">Manual share</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Sharing isn’t supported on this device. Download the card and paste the caption when posting to WhatsApp or Facebook.
          </DialogDescription>
        </DialogHeader>

        {imageUrl && (
          <div className="overflow-hidden rounded-2xl border border-border/40">
            <img src={imageUrl} alt="Share preview" className="w-full" />
          </div>
        )}

        <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Caption</p>
          <p className="text-sm text-foreground whitespace-pre-wrap break-words">{caption}</p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button onClick={handleCopy} variant="secondary" className="w-full">
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy caption'}
          </Button>

          {imageUrl && (
            <a href={imageUrl} download className="w-full">
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download image
              </Button>
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <a
            href={`https://wa.me/?text=${encodedCaption}`}
            target="_blank"
            rel="noreferrer"
            className="w-full"
          >
            <Button className="w-full bg-[#25D366] text-white hover:bg-[#1eb65a]">
              <MessageCircle className="mr-2 h-4 w-4" />
              Open WhatsApp Web
            </Button>
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://prolist-demo.local/share-card')}&quote=${encodedCaption}`}
            target="_blank"
            rel="noreferrer"
            className="w-full"
          >
            <Button className="w-full bg-[#1877F2] text-white hover:bg-[#0f62cf]">
              <Facebook className="mr-2 h-4 w-4" />
              Open Facebook
            </Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareFallbackDialog;
