
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ReceiptItem, Friend, PaymentDetails } from '../types';
import { Translation } from '../translations';
import { calculateBreakdown, drawReceiptToCanvas, BreakdownItem } from '../utils/receiptDrawer';

interface UseReceiptCanvasProps {
  items: ReceiptItem[];
  friends: Friend[];
  tax: number; // This is now taxAmount
  service: number; // This is now serviceAmount
  deliveryFee: number; // This is deliveryFeeAmount
  discount: number; // This is discountAmount
  currency: string;
  paymentDetails: PaymentDetails;
  locale: string;
  useDecimals: boolean;
  t: Translation;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const useReceiptCanvas = ({
  items, friends, tax, service, deliveryFee, discount, currency, paymentDetails, locale, useDecimals, t, canvasRef
}: UseReceiptCanvasProps) => {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  const breakdown = useMemo<BreakdownItem[]>(() => {
    // Pass absolute tax/service/discount amounts
    return calculateBreakdown(items, friends, tax, service, deliveryFee, discount, useDecimals);
  }, [items, friends, tax, service, deliveryFee, discount, useDecimals]);

  const generate = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Slight timeout to ensure fonts and DOM are ready
    setTimeout(() => {
        const image = drawReceiptToCanvas(canvasRef.current!, {
            items,
            friends,
            tax,
            service,
            deliveryFee,
            discount,
            currency,
            paymentDetails,
            locale,
            useDecimals,
            t,
            breakdown
        });
        setGeneratedImage(image);
    }, 100);
  }, [canvasRef, items, friends, tax, service, deliveryFee, discount, currency, paymentDetails, locale, useDecimals, t, breakdown]);

  // Auto-generate when dependencies change
  useEffect(() => {
      // Debounce slightly to prevent flicker on quick changes
      const timer = setTimeout(generate, 500);
      return () => clearTimeout(timer);
  }, [generate]);

  return {
    generatedImage,
    breakdown,
    generate // Expose if manual trigger needed
  };
};
