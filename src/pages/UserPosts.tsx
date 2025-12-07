import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Edit2, Handshake, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePostStore } from '@/context/PostStore';
import { toast } from 'sonner';
import { format } from 'date-fns';
import ShareFallbackDialog from '@/components/posts/ShareFallbackDialog';
import { normalizePost, shareContent } from '@/lib/unifiedShare';
import { useSession } from '@/context/SessionContext';

const UserPosts = () => {
  const navigate = useNavigate();
  const { posts } = usePostStore();
  const { session } = useSession();
  const [sharing, setSharing] = useState<string | null>(null);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [fallbackImageUrl, setFallbackImageUrl] = useState<string | null>(null);
  const [fallbackCaption, setFallbackCaption] = useState('');

  useEffect(() => {
    return () => {
      if (fallbackImageUrl) {
        URL.revokeObjectURL(fallbackImageUrl);
      }
    };
  }, [fallbackImageUrl]);

  const handleShare = async (post: typeof posts[number]) => {
    setSharing(post.id);

    const shareSellerName =
      session?.businessName?.trim() ||
      session?.displayName?.trim() ||
      session?.personalName?.trim() ||
      'ProList Seller';
    const shareAvatarUrl = session?.avatarUrl ?? null;
    const shareVerified = !!session?.isVerified;

    const content = normalizePost(post, {
      name: shareSellerName,
      avatarUrl: shareAvatarUrl,
      verified: shareVerified,
    });

    await shareContent(content, {
      onSuccess: () => {
        toast.success('Caption copied! Shared successfully!');
        setSharing(null);
      },
      onError: (error) => {
        toast.error(error);
        setSharing(null);
      },
      onFallback: (blobUrl, caption) => {
        if (fallbackImageUrl) {
          URL.revokeObjectURL(fallbackImageUrl);
        }
        setFallbackImageUrl(blobUrl);
        setFallbackCaption(caption);
        setFallbackOpen(true);
        toast.info('Sharing is not supported here. Use the manual options.');
        setSharing(null);
      },
    });
  };

  const handleStartDeal = (post: any) => {
    const prefill = encodeURIComponent(
      JSON.stringify({
        title: post.title,
        priceXAF: post.priceXAF,
        postId: post.id,
      })
    );
    navigate(`/buyers/deals?prefill=${prefill}`);
    toast.info('Deal form prefilled with post data');
  };

  return (
    <div className="min-h-screen bg-app-gradient pb-24">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="h-9 w-9 rounded-xl p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">My Posts</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        {posts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">No posts yet</p>
            <Button onClick={() => navigate('/user/create-post')}>
              Create Your First Post
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex gap-4 rounded-2xl border border-border/60 bg-card/50 p-4 backdrop-blur"
              >
                <img
                  src={post.photos[0]}
                  alt={post.title}
                  className="h-24 w-24 flex-shrink-0 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">{post.title}</h3>
                  <p className="text-sm font-semibold text-primary">
                    {post.priceXAF.toLocaleString()} XAF
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(new Date(post.createdAt), 'MMM d, yyyy')}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShare(post)}
                      className="h-8 px-3"
                      disabled={sharing === post.id}
                    >
                      {sharing === post.id ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Sharing...
                        </>
                      ) : (
                        <>
                          <Share2 className="mr-1.5 h-3.5 w-3.5" />
                          Share
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/user/create-post?edit=${post.id}`)}
                      className="h-8 px-3"
                    >
                      <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStartDeal(post)}
                      className="h-8 px-3"
                    >
                      <Handshake className="mr-1.5 h-3.5 w-3.5" />
                      Start Deal
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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

export default UserPosts;
