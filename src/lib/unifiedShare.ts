import { buildPostShareText, createPostShareImage, createShareFileName } from './postShare';
import type { ListingSummary } from '@/types';
import type { AuctionListing } from '@/types/auctions';
import type { Deal } from './dealsData';
import type { Post } from '@/context/PostStore';

/**
 * Unified share content that normalizes all shareable items
 */
export type ShareableContent = {
  id: string;
  title: string;
  priceXAF: number;
  coverPhoto: string;
  caption?: string;
  sellerName: string;
  sellerAvatarUrl?: string | null;
  sellerVerified: boolean;
  dealLinkEnabled?: boolean;
  postId?: string;
  seeMoreUrl?: string;
  storeHandle?: string;
};

/**
 * Normalize a Post to ShareableContent
 */
export const normalizePost = (post: Post, sellerInfo?: {
  name: string;
  avatarUrl?: string | null;
  verified: boolean;
}): ShareableContent => ({
  id: post.id,
  title: post.title,
  priceXAF: post.priceXAF,
  coverPhoto: post.photos[0],
  caption: post.caption,
  sellerName: sellerInfo?.name || post.seller?.name || 'ProList Seller',
  sellerAvatarUrl: sellerInfo?.avatarUrl ?? null,
  sellerVerified: sellerInfo?.verified ?? post.seller?.verified ?? false,
  dealLinkEnabled: post.dealLinkEnabled,
  postId: post.id,
});

/**
 * Normalize an Auction to ShareableContent
 */
export const normalizeAuction = (auction: AuctionListing): ShareableContent => ({
  id: auction.id,
  title: auction.title,
  priceXAF: auction.currentBidXAF,
  coverPhoto: auction.images[0] || '/placeholder.svg',
  caption: `Starting bid: ${auction.currentBidXAF.toLocaleString()} XAF\nAuction ends soon!`,
  sellerName: auction.seller.name,
  sellerAvatarUrl: null,
  sellerVerified: auction.seller.verified ?? false,
  seeMoreUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://prolist.africa'}/auction/${auction.id}`,
});

/**
 * Normalize a Listing to ShareableContent
 */
export const normalizeListing = (listing: ListingSummary): ShareableContent => ({
  id: listing.id,
  title: listing.title,
  priceXAF: listing.priceXAF,
  coverPhoto: listing.images[0] || '/placeholder.svg',
  caption: `${listing.priceXAF.toLocaleString()} XAF\nETA: ${listing.etaDays.min}-${listing.etaDays.max} days\nEscrow protected`,
  sellerName: listing.importer.displayName,
  sellerAvatarUrl: null,
  sellerVerified: listing.importer.verified,
  seeMoreUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://prolist.africa'}/listing/${listing.id}`,
});

/**
 * Normalize a Deal to ShareableContent
 */
export const normalizeDeal = (deal: Deal, sellerInfo?: {
  name: string;
  avatarUrl?: string | null;
  verified: boolean;
}): ShareableContent => ({
  id: deal.id,
  title: deal.title,
  priceXAF: deal.priceXAF * deal.qty,
  coverPhoto: '/placeholder.svg',
  caption: `Quantity: ${deal.qty}\nPrice: ${deal.priceXAF.toLocaleString()} XAF each\nTotal: ${(deal.priceXAF * deal.qty).toLocaleString()} XAF`,
  sellerName: sellerInfo?.name || 'ProList Dealer',
  sellerAvatarUrl: sellerInfo?.avatarUrl ?? null,
  sellerVerified: sellerInfo?.verified ?? false,
  seeMoreUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://prolist.africa'}/deals`,
});

/**
 * Normalize a Merchant Listing (catalog or repost) to ShareableContent
 */
export const normalizeMerchantListing = (
  listing: {
    id: string;
    title: string;
    priceXAF?: number;
    currentBidXAF?: number;
    image: string;
    type: 'auction' | 'direct';
    owner?: { id: string; name: string; verified: boolean };
  },
  sellerInfo?: {
    name: string;
    avatarUrl?: string | null;
    verified: boolean;
  }
): ShareableContent => {
  const price = listing.type === 'auction' ? (listing.currentBidXAF || 0) : (listing.priceXAF || 0);
  const caption = listing.type === 'auction' 
    ? `Current bid: ${price.toLocaleString()} XAF\nAuction ending soon!`
    : `${price.toLocaleString()} XAF\nDirect listing - order now!`;

  return {
    id: listing.id,
    title: listing.title,
    priceXAF: price,
    coverPhoto: listing.image,
    caption,
    sellerName: sellerInfo?.name || listing.owner?.name || 'ProList Merchant',
    sellerAvatarUrl: sellerInfo?.avatarUrl ?? null,
    sellerVerified: sellerInfo?.verified ?? listing.owner?.verified ?? false,
    seeMoreUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://prolist.africa'}`,
  };
};

/**
 * Universal share function that works with any normalized content
 */
export const shareContent = async (
  content: ShareableContent,
  callbacks: {
    onSuccess?: () => void;
    onError?: (error: string) => void;
    onFallback?: (imageUrl: string, caption: string) => void;
  } = {}
): Promise<void> => {
  const canUseClipboard = typeof navigator !== 'undefined' && !!navigator.clipboard;

  // Build share text
  const shareText = buildPostShareText({
    title: content.title,
    priceXAF: content.priceXAF,
    caption: content.caption || '',
    coverPhoto: content.coverPhoto,
    dealLinkEnabled: content.dealLinkEnabled,
    postId: content.postId,
    sellerName: content.sellerName,
    sellerAvatarUrl: content.sellerAvatarUrl,
    sellerVerified: content.sellerVerified,
    seeMoreUrl: content.seeMoreUrl,
    storeHandle: content.storeHandle,
  });

  // Copy caption to clipboard
  if (canUseClipboard) {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch (err) {
      console.error('Clipboard failed', err);
    }
  }

  // Generate share image
  let shareBlob: Blob | null = null;
  try {
    shareBlob = await createPostShareImage({
      title: content.title,
      priceXAF: content.priceXAF,
      caption: content.caption || '',
      coverPhoto: content.coverPhoto,
      sellerName: content.sellerName,
      sellerAvatarUrl: content.sellerAvatarUrl,
      sellerVerified: content.sellerVerified,
      seeMoreUrl: content.seeMoreUrl,
      storeHandle: content.storeHandle,
    });
  } catch (imageErr) {
    console.error('Share image failed', imageErr);
    callbacks.onError?.('Could not prepare share image');
    return;
  }

  // Try Web Share API
  try {
    if (!shareBlob) {
      throw new Error('Share image missing');
    }

    const shareFile = new File([shareBlob], createShareFileName(content.title), { type: 'image/jpeg' });
    const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
    const canShareWithFiles =
      canShare && typeof navigator.canShare === 'function' && navigator.canShare({ files: [shareFile] });

    if (canShare && canShareWithFiles) {
      await navigator.share({ files: [shareFile], text: shareText });
      callbacks.onSuccess?.();
    } else {
      // Use fallback dialog
      const blobUrl = URL.createObjectURL(shareBlob);
      callbacks.onFallback?.(blobUrl, shareText);
    }
  } catch (err) {
    console.error('Share failed', err);
    if (shareBlob) {
      const blobUrl = URL.createObjectURL(shareBlob);
      callbacks.onFallback?.(blobUrl, shareText);
    } else {
      callbacks.onError?.('Sharing failed');
    }
  }
};
