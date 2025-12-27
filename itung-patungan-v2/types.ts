
export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  assignedTo: string[]; // Array of friend IDs
}

export interface Friend {
  id: string;
  name: string;
  color: string; // Hex color for UI differentiation
}

export interface PaymentDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface BillState {
  items: ReceiptItem[];
  friends: Friend[];
  subtotal: number;
  taxAmount: number;
  serviceAmount: number;
  deliveryFeeAmount: number;
  discountAmount: number;
  currency: string;
  paymentDetails: PaymentDetails;
}

export type ViewState = 'upload' | 'edit' | 'assign' | 'payment' | 'summary';

export const BANK_OPTIONS = [
  "BCA", "Bank Mandiri", "BRI", "BNI", "BTN", "BSI", "OCBC", "HSBC", 
  "CIMB Niaga", "Danamon", "Bank Permata", "Bank Jago", "Jenius", 
  "Gopay", "Shopeepay", "OVO", "Dana", "Other"
];

export const COLORS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#EAB308", // Yellow
  "#84CC16", // Lime
  "#22C55E", // Green
  "#10B981", // Emerald
  "#14B8A6", // Teal
  "#06B6D4", // Cyan
  "#0EA5E9", // Sky
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#A855F7", // Purple
  "#D946EF", // Fuchsia
  "#EC4899", // Pink
  "#F43F5E", // Rose
  "#64748B", // Slate
  "#78716C", // Stone
  "#4B5563", // Gray
];

export interface CurrencyOption {
  country: string;
  code: string;
  symbol: string;
  locale: string;
  defaultDecimals: boolean;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { country: "China", code: "CNY", symbol: "¥", locale: "zh-CN", defaultDecimals: true },
  { country: "Germany", code: "EUR", symbol: "€", locale: "de-DE", defaultDecimals: true },
  { country: "India", code: "INR", symbol: "₹", locale: "en-IN", defaultDecimals: true },
  { country: "Indonesia", code: "IDR", symbol: "Rp", locale: "id-ID", defaultDecimals: false },
  { country: "Japan", code: "JPY", symbol: "¥", locale: "ja-JP", defaultDecimals: false },
  { country: "Malaysia", code: "MYR", symbol: "RM", locale: "ms-MY", defaultDecimals: true },
  { country: "Netherlands", code: "EUR", symbol: "€", locale: "nl-NL", defaultDecimals: true },
  { country: "Philippines", code: "PHP", symbol: "₱", locale: "en-PH", defaultDecimals: true },
  { country: "Russia", code: "RUB", symbol: "₽", locale: "ru-RU", defaultDecimals: true },
  { country: "Singapore", code: "SGD", symbol: "S$", locale: "en-SG", defaultDecimals: true },
  { country: "South Korea", code: "KRW", symbol: "₩", locale: "ko-KR", defaultDecimals: false },
  { country: "Thailand", code: "THB", symbol: "฿", locale: "th-TH", defaultDecimals: true },
  { country: "United Arab Emirates", code: "AED", symbol: "AED", locale: "en-AE", defaultDecimals: true },
  { country: "United Kingdom", code: "GBP", symbol: "£", locale: "en-GB", defaultDecimals: true },
  { country: "United States", code: "USD", symbol: "$", locale: "en-US", defaultDecimals: true },
  { country: "Vietnam", code: "VND", symbol: "₫", locale: "vi-VN", defaultDecimals: false },
].sort((a, b) => a.country.localeCompare(b.country));
