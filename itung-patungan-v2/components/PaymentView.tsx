
import React, { useState, useRef } from 'react';
import { ArrowRight, CreditCard, User } from 'lucide-react';
import { PaymentDetails, BANK_OPTIONS } from '../types';
import { Translation } from '../translations';
import { Footnote } from './UploadView';

interface PaymentViewProps {
  details: PaymentDetails;
  setDetails: React.Dispatch<React.SetStateAction<PaymentDetails>>;
  onNext: () => void;
  t: Translation;
}

const PaymentView: React.FC<PaymentViewProps> = ({ details, setDetails, onNext, t }) => {
  const handleChange = (field: keyof PaymentDetails, value: string) => {
    setDetails(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="pb-8 md:h-full">
      <div className="md:grid md:grid-cols-12 md:gap-16 md:items-center md:min-h-[60vh]">
        <div className="space-y-1 md:space-y-6 md:col-span-5 animate-pop-in mb-8 md:mb-0 text-left">
          <h2 className="text-2xl md:text-5xl font-extrabold text-[#3a5a31] leading-tight">{t.whereToSend}</h2>
          <p className="text-gray-500 font-medium md:text-2xl leading-relaxed">{t.detailsCopy}</p>
        </div>

        <div className="md:col-span-7 animate-pop-in" style={{ animationDelay: '0.1s' }}>
          <div className="bg-gradient-to-br from-[#75a968] to-[#5a8251] p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-xl text-white relative overflow-hidden w-full mx-auto transform transition-transform hover:scale-[1.01] duration-300">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
            <div className="relative z-10 space-y-5 md:space-y-8">
                <div className="flex justify-between items-center mb-2">
                    <CreditCard className="text-white/80 md:w-12 md:h-12" size={32} />
                    <span className="font-mono text-white/60 text-sm md:text-base tracking-widest">{t.paymentDetails.toUpperCase()}</span>
                </div>
                <div className="space-y-1">
                <label className="text-xs md:text-sm font-bold text-white/70 uppercase tracking-wider">{t.bankWallet}</label>
                <div className="relative">
                    <select value={details.bankName} onChange={(e) => handleChange('bankName', e.target.value)} className="w-full p-2 md:p-4 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/50 focus:bg-white/30 focus:outline-none font-medium appearance-none md:text-xl transition-colors cursor-pointer">
                        <option value="" disabled className="text-gray-500">Select...</option>
                        {BANK_OPTIONS.map(opt => <option key={opt} value={opt} className="text-gray-900">{opt}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 md:px-4 pointer-events-none text-white/70"><svg className="w-4 h-4 md:w-5 md:h-5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg></div>
                </div>
                {details.bankName === 'Other' && <input type="text" placeholder="Bank Name" className="w-full mt-2 p-2 md:p-4 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/50 focus:bg-white/30 focus:outline-none md:text-xl animate-pop-in" onChange={(e) => handleChange('bankName', e.target.value)} />}
                </div>
                <div className="space-y-1"><label className="text-xs md:text-sm font-bold text-white/70 uppercase tracking-wider">{t.accNumber}</label><input type="text" value={details.accountNumber} onChange={(e) => handleChange('accountNumber', e.target.value)} placeholder="0000 0000 0000" className="w-full p-2 md:p-4 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/50 focus:bg-white/30 focus:outline-none font-mono text-lg md:text-4xl tracking-widest transition-colors" /></div>
                <div className="space-y-1 pt-2"><label className="text-xs md:text-sm font-bold text-white/70 uppercase tracking-wider">{t.accHolder}</label><div className="flex items-center space-x-3 bg-white/10 p-2 md:p-3 rounded-xl border border-white/10 focus-within:bg-white/20 focus-within:border-white/30 transition-all"><User size={20} className="text-white/70" /><input type="text" value={details.accountName} onChange={(e) => handleChange('accountName', e.target.value)} placeholder="YOUR NAME" className="w-full bg-transparent border-none p-0 text-white placeholder-white/40 focus:ring-0 focus:outline-none font-bold uppercase md:text-2xl" /></div></div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full mt-12 pt-8">
        <button aria-label="Calculate Split" onClick={onNext} disabled={!details.bankName || !details.accountNumber} className="w-full flex items-center justify-center space-x-2 bg-[#e2e9d4] text-[#3a5a31] font-bold text-lg md:text-xl py-4 md:py-6 rounded-2xl btn-3d disabled:opacity-50 mb-8">
          <span>{t.calculateSplit}</span>
          <ArrowRight size={24} />
        </button>
        <Footnote />
      </div>
    </div>
  );
};

export default PaymentView;
