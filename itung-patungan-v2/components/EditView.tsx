
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, ArrowRight, Settings2, Globe } from 'lucide-react';
import { ReceiptItem, CURRENCY_OPTIONS } from '../types';
import { Translation } from '../translations';
import { Footnote } from './UploadView';

interface EditViewProps {
  items: ReceiptItem[];
  currency: string;
  setCurrency: (c: string) => void;
  tax: number;
  service: number;
  deliveryFee: number;
  discount: number;
  setItems: React.Dispatch<React.SetStateAction<ReceiptItem[]>>;
  setTax: (val: number) => void;
  setService: (val: number) => void;
  setDeliveryFee: (val: number) => void;
  setDiscount: (val: number) => void;
  onNext: () => void;
  locale: string;
  setLocale: (l: string) => void;
  useDecimals: boolean;
  setUseDecimals: (b: boolean) => void;
  t: Translation;
}

const QuantityInput: React.FC<{
  value: number;
  onChange: (val: number) => void;
  className?: string;
  ariaLabel?: string;
}> = ({ value, onChange, className, ariaLabel }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  useEffect(() => {
    setIsAnimating(true);
    const t = setTimeout(() => setIsAnimating(false), 200);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <input
      aria-label={ariaLabel || "Quantity"}
      type="number"
      min="1"
      value={value}
      onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
      className={`${className} transition-all duration-200 ${isAnimating ? 'scale-125 text-[#75a968]' : 'scale-100'}`}
    />
  );
};

const AutoResizeTextarea: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  onEnter?: () => void;
}> = ({ value, onChange, placeholder, className, ariaLabel, onEnter }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (onEnter) onEnter();
      else e.currentTarget.blur();
    }
  };
  return (
    <textarea
      ref={textareaRef}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      rows={1}
      className={`${className} resize-none overflow-hidden block`}
    />
  );
};

const PriceInput: React.FC<{
  value: number;
  currency: string;
  onChange: (val: number) => void;
  placeholder?: string;
  className?: string;
  locale: string;
  useDecimals: boolean;
}> = ({ value, currency, onChange, placeholder, className, locale, useDecimals }) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const safeLocale = useMemo(() => {
    try { new Intl.NumberFormat(locale); return locale; } catch { return 'en-US'; }
  }, [locale]);
  const separators = useMemo(() => {
    try {
        const parts = new Intl.NumberFormat(safeLocale).formatToParts(10000.1);
        const decimalPart = parts.find(p => p.type === 'decimal');
        const groupPart = parts.find(p => p.type === 'group');
        return { decimal: decimalPart ? decimalPart.value : '.', thousand: groupPart ? groupPart.value : ',' };
    } catch (e) { return { decimal: '.', thousand: ',' }; }
  }, [safeLocale]);
  const { decimal, thousand } = separators;
  useEffect(() => {
    const options: Intl.NumberFormatOptions = { minimumFractionDigits: useDecimals ? 2 : 0, maximumFractionDigits: useDecimals ? 2 : 0 };
    if (value === 0 && displayValue === '' && placeholder) return;
    try {
        const formatted = value.toLocaleString(safeLocale, options);
        if (document.activeElement?.getAttribute('data-price-input') !== 'true') setDisplayValue(formatted);
    } catch (e) { setDisplayValue(value.toFixed(useDecimals ? 2 : 0)); }
    setIsAnimating(true);
    const t = setTimeout(() => setIsAnimating(false), 200);
    return () => clearTimeout(t);
  }, [value, safeLocale, useDecimals, placeholder]);
  const handleBlur = () => {
     const options: Intl.NumberFormatOptions = { minimumFractionDigits: useDecimals ? 2 : 0, maximumFractionDigits: useDecimals ? 2 : 0 };
    try { setDisplayValue(value.toLocaleString(safeLocale, options)); } catch (e) { setDisplayValue(value.toFixed(useDecimals ? 2 : 0)); }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let pattern = "[0-9\\s";
    if (useDecimals) pattern += escapeRegex(decimal);
    pattern += escapeRegex(thousand);
    pattern += "]*$";
    const validCharsRegex = new RegExp(`^${pattern}`);
    if (!validCharsRegex.test(input)) return;
    setDisplayValue(input);
    if (input === '') { onChange(0); return; }
    let rawStr = input;
    rawStr = rawStr.replace(/\s/g, '');
    if (thousand) rawStr = rawStr.split(thousand).join('');
    if (useDecimals && decimal) rawStr = rawStr.split(decimal).join('.');
    const numVal = parseFloat(rawStr);
    if (!isNaN(numVal)) { if (!useDecimals) onChange(Math.round(numVal)); else onChange(numVal); }
  };
  const textColorClass = className?.includes('text-red-500') ? 'text-red-500' : 'text-gray-800';
  return (
    <div className={`flex justify-end items-center ${className}`}>
        <input
            data-price-input="true"
            aria-label="Item Price"
            type="text"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`bg-transparent border-b-2 border-transparent focus:border-[#75a968] focus:bg-[#f5f5e9]/50 rounded px-0 transition-all duration-200 focus:outline-none text-lg md:text-xl font-bold ${textColorClass} text-right tabular-nums min-w-[3ch] ${isAnimating ? 'scale-110 !text-[#75a968]' : ''}`}
            style={{ width: `${Math.max(3, displayValue.length + 2)}ch` }} 
            inputMode={useDecimals ? "decimal" : "numeric"}
        />
    </div>
  );
};

const EditView: React.FC<EditViewProps> = ({ 
  items, currency, setCurrency, tax, service, deliveryFee, discount, setItems, setTax, setService, setDeliveryFee, setDiscount, onNext,
  locale, setLocale, useDecimals, setUseDecimals, t
}) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [showFormatSettings, setShowFormatSettings] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const safeLocale = useMemo(() => {
    try { new Intl.NumberFormat(locale); return locale; } catch { return 'en-US'; }
  }, [locale]);

  const handleUpdateItem = (id: string, field: 'name' | 'price' | 'quantity', value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
          if (field === 'quantity') return { ...item, quantity: Math.max(1, Math.round(Number(value))) };
          return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const confirmDelete = (id: string) => setItemToDelete(id);
  const executeDelete = () => {
    if (itemToDelete) { setItems(prev => prev.filter(item => item.id !== itemToDelete)); setItemToDelete(null); }
  };

  const handleAddItem = () => {
    if (!newItemName || newItemPrice <= 0) return;
    const newItem: ReceiptItem = { id: `manual-${Date.now()}`, name: newItemName, price: newItemPrice, quantity: Math.max(1, newItemQuantity), assignedTo: [] };
    setItems([...items, newItem]);
    setNewItemName(''); setNewItemPrice(0); setNewItemQuantity(1);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const option = CURRENCY_OPTIONS.find(c => c.code === e.target.value);
    if (option) { setCurrency(option.symbol); setLocale(option.locale); setUseDecimals(option.defaultDecimals); }
  };

  const currentOption = CURRENCY_OPTIONS.find(c => c.locale === locale) || CURRENCY_OPTIONS[0];
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const grandTotal = Math.max(0, subtotal + tax + service + deliveryFee - discount);

  return (
    <div className="space-y-4 md:space-y-8 pb-8 md:h-full">
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-pop-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-6 border border-[#e2e9d4]">
            <h3 className="text-xl font-extrabold text-[#3a5a31] text-center">{t.deleteItem}</h3>
            <div className="flex space-x-3">
              <button onClick={() => setItemToDelete(null)} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">{t.cancel}</button>
              <button onClick={executeDelete} className="flex-1 py-3 font-bold bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition-transform active:scale-95">{t.delete}</button>
            </div>
          </div>
        </div>
      )}

      <div className="md:grid md:grid-cols-12 md:gap-20 md:h-full">
        <div className="md:col-span-7 space-y-4 md:space-y-6">
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <h2 className="text-2xl md:text-4xl font-extrabold text-[#3a5a31]">{t.checkList}</h2>
                    <p className="text-gray-500 font-medium md:text-xl">{t.catchEverything}</p>
                </div>
                <button onClick={() => setShowFormatSettings(!showFormatSettings)} className={`p-2 md:p-3 rounded-xl transition-colors ${showFormatSettings ? 'bg-[#75a968] text-white' : 'bg-[#e2e9d4] text-[#3a5a31]'}`}>
                    <Settings2 size={20} className="md:w-6 md:h-6" />
                </button>
            </div>

            {showFormatSettings && (
                <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-[#e2e9d4] space-y-4 animate-pop-in">
                    <h3 className="text-sm md:text-base font-bold text-[#3a5a31] uppercase tracking-wider">{t.formatSettings}</h3>
                    <div className="flex flex-col space-y-3">
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm md:text-base font-medium text-gray-600 mb-1"><Globe size={16} /><span className="ml-1">{t.currencyRegion}</span></div>
                            <select value={currentOption.code} onChange={handleCurrencyChange} className="w-full p-2 md:p-3 bg-[#f5f5e9] border border-[#e2e9d4] rounded-xl text-sm md:text-base font-bold text-gray-800 focus:outline-none focus:border-[#75a968]">
                                {CURRENCY_OPTIONS.map(opt => <option key={opt.code} value={opt.code}>{opt.country} ({opt.code} - {opt.symbol})</option>)}
                            </select>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
                            <span className="text-sm md:text-base font-medium text-gray-600">{t.showDecimals}</span>
                            <button onClick={() => setUseDecimals(!useDecimals)} className={`w-12 h-6 md:w-14 md:h-7 rounded-full transition-colors relative ${useDecimals ? 'bg-[#75a968]' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 md:top-1.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${useDecimals ? 'left-7 md:left-8' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-3 md:space-y-4">
                {items.map((item, index) => (
                <div key={item.id} className="flex items-start gap-3 bg-white p-4 md:p-5 rounded-2xl md:rounded-[1.5rem] shadow-sm border border-[#e2e9d4] animate-pop-in group" style={{ animationDelay: `${index * 0.05}s` }}>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#f5f5e9] flex items-center justify-center text-[#75a968] font-bold text-xs md:text-sm shrink-0 mt-1">{index + 1}</div>
                    <div className="flex-1 flex flex-col gap-3 min-w-0">
                        <div className="w-full">
                            <AutoResizeTextarea value={item.name} onChange={(val) => handleUpdateItem(item.id, 'name', val)} className="bg-transparent border-b-2 border-transparent focus:border-[#75a968] focus:bg-[#f5f5e9]/50 rounded px-1 transition-colors focus:outline-none text-lg md:text-xl font-bold text-gray-800 w-full whitespace-normal break-words leading-tight" placeholder="Item name" />
                            {item.quantity > 1 && <span className="block mt-1 text-xs md:text-sm font-medium text-gray-400 px-1">@ {currency} {(item.price / item.quantity).toLocaleString(safeLocale, { minimumFractionDigits: useDecimals ? 2 : 0, maximumFractionDigits: useDecimals ? 2 : 0 })}</span>}
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center h-8 md:h-10 shrink-0"><span className="text-gray-400 font-bold mr-1 text-sm md:text-base select-none">x</span><QuantityInput value={item.quantity} onChange={(val) => handleUpdateItem(item.id, 'quantity', val)} className="w-8 md:w-10 text-center bg-transparent focus:outline-none text-lg md:text-xl font-extrabold text-[#3a5a31] border-b border-transparent focus:border-[#75a968] transition-colors p-0" /></div>
                            <div className="flex items-center gap-3 md:gap-4"><div className="flex justify-end items-center gap-0.5 min-w-[60px] shrink-0 cursor-text" onClick={(e) => e.currentTarget.querySelector('input')?.focus()}><span className="text-sm md:text-base text-gray-400 font-bold mt-[4px] select-none">{currency}</span><PriceInput value={item.price} currency={currency} onChange={(val) => handleUpdateItem(item.id, 'price', val)} locale={safeLocale} useDecimals={useDecimals} /></div><button onClick={() => confirmDelete(item.id)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 md:p-3 rounded-xl transition-colors shrink-0"><Trash2 size={20} /></button></div>
                        </div>
                    </div>
                </div>
                ))}

                <div className="flex items-start gap-3 bg-[#f5f5e9] p-4 md:p-5 rounded-2xl md:rounded-[1.5rem] border-2 border-dashed border-[#c4cca3] hover:border-[#75a968] transition-colors group">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 mt-1 opacity-50"><Plus size={20} className="text-[#3a5a31]" /></div>
                    <div className="flex-1 flex flex-col gap-3 min-w-0">
                        <div className="w-full"><AutoResizeTextarea value={newItemName} onChange={setNewItemName} placeholder={t.addItemPlaceholder} className="bg-transparent text-lg md:text-xl font-bold focus:outline-none placeholder:text-gray-400 placeholder:font-medium min-w-0 border-b-2 border-transparent focus:border-[#75a968] rounded px-1 transition-colors w-full whitespace-normal break-words leading-tight" onEnter={handleAddItem} /></div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center h-8 md:h-10 shrink-0"><span className="text-gray-400 font-bold mr-1 text-sm md:text-base select-none">x</span><QuantityInput value={newItemQuantity} onChange={setNewItemQuantity} className="w-8 md:w-10 text-center bg-transparent focus:outline-none text-lg md:text-xl font-extrabold text-[#3a5a31] border-b border-transparent focus:border-[#75a968] transition-colors p-0" /></div>
                            <div className="flex items-center gap-3 md:gap-4"><div className="flex justify-end items-center gap-0.5 min-w-[60px] shrink-0 cursor-text" onClick={(e) => e.currentTarget.querySelector('input')?.focus()}><span className={`text-sm md:text-base font-bold mt-[4px] select-none ${newItemPrice > 0 ? 'text-gray-400' : 'text-gray-300'}`}>{currency}</span><PriceInput value={newItemPrice} currency={currency} onChange={setNewItemPrice} placeholder="0" locale={safeLocale} useDecimals={useDecimals} /></div><button onClick={handleAddItem} disabled={!newItemName || newItemPrice <= 0} className="bg-[#75a968] text-white p-2 md:p-3 rounded-xl disabled:opacity-50 hover:scale-105 transition-transform shadow-sm shrink-0"><Plus size={20} /></button></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="md:col-span-5 md:flex md:flex-col md:justify-between">
            <div className="bg-white p-5 md:p-8 rounded-3xl shadow-[4px_4px_0px_rgba(226,233,212,1)] border border-[#e2e9d4] space-y-4 md:space-y-6 mt-8 md:mt-0">
                <div className="flex justify-between items-center w-full">
                    <label className="text-sm md:text-lg font-bold text-gray-600">{t.tax}</label>
                    <div className="flex items-center justify-between p-2 md:p-3 bg-gray-50 border-2 border-[#f5f5e9] rounded-xl focus-within:border-[#75a968] transition-colors w-36 md:w-48 cursor-text overflow-hidden" onClick={(e) => e.currentTarget.querySelector('input')?.focus()}>
                        <span className="text-xs md:text-sm text-gray-400 font-bold select-none">{currency}</span>
                        <PriceInput value={tax} currency={currency} onChange={setTax} locale={safeLocale} useDecimals={useDecimals} className="!w-auto" />
                    </div>
                </div>
                <div className="flex justify-between items-center w-full">
                    <label className="text-sm md:text-lg font-bold text-gray-600">{t.service}</label>
                    <div className="flex items-center justify-between p-2 md:p-3 bg-gray-50 border-2 border-[#f5f5e9] rounded-xl focus-within:border-[#75a968] transition-colors w-36 md:w-48 cursor-text overflow-hidden" onClick={(e) => e.currentTarget.querySelector('input')?.focus()}>
                        <span className="text-xs md:text-sm text-gray-400 font-bold select-none">{currency}</span>
                        <PriceInput value={service} currency={currency} onChange={setService} locale={safeLocale} useDecimals={useDecimals} className="!w-auto" />
                    </div>
                </div>
                <div className="flex justify-between items-center w-full">
                    <label className="text-sm md:text-lg font-bold text-gray-600">{t.deliveryFee}</label>
                    <div className="flex items-center justify-between p-2 md:p-3 bg-gray-50 border-2 border-[#f5f5e9] rounded-xl focus-within:border-[#75a968] transition-colors w-36 md:w-48 cursor-text overflow-hidden" onClick={(e) => e.currentTarget.querySelector('input')?.focus()}>
                        <span className="text-xs md:text-sm text-gray-400 font-bold select-none">{currency}</span>
                        <PriceInput value={deliveryFee} currency={currency} onChange={setDeliveryFee} locale={safeLocale} useDecimals={useDecimals} className="!w-auto" />
                    </div>
                </div>
                <div className="flex justify-between items-center w-full">
                    <label className="text-sm md:text-lg font-bold text-gray-600">{t.discount}</label>
                    <div className="flex items-center justify-between p-2 md:p-3 bg-gray-50 border-2 border-[#f5f5e9] rounded-xl focus-within:border-[#75a968] transition-colors w-36 md:w-48 cursor-text overflow-hidden" onClick={(e) => e.currentTarget.querySelector('input')?.focus()}>
                        <span className="text-xs md:text-sm text-gray-400 font-bold select-none">{currency}</span>
                        <PriceInput value={discount} currency={currency} onChange={setDiscount} locale={safeLocale} useDecimals={useDecimals} className="!w-auto text-red-500" />
                    </div>
                </div>
                <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
                    <span className="font-bold text-gray-900 text-lg md:text-2xl shrink-0">{t.total}</span>
                    <div className="text-right min-w-0 flex flex-col items-end">
                        <span className="font-extrabold text-[#75a968] text-2xl md:text-4xl break-all leading-tight">{currency} {grandTotal.toLocaleString(safeLocale, { minimumFractionDigits: useDecimals ? 2 : 0, maximumFractionDigits: useDecimals ? 2 : 0 })}</span>
                    </div>
                </div>
            </div>

            <div className="w-full mt-12 pt-8">
                <button onClick={onNext} className="w-full flex items-center justify-center space-x-2 bg-[#e2e9d4] text-[#3a5a31] font-bold text-lg md:text-xl py-4 md:py-6 rounded-2xl btn-3d mb-8">
                  <span>{t.looksGood}</span>
                  <ArrowRight size={24} className="md:w-8 md:h-8" />
                </button>
                <Footnote />
            </div>
        </div>
      </div>
    </div>
  );
};

export default EditView;
