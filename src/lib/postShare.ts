const CANVAS_SIZE = 1080;
const IMAGE_PADDING = 64;

const toAbsoluteUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  if (typeof window === 'undefined') return path;
  try {
    return new URL(path, window.location.origin).toString();
  } catch {
    return path;
  }
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = src;
  });

const traceRoundedRectPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

const fillRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  traceRoundedRectPath(ctx, x, y, width, height, radius);
  ctx.fill();
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'post';

const storeHandleFrom = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 32) || 'prolistseller';

const DEFAULT_SEE_MORE_URL = 'https://prolist.africa';

export type ShareablePostInput = {
  title: string;
  priceXAF: number;
  caption: string;
  coverPhoto: string;
  dealLinkEnabled?: boolean;
  postId?: string;
  sellerName?: string;
  sellerAvatarUrl?: string | null;
  sellerVerified?: boolean;
  seeMoreUrl?: string;
  storeHandle?: string;
};

export const buildPostShareText = (input: ShareablePostInput) => {
  const { title, priceXAF, caption, dealLinkEnabled, postId, seeMoreUrl } = input;
  const trimmedCaption = caption?.trim();
  const textBase = trimmedCaption?.length
    ? `${title}\n${trimmedCaption}`
    : `${title} - ${priceXAF.toLocaleString()} XAF`;

  let seeMoreLink: string;

  if (dealLinkEnabled && postId) {
    const payload = {
      title,
      priceXAF,
      postId,
    };

    seeMoreLink = `prolist://deals/new?prefill=${encodeURIComponent(JSON.stringify(payload))}`;
  } else {
    seeMoreLink = seeMoreUrl ?? DEFAULT_SEE_MORE_URL;
  }

  return `${textBase}\n\nSee more: ${seeMoreLink}\nLet's make a deal with ProList`;
};

export const createPostShareImage = async (input: ShareablePostInput) => {
  if (typeof window === 'undefined') {
    throw new Error('Share image generation is only available in the browser');
  }

  const {
    sellerName = 'ProList Seller',
    sellerAvatarUrl,
    sellerVerified = false,
    storeHandle,
  } = input;

  const normalizedStoreHandle = storeHandle
    ? storeHandleFrom(storeHandle)
    : storeHandleFrom(sellerName);

  const storeLinkText = `prolistapp/${normalizedStoreHandle}`;

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  let avatarImage: HTMLImageElement | null = null;
  if (sellerAvatarUrl) {
    try {
      avatarImage = await loadImage(toAbsoluteUrl(sellerAvatarUrl));
    } catch {
      avatarImage = null;
    }
  }

  const avatarSize = 96;
  const avatarCornerRadius = 24;
  const edgeInset = 24;
  const avatarX = edgeInset;
  const avatarY = edgeInset;
  const headerBaseline = avatarY + avatarSize;
  const headerPadding = 32;
  let headerBottom = headerBaseline + headerPadding;

  ctx.save();
  traceRoundedRectPath(ctx, avatarX, avatarY, avatarSize, avatarSize, avatarCornerRadius);
  ctx.fillStyle = '#e2e8f0';
  ctx.fill();
  if (avatarImage) {
    ctx.save();
    traceRoundedRectPath(ctx, avatarX, avatarY, avatarSize, avatarSize, avatarCornerRadius);
    ctx.clip();
    ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();
  } else {
    ctx.fillStyle = '#cbd5f5';
    fillRoundedRect(ctx, avatarX, avatarY, avatarSize, avatarSize, avatarCornerRadius);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 48px "Inter", system-ui, -apple-system';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initials = sellerName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('') || 'P';
    ctx.fillText(initials, avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 2);
  }
  ctx.restore();

  const nameTextStart = avatarX + avatarSize + 24;
  const badgeRadius = 18;
  const badgeDiameter = badgeRadius * 2;
  const badgeSpacing = sellerVerified ? badgeDiameter + 16 : 0;
  const nameBaseline = headerBaseline - 32;
  const maxNameWidth = Math.max(0, CANVAS_SIZE - nameTextStart - IMAGE_PADDING - badgeSpacing);

  const drawName = (text: string) => {
    ctx.font = '600 36px "Inter", system-ui, -apple-system';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    if (maxNameWidth > 0) {
      ctx.fillText(text, nameTextStart, nameBaseline, maxNameWidth);
    } else {
      ctx.fillText(text, nameTextStart, nameBaseline);
    }
    const measuredWidth = ctx.measureText(text).width;
    return Math.min(measuredWidth, maxNameWidth);
  };

  const nameWidth = drawName(sellerName);

  if (sellerVerified) {
    const badgeX = nameTextStart + nameWidth + 16;
    const badgeY = nameBaseline - badgeDiameter;
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(badgeX + badgeRadius, badgeY + badgeRadius, badgeRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Inter", system-ui, -apple-system';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✓', badgeX + badgeRadius, badgeY + badgeRadius + 1);
  }

  const linkFontSize = 24;
  const linkTop = Math.min(headerBaseline - linkFontSize - 4, nameBaseline + 8);
  ctx.font = `500 ${linkFontSize}px "Inter", system-ui, -apple-system`;
  ctx.fillStyle = '#2563eb';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  if (maxNameWidth > 0) {
    ctx.fillText(storeLinkText, nameTextStart, linkTop, maxNameWidth);
  } else {
    ctx.fillText(storeLinkText, nameTextStart, linkTop);
  }
  const linkBottom = linkTop + linkFontSize;
  headerBottom = Math.max(headerBottom, linkBottom + headerPadding / 2);

  const imageAreaTop = headerBottom;
  const imageAreaHeight = Math.max(CANVAS_SIZE - imageAreaTop, 200);
  const imageAreaWidth = CANVAS_SIZE;

  const imageUrl = toAbsoluteUrl(input.coverPhoto);
  const photo = await loadImage(imageUrl);

  const scale = Math.max(imageAreaWidth / photo.width, imageAreaHeight / photo.height);
  const drawWidth = photo.width * scale;
  const drawHeight = photo.height * scale;
  const drawX = (imageAreaWidth - drawWidth) / 2;
  const drawY = imageAreaTop + (imageAreaHeight - drawHeight) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, imageAreaTop, imageAreaWidth, imageAreaHeight);
  ctx.clip();
  ctx.drawImage(photo, drawX, drawY, drawWidth, drawHeight);
  ctx.restore();

  const priceTagWidth = 320;
  const priceTagHeight = 80;
  const priceTagX = CANVAS_SIZE - priceTagWidth - IMAGE_PADDING;
  const priceTagY = headerBaseline - priceTagHeight;
  const priceGradient = ctx.createLinearGradient(priceTagX, priceTagY, priceTagX + priceTagWidth, priceTagY);
  priceGradient.addColorStop(0, '#0fbf6d');
  priceGradient.addColorStop(0.5, '#15cbb7');
  priceGradient.addColorStop(1, '#2563eb');
  ctx.fillStyle = priceGradient;
  fillRoundedRect(ctx, priceTagX, priceTagY, priceTagWidth, priceTagHeight, 32);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px "Inter", system-ui, -apple-system';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${input.priceXAF.toLocaleString()} XAF`, priceTagX + priceTagWidth / 2, priceTagY + priceTagHeight / 2 + 2);

  const brandTagWidth = 200;
  const brandTagHeight = 60;
  const brandTagX = (CANVAS_SIZE - brandTagWidth) / 2;
  const brandTagY = CANVAS_SIZE - brandTagHeight - 48;
  const brandGradient = ctx.createLinearGradient(brandTagX, brandTagY, brandTagX + brandTagWidth, brandTagY);
  brandGradient.addColorStop(0, '#1d4ed8');
  brandGradient.addColorStop(0.5, '#2563eb');
  brandGradient.addColorStop(1, '#1d4ed8');
  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.35)';
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = brandGradient;
  fillRoundedRect(ctx, brandTagX, brandTagY, brandTagWidth, brandTagHeight, 24);
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 26px "Inter", system-ui, -apple-system';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ProListapp.com', brandTagX + brandTagWidth / 2, brandTagY + brandTagHeight / 2 + 2);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to export share image'));
      }
    }, 'image/jpeg', 0.92);
  });
};

export const createShareFileName = (title: string) => `${slugify(title)}.jpg`;
