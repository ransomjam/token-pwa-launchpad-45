import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { usePostStore } from '@/context/PostStore';
import { useSession } from '@/context/SessionContext';
import { PostPreviewCard } from '@/components/posts/PostPreviewCard';
import { AIAssistPanel } from '@/components/posts/AIAssistPanel';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ShareFallbackDialog from '@/components/posts/ShareFallbackDialog';
import { buildPostShareText, createPostShareImage, createShareFileName } from '@/lib/postShare';

const canUseClipboard = typeof navigator !== 'undefined' && !!navigator.clipboard;

const DEMO_IMAGES = [
  '/demo/blue-airforce-shoes.jfif',
  '/demo/cordless-steam-iron.jfif',
  '/demo/la-girl-pro-conceal.jfif',
  '/demo/maono-podcast-mic.jfif',
  '/demo/scanfrost-double-door-fridge.jfif',
  '/demo/silver-crest-stand-mixer.jfif',
  '/demo/steam-press-center.jfif',
  '/demo/td-systems-32in-smart-tv.jfif',
  '/demo/wireless-lavalier-kit.jfif',
  '/demo/download-2.jfif',
  '/demo/download-3.jfif',
  '/demo/download-4.jfif',
  '/demo/download-5.jfif',
  '/demo/download-6.jfif',
];

const CreatePost = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { posts, addPost, updatePost } = usePostStore();
  const { session } = useSession();
  const [title, setTitle] = useState('');
  const [priceXAF, setPriceXAF] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [startDeal, setStartDeal] = useState(false);
  const [visibility, setVisibility] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [fallbackCaption, setFallbackCaption] = useState('');
  const [fallbackImageUrl, setFallbackImageUrl] = useState<string | null>(null);

  const editId = useMemo(() => searchParams.get('edit'), [searchParams]);
  const editingPost = useMemo(
    () => (editId ? posts.find(post => post.id === editId) : undefined),
    [editId, posts]
  );

  useEffect(() => {
    if (!editId) return;
    if (!editingPost) {
      toast.error('Post not found. Starting a new one.');
      navigate('/user/create-post', { replace: true });
      return;
    }

    setTitle(editingPost.title);
    setPriceXAF(editingPost.priceXAF.toString());
    setCaption(editingPost.caption);
    setSelectedPhotos(editingPost.photos);
    setStartDeal(editingPost.dealLinkEnabled);
    setVisibility(editingPost.visibility);
  }, [editId, editingPost, navigate]);

  useEffect(() => {
    return () => {
      if (fallbackImageUrl) {
        URL.revokeObjectURL(fallbackImageUrl);
      }
    };
  }, [fallbackImageUrl]);

  const handlePhotoSelect = (photo: string) => {
    if (selectedPhotos.includes(photo)) {
      setSelectedPhotos(selectedPhotos.filter(p => p !== photo));
    } else if (selectedPhotos.length < 4) {
      setSelectedPhotos([...selectedPhotos, photo]);
    }
  };

  const handleShare = async () => {
    if (!title || !priceXAF || selectedPhotos.length === 0) {
      toast.error('Please fill in title, price, and select at least one photo');
      return;
    }

    const price = parseInt(priceXAF);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setIsSharing(true);

    const resolvedCaption = caption.trim()
      ? caption.trim()
      : `${title} - ${price.toLocaleString()} XAF`;

    let postRecord = editingPost;

    if (editingPost) {
      const updates = {
        title,
        priceXAF: price,
        caption: resolvedCaption,
        photos: selectedPhotos,
        dealLinkEnabled: startDeal,
        visibility,
      };
      updatePost(editingPost.id, updates);
      postRecord = { ...editingPost, ...updates };
    } else {
      postRecord = addPost({
        title,
        priceXAF: price,
        caption: resolvedCaption,
        photos: selectedPhotos,
        dealLinkEnabled: startDeal,
        visibility,
        seller: {
          id: 'current-user',
          name: session?.displayName || session?.personalName || 'You',
          verified: !!session?.isVerified,
          city: 'Douala',
        },
      });
    }

    if (!postRecord) {
      toast.error('Unable to prepare post for sharing');
      setIsSharing(false);
      return;
    }

    const shareSellerName =
      session?.businessName?.trim() ||
      session?.displayName?.trim() ||
      session?.personalName?.trim() ||
      'ProList Seller';
    const shareAvatarUrl = session?.avatarUrl ?? null;
    const shareVerified = !!session?.isVerified;

    const shareText = buildPostShareText({
      title: postRecord.title,
      priceXAF: postRecord.priceXAF,
      caption: postRecord.caption,
      coverPhoto: postRecord.photos[0],
      dealLinkEnabled: postRecord.dealLinkEnabled,
      postId: postRecord.id,
      sellerName: shareSellerName,
      sellerAvatarUrl: shareAvatarUrl,
      sellerVerified: shareVerified,
    });

    if (canUseClipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success('Caption copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }

    let shareBlob: Blob | null = null;

    try {
      shareBlob = await createPostShareImage({
        title: postRecord.title,
        priceXAF: postRecord.priceXAF,
        caption: postRecord.caption,
        coverPhoto: postRecord.photos[0],
        sellerName: shareSellerName,
        sellerAvatarUrl: shareAvatarUrl,
        sellerVerified: shareVerified,
      });
    } catch (imageErr) {
      console.error('Unable to generate share image', imageErr);
      toast.error('Could not prepare share image');
      setIsSharing(false);
      return;
    }

    try {
      if (!shareBlob) {
        throw new Error('Share image missing');
      }

      const shareFile = new File([shareBlob], createShareFileName(postRecord.title), {
        type: 'image/jpeg',
      });

      const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
      const canShareWithFiles =
        canShare && typeof navigator.canShare === 'function' && navigator.canShare({ files: [shareFile] });

      if (canShare && canShareWithFiles) {
        await navigator.share({
          files: [shareFile],
          text: shareText,
        });
        toast.success('Shared successfully!');
        navigate('/user/posts');
      } else {
        const blobUrl = URL.createObjectURL(shareBlob);
        if (fallbackImageUrl) {
          URL.revokeObjectURL(fallbackImageUrl);
        }
        setFallbackImageUrl(blobUrl);
        setFallbackCaption(shareText);
        setFallbackOpen(true);
        toast.info('Sharing is not supported here. Use the manual options.');
      }
    } catch (err) {
      console.error('Share failed:', err);
      toast.error('Sharing failed. Use manual options instead.');
      if (shareBlob) {
        const blobUrl = URL.createObjectURL(shareBlob);
        if (fallbackImageUrl) {
          URL.revokeObjectURL(fallbackImageUrl);
        }
        setFallbackImageUrl(blobUrl);
        setFallbackCaption(shareText);
        setFallbackOpen(true);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleSaveDraft = () => {
    if (!title || !priceXAF) {
      toast.error('Please fill in at least title and price');
      return;
    }

    if (selectedPhotos.length === 0) {
      toast.error('Please choose at least one photo');
      return;
    }

    const price = parseInt(priceXAF);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    const resolvedCaption = caption.trim()
      ? caption.trim()
      : `${title} - ${price.toLocaleString()} XAF`;

    if (editingPost) {
      updatePost(editingPost.id, {
        title,
        priceXAF: price,
        caption: resolvedCaption,
        photos: selectedPhotos,
        dealLinkEnabled: startDeal,
        visibility,
      });
      toast.success('Post updated!');
    } else {
      addPost({
        title,
        priceXAF: price,
        caption: resolvedCaption,
        photos: selectedPhotos,
        dealLinkEnabled: startDeal,
        visibility,
        seller: {
          id: 'current-user',
          name: session?.displayName || session?.personalName || 'You',
          verified: !!session?.isVerified,
          city: 'Douala',
        },
      });
      toast.success('Draft saved!');
    }
    navigate('/user/posts');
  };

  return (
    <div className="min-h-screen bg-app-gradient pb-24">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-xl p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">{editingPost ? 'Edit Post' : 'Create Post'}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <div className="space-y-4 rounded-2xl border border-border/60 bg-card/50 p-4 backdrop-blur">
          <div>
            <Label htmlFor="title" className="text-sm font-semibold">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Product name..."
              className="mt-1.5"
              maxLength={80}
            />
          </div>

          <div>
            <Label htmlFor="price" className="text-sm font-semibold">
              Price (XAF)
            </Label>
            <Input
              id="price"
              type="number"
              value={priceXAF}
              onChange={(e) => setPriceXAF(e.target.value)}
              placeholder="15000"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold">Photos (1-4)</Label>
            <div className="mt-1.5 space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPhotoPicker(!showPhotoPicker)}
                className="w-full"
              >
                <ImagePlus className="mr-2 h-4 w-4" />
                {selectedPhotos.length === 0
                  ? 'Select Photos'
                  : `${selectedPhotos.length} selected`}
              </Button>

              {showPhotoPicker && (
                <div className="grid grid-cols-4 gap-2 rounded-xl border border-border/40 bg-background/50 p-3">
                  {DEMO_IMAGES.map((img) => (
                    <button
                      key={img}
                      type="button"
                      onClick={() => handlePhotoSelect(img)}
                      className={cn(
                        'relative aspect-square overflow-hidden rounded-lg border-2 transition-all',
                        selectedPhotos.includes(img)
                          ? 'border-primary shadow-glow'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      )}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                      {selectedPhotos.includes(img) && (
                        <div className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                          {selectedPhotos.indexOf(img) + 1}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {selectedPhotos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {selectedPhotos.map((photo, idx) => (
                    <div key={photo} className="relative flex-shrink-0">
                      <img
                        src={photo}
                        alt=""
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                      {idx === 0 && (
                        <div className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">
                          Cover
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="caption" className="text-sm font-semibold">
              Caption (optional, max 220 chars)
            </Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a catchy description..."
              className="mt-1.5 min-h-[80px]"
              maxLength={220}
            />
            <div className="mt-1 text-right text-xs text-muted-foreground">
              {caption.length}/220
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/40 bg-background/30 p-3">
            <div>
              <Label className="text-sm font-semibold">Visibility</Label>
              <p className="text-xs text-muted-foreground">
                {visibility === 'PUBLIC' ? 'Visible in Listings' : 'Only you can see'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Private</span>
              <Switch
                checked={visibility === 'PUBLIC'}
                onCheckedChange={(checked) => setVisibility(checked ? 'PUBLIC' : 'PRIVATE')}
              />
              <span className="text-xs text-muted-foreground">Public</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/40 bg-background/30 p-3">
            <Label htmlFor="start-deal" className="text-sm font-semibold">
              Include Deal Link
            </Label>
            <Switch
              id="start-deal"
              checked={startDeal}
              onCheckedChange={setStartDeal}
            />
          </div>
        </div>

        <AIAssistPanel
          currentCaption={caption}
          onReplace={(suggestion) => setCaption(suggestion)}
        />

        {title && priceXAF && selectedPhotos.length > 0 && (
          <div>
            <Label className="mb-2 block text-sm font-semibold">Preview</Label>
            <PostPreviewCard
              title={title}
              priceXAF={parseInt(priceXAF) || 0}
              coverPhoto={selectedPhotos[0]}
              caption={caption || `${title} - Get yours today!`}
              className="mx-auto max-w-sm"
            />
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            className="flex-1"
          >
            {editingPost ? 'Save Changes' : 'Save Draft'}
          </Button>
          <Button
            onClick={handleShare}
            disabled={!title || !priceXAF || selectedPhotos.length === 0 || isSharing}
            className="flex-1 bg-gradient-to-r from-primary via-teal to-blue text-white shadow-glow"
          >
            {isSharing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sharing...
              </>
            ) : (
              'Share'
            )}
          </Button>
        </div>
      </div>

      <ShareFallbackDialog
        open={fallbackOpen}
        onOpenChange={(open) => {
          setFallbackOpen(open);
          if (!open && fallbackImageUrl) {
            URL.revokeObjectURL(fallbackImageUrl);
            setFallbackImageUrl(null);
          }
        }}
        imageUrl={fallbackImageUrl}
        caption={fallbackCaption}
      />
    </div>
  );
};

export default CreatePost;
