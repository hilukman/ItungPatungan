
import { Friend, PaymentDetails, ReceiptItem } from '../types';
import { Translation } from '../translations';

export interface BreakdownItem {
  friend: Friend;
  items: { name: string; share: number; splitCount: number; quantity: number }[];
  subtotal: number;
  taxAmount: number;
  serviceAmount: number;
  deliveryFeeAmount: number;
  discountAmount: number;
  total: number;
}

interface DrawConfig {
  items: ReceiptItem[];
  friends: Friend[];
  tax: number;
  service: number;
  deliveryFee: number;
  discount: number;
  currency: string;
  paymentDetails: PaymentDetails;
  locale: string;
  useDecimals: boolean;
  t: Translation;
  breakdown: BreakdownItem[];
}

// Configuration for layout/styles
const LAYOUT = {
  width: 600,
  padding: 40,
  headerHeight: 160,
  footerHeight: 80,
  paymentBoxHeight: 220,
  zigzagHeight: 12,
  fonts: {
    header: 'bold 48px Inter, sans-serif',
    date: '500 20px Inter, sans-serif',
    friendName: 'bold 28px Inter, sans-serif',
    item: '500 20px Inter, sans-serif',
    subItem: '500 18px Inter, sans-serif',
    totalLabel: 'bold 24px Inter, sans-serif',
    paymentTitle: 'bold 16px Inter, sans-serif',
    bankName: 'bold 28px Inter, sans-serif',
    accNumber: 'bold 32px Inter, sans-serif',
    accName: '600 20px Inter, sans-serif',
    footer: '500 16px Inter, sans-serif'
  },
  colors: {
    textDark: '#111827',
    textGray: '#6B7280',
    textLight: '#9CA3AF',
    divider: '#D1D5DB',
    paymentBoxBg: '#ECFCCB',
    paymentBoxBorder: '#84CC16',
    paymentTitle: '#3F6212',
    accent: '#75a968'
  }
};

/**
 * Distributes a total amount among recipients based on weights using the Largest Remainder Method.
 * This ensures the sum of distributed amounts equals the total exactly.
 */
const distributeAmount = (total: number, weights: number[], precision: number = 2): number[] => {
    if (weights.length === 0) return [];
    if (total === 0) return new Array(weights.length).fill(0);

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    if (totalWeight === 0) return new Array(weights.length).fill(0);

    const multiplier = Math.pow(10, precision);
    const totalCents = Math.round(total * multiplier);
    
    const distributedCents: number[] = [];
    const remainders: { index: number; val: number }[] = [];
    let currentSum = 0;

    weights.forEach((weight, index) => {
        const rawShare = totalCents * (weight / totalWeight);
        const baseShare = Math.floor(rawShare);
        distributedCents[index] = baseShare;
        currentSum += baseShare;
        remainders.push({ index, val: rawShare - baseShare });
    });

    let diff = totalCents - currentSum;
    
    // Distribute the remaining 'cents' to those with the largest remainders
    remainders.sort((a, b) => b.val - a.val);
    
    for (let i = 0; i < diff; i++) {
        distributedCents[remainders[i].index] += 1;
    }

    return distributedCents.map(cents => cents / multiplier);
};

export const calculateBreakdown = (
  items: ReceiptItem[],
  friends: Friend[],
  totalTaxAmount: number,
  totalServiceAmount: number,
  totalDeliveryFeeAmount: number,
  totalDiscountAmount: number,
  useDecimals: boolean = true
): BreakdownItem[] => {
  const precision = useDecimals ? 2 : 0;

  // 1. Calculate Friend Subtotals (Weights)
  const friendData = friends.map(friend => {
    // Find items assigned to this friend
    const assignedItems = items.filter(item => item.assignedTo.includes(friend.id));
    
    // Calculate share per item
    const itemDetails = assignedItems.map(item => {
      const splitCount = Math.max(1, item.assignedTo.length);
      const share = item.price / splitCount;
      return {
        name: item.name,
        share,
        splitCount,
        quantity: item.quantity
      };
    });

    const subtotal = itemDetails.reduce((sum, i) => sum + i.share, 0);

    return {
        friend,
        items: itemDetails,
        subtotal
    };
  });

  const subtotals = friendData.map(f => f.subtotal);

  // 2. Distribute Tax, Service, Delivery, and Discount proportionally
  const taxShares = distributeAmount(totalTaxAmount, subtotals, precision);
  const serviceShares = distributeAmount(totalServiceAmount, subtotals, precision);
  const deliveryFeeShares = distributeAmount(totalDeliveryFeeAmount, subtotals, precision);
  const discountShares = distributeAmount(totalDiscountAmount, subtotals, precision);

  // 3. Construct Final Breakdown
  return friendData.map((data, index) => {
      const taxAmount = taxShares[index];
      const serviceAmount = serviceShares[index];
      const deliveryFeeAmount = deliveryFeeShares[index];
      const discountAmount = discountShares[index];
      
      // Total = Subtotal + Tax + Service + Delivery - Discount
      const total = Math.max(0, data.subtotal + taxAmount + serviceAmount + deliveryFeeAmount - discountAmount);

      return {
          friend: data.friend,
          items: data.items,
          subtotal: data.subtotal,
          taxAmount,
          serviceAmount,
          deliveryFeeAmount,
          discountAmount,
          total
      };
  });
};

export const drawReceiptToCanvas = (
  canvas: HTMLCanvasElement, 
  config: DrawConfig
): string | null => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const { breakdown, currency, locale, useDecimals, paymentDetails, t } = config;

  // Formatter helper
  const fmt = (num: number) => {
    try {
      return num.toLocaleString(locale, { 
        minimumFractionDigits: useDecimals ? 2 : 0, 
        maximumFractionDigits: useDecimals ? 2 : 0 
      });
    } catch {
      return num.toFixed(useDecimals ? 2 : 0);
    }
  };

  const getDateStr = () => {
    try {
      return new Date().toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return new Date().toDateString();
    }
  };

  // 1. Calculate Dynamic Height
  let contentHeight = 20; 
  breakdown.forEach(b => {
    contentHeight += 50; // Friend Header
    contentHeight += b.items.length * 32; // Items
    contentHeight += 20; // Divider space
    contentHeight += 30; // Subtotal
    if (b.taxAmount > 0) contentHeight += 30;
    if (b.serviceAmount > 0) contentHeight += 30;
    if (b.deliveryFeeAmount > 0) contentHeight += 30;
    if (b.discountAmount > 0) contentHeight += 30;
    contentHeight += 40; // Total Line
  });

  const totalHeight = LAYOUT.headerHeight + contentHeight + LAYOUT.paymentBoxHeight + LAYOUT.footerHeight;

  // 2. Clear & Resize
  canvas.width = LAYOUT.width;
  canvas.height = totalHeight;
  ctx.clearRect(0, 0, LAYOUT.width, totalHeight);

  // 3. Draw Paper Background (Custom Shape)
  drawPaperBackground(ctx, LAYOUT.width, totalHeight);

  // 4. Header
  drawHeader(ctx, LAYOUT.width, t, getDateStr());

  // 5. Content Loop
  let currentY = 180;
  breakdown.forEach(b => {
    currentY = drawFriendSection(ctx, b, currentY, LAYOUT.width, fmt, currency, t);
  });

  // 6. Payment Box
  drawPaymentBox(ctx, currentY + 10, LAYOUT.width, paymentDetails, t);

  // 7. Footer
  drawFooter(ctx, totalHeight, LAYOUT.width, t);

  return canvas.toDataURL('image/png');
};

// --- Sub-Drawing Functions ---

const drawPaperBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const notchY = 150; // Aligned with header dashed line
  const notchRadius = 12;
  const cornerRadius = 20;

  ctx.beginPath();
  
  // Top Left Corner (Rounded)
  ctx.moveTo(0, cornerRadius);
  ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
  
  // Top Edge
  ctx.lineTo(width - cornerRadius, 0);
  
  // Top Right Corner (Rounded)
  ctx.quadraticCurveTo(width, 0, width, cornerRadius);
  
  // Right Edge down to Notch
  ctx.lineTo(width, notchY - notchRadius);
  
  // Right Notch (Inward Semicircle)
  ctx.arc(width, notchY, notchRadius, -Math.PI / 2, Math.PI / 2, true);
  
  // Right Edge to Bottom
  ctx.lineTo(width, height - LAYOUT.zigzagHeight);
  
  // Bottom Zigzag
  const step = 20;
  for (let x = width; x > 0; x -= step) {
    ctx.lineTo(x - step / 2, height);
    ctx.lineTo(x - step, height - LAYOUT.zigzagHeight);
  }
  
  // Left Edge up to Notch
  ctx.lineTo(0, notchY + notchRadius);
  
  // Left Notch (Inward Semicircle)
  ctx.arc(0, notchY, notchRadius, Math.PI / 2, -Math.PI / 2, true);
  
  // Left Edge to Top
  ctx.lineTo(0, cornerRadius);
  
  ctx.closePath();
  
  // Fill with Gradient
  const grd = ctx.createLinearGradient(0, 0, 0, height);
  grd.addColorStop(0, "#ffffff");
  grd.addColorStop(1, "#f9fafb");
  ctx.fillStyle = grd;
  ctx.fill();
};

const drawHeader = (ctx: CanvasRenderingContext2D, width: number, t: Translation, dateStr: string) => {
  ctx.fillStyle = LAYOUT.colors.textDark; 
  ctx.font = LAYOUT.fonts.header; 
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillText(t.billSummary, width / 2, 50);

  ctx.fillStyle = LAYOUT.colors.textGray;
  ctx.font = LAYOUT.fonts.date;
  ctx.fillText(dateStr, width / 2, 110);

  // Dashed Line (Aligned with Notches at Y=150)
  ctx.beginPath();
  ctx.strokeStyle = LAYOUT.colors.divider;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.moveTo(LAYOUT.padding, 150);
  ctx.lineTo(width - LAYOUT.padding, 150);
  ctx.stroke();
  ctx.setLineDash([]);
};

const drawFriendSection = (
  ctx: CanvasRenderingContext2D, 
  b: BreakdownItem, 
  startY: number, 
  width: number, 
  fmt: (n: number) => string, 
  currency: string,
  t: Translation
): number => {
  let currentY = startY;

  // Friend Header
  ctx.textAlign = 'left';
  ctx.fillStyle = b.friend.color;
  ctx.beginPath();
  ctx.arc(LAYOUT.padding + 10, currentY + 10, 10, 0, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = LAYOUT.colors.textDark;
  ctx.font = LAYOUT.fonts.friendName;
  ctx.fillText(b.friend.name, LAYOUT.padding + 35, currentY - 5);
  
  currentY += 45;

  // Items
  ctx.font = LAYOUT.fonts.item;
  ctx.fillStyle = '#4B5563'; 
  
  b.items.forEach(item => {
    ctx.textAlign = 'left';
    
    // Construct item name string with quantity if needed
    let itemName = item.name;
    
    // Add quantity prefix if > 1
    if (item.quantity > 1) {
       itemName = `${item.quantity}x ${itemName}`;
    }
    
    // Add split indicator if needed
    if (item.splitCount > 1) {
        itemName = `${itemName} (1/${item.splitCount})`;
    }
    
    // Truncate logic
    const maxNameWidth = 350;
    if (ctx.measureText(itemName).width > maxNameWidth) {
        let truncated = itemName;
        while (ctx.measureText(truncated + '...').width > maxNameWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
        }
        itemName = truncated + '...';
    }

    ctx.fillText(itemName, LAYOUT.padding + 35, currentY);

    ctx.textAlign = 'right';
    ctx.fillText(fmt(item.share), width - LAYOUT.padding, currentY);
    
    currentY += 32;
  });

  // Divider
  currentY += 10;
  ctx.beginPath();
  ctx.strokeStyle = '#F3F4F6';
  ctx.setLineDash([4, 4]);
  ctx.moveTo(LAYOUT.padding + 35, currentY);
  ctx.lineTo(width - LAYOUT.padding, currentY);
  ctx.stroke();
  ctx.setLineDash([]);
  currentY += 20;

  // Details
  ctx.font = LAYOUT.fonts.subItem;
  ctx.fillStyle = LAYOUT.colors.textLight;
  
  const drawRow = (label: string, amount: number) => {
    ctx.textAlign = 'left';
    ctx.fillText(label, LAYOUT.padding + 35, currentY);
    ctx.textAlign = 'right';
    ctx.fillText(fmt(amount), width - LAYOUT.padding, currentY);
    currentY += 30;
  };

  drawRow(t.subtotal, b.subtotal);
  if (b.taxAmount > 0) drawRow(t.tax, b.taxAmount);
  if (b.serviceAmount > 0) drawRow(t.service, b.serviceAmount);
  if (b.deliveryFeeAmount > 0) drawRow(t.deliveryFee, b.deliveryFeeAmount);
  if (b.discountAmount > 0) drawRow(t.discount, b.discountAmount);

  // Total
  currentY += 5;
  ctx.font = LAYOUT.fonts.totalLabel;
  ctx.fillStyle = '#374151';
  ctx.textAlign = 'left';
  ctx.fillText(t.total, LAYOUT.padding + 35, currentY);
  ctx.textAlign = 'right';
  const totalStr = `${currency} ${fmt(b.total)}`;
  ctx.fillText(totalStr, width - LAYOUT.padding, currentY);
  
  return currentY + 40; // Spacing after section
};

const drawPaymentBox = (
  ctx: CanvasRenderingContext2D, 
  boxY: number, 
  width: number, 
  paymentDetails: PaymentDetails, 
  t: Translation
) => {
  ctx.fillStyle = LAYOUT.colors.paymentBoxBg;
  
  // Round Rect Polyfill Logic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctxAny = ctx as any;
  ctx.beginPath();
  if (typeof ctxAny.roundRect === 'function') {
      ctxAny.roundRect(LAYOUT.padding, boxY, width - (LAYOUT.padding * 2), LAYOUT.paymentBoxHeight, 24);
  } else {
      ctx.rect(LAYOUT.padding, boxY, width - (LAYOUT.padding * 2), LAYOUT.paymentBoxHeight);
  }
  ctx.fill();
  
  ctx.strokeStyle = LAYOUT.colors.paymentBoxBorder;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = 'center';
  
  ctx.fillStyle = LAYOUT.colors.paymentTitle;
  ctx.font = LAYOUT.fonts.paymentTitle;
  ctx.fillText(t.sendPaymentTo, width / 2, boxY + 30);

  ctx.fillStyle = LAYOUT.colors.textDark;
  ctx.font = LAYOUT.fonts.bankName;
  ctx.fillText(paymentDetails.bankName, width / 2, boxY + 65);
  
  ctx.font = LAYOUT.fonts.accNumber;
  ctx.fillText(paymentDetails.accountNumber, width / 2, boxY + 105);

  ctx.fillStyle = '#4B5563';
  ctx.font = LAYOUT.fonts.accName;
  ctx.fillText(paymentDetails.accountName.toUpperCase(), width / 2, boxY + 145);
};

const drawFooter = (ctx: CanvasRenderingContext2D, height: number, width: number, t: Translation) => {
  ctx.fillStyle = LAYOUT.colors.textLight;
  ctx.font = LAYOUT.fonts.footer;
  ctx.textAlign = 'center';
  ctx.fillText(t.splitWith, width / 2, height - 35);
};
