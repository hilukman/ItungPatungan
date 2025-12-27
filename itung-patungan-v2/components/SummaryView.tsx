
import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ReceiptItem, Friend, PaymentDetails } from '../types';
import { Translation, LanguageCode } from '../translations';
import { useReceiptCanvas } from '../hooks/useReceiptCanvas';
import { Footnote } from './UploadView';

interface SummaryViewProps {
  items: ReceiptItem[];
  friends: Friend[];
  tax: number;
  service: number;
  deliveryFee: number;
  discount: number;
  currency: string;
  paymentDetails: PaymentDetails;
  onReset: () => void;
  locale: string;
  useDecimals: boolean;
  lang: LanguageCode;
  t: Translation;
}

const SummaryView: React.FC<SummaryViewProps> = (props) => {
  const { onReset, t } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { generatedImage } = useReceiptCanvas({ ...props, canvasRef });
  useEffect(() => { if (generatedImage) setShowConfetti(true); }, [generatedImage]);
  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.download = `SnapSplit-Receipt-${Date.now()}.png`; link.href = generatedImage; link.click();
  };
  const handleResetClick = () => setShowResetConfirm(true);

  return (
    <div className="space-y-8 pb-8 relative md:h-full">
      <style>{`@keyframes printSlide { 0% { transform: translateY(-100%); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(0); opacity: 1; } } .animate-receipt-print { animation: printSlide 2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }`}</style>
      {showConfetti && <div className="fixed inset-0 overflow-hidden pointer-events-none h-full z-50">{[...Array(25)].map((_, i) => <div key={i} className="confetti text-4xl drop-shadow-md" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 1.5}s`, animationDuration: `${2.5 + Math.random() * 2}s`, width: 'auto', height: 'auto' }}>🪙</div>)}</div>}
      {showResetConfirm && createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"><div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-6 border border-[#e2e9d4] animate-pop-in"><div className="text-center space-y-2"><div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100"><AlertTriangle size={28} /></div><h3 className="text-xl font-extrabold text-[#3a5a31]">{t.resetConfirmTitle}</h3><p className="text-gray-500 font-medium leading-relaxed">{t.resetConfirmText}</p></div><div className="flex space-x-3 pt-2"><button onClick={() => setShowResetConfirm(false)} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">{t.cancel}</button><button onClick={() => { onReset(); setShowResetConfirm(false); window.history.replaceState({}, '', window.location.pathname); }} className="flex-1 py-3 font-bold bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition-transform active:scale-95">{t.resetYes}</button></div></div></div>, document.body)}
      
      <div className="flex flex-col md:flex-row md:items-start md:gap-12 lg:gap-20">
        <div className="w-full md:flex-1">
            <div className="text-center mb-2 mt-4 md:mt-0 md:hidden"><p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{t.officialReceipt}</p></div>
            <div className="relative w-full max-w-sm md:max-w-2xl mx-auto transition-all duration-300">
                <div className="relative z-20 w-full px-4 mb-[-18px]"><div className="h-14 md:h-20 bg-gradient-to-b from-[#e8e8df] to-[#d4d4cb] rounded-2xl shadow-lg border border-[#c4c4bb] flex flex-col justify-end items-center relative overflow-hidden"><div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none"></div><div className="w-[90%] h-2.5 bg-[#2c2c2a] rounded-full mb-3 md:mb-5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] border-b border-[#444]"></div></div></div>
                <div className="relative z-10 px-8 overflow-hidden pt-4 pb-2"><div className={`origin-top ${generatedImage ? 'animate-receipt-print' : 'opacity-0'}`}>{generatedImage ? <img src={generatedImage} alt="Bill Summary" className="w-full h-auto block drop-shadow-xl" /> : <div className="w-full h-32 md:h-64"></div>}</div></div>
            </div>
        </div>

        <div className="w-full md:w-96 lg:w-[28rem] md:sticky md:top-8 space-y-6 md:mt-6">
            <div className="hidden md:flex flex-col items-center justify-center bg-white p-10 rounded-3xl shadow-[4px_4px_0px_rgba(226,233,212,1)] border border-[#e2e9d4] text-center space-y-6"><div className="w-20 h-20 bg-[#e2e9d4] rounded-full flex items-center justify-center mb-2 animate-bounce"><CheckCircle2 size={40} className="text-[#3a5a31]" /></div><div><h2 className="text-3xl font-extrabold text-[#3a5a31]">All Done!</h2><p className="text-gray-500 font-medium text-lg mt-2">Your bill has been split successfully.</p></div></div>
            <div className="space-y-1 px-6 md:px-0 text-center animate-pop-in max-w-sm mx-auto">
                <button onClick={handleDownload} disabled={!generatedImage} className={`w-full flex items-center justify-center space-x-2 bg-[#e2e9d4] text-[#3a5a31] font-bold text-lg md:text-xl py-4 md:py-6 rounded-2xl border-2 border-[#d1dcb8] transition-all active:scale-95 ${generatedImage ? 'shadow-[0_0_15px_rgba(117,169,104,0.4)] hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(117,169,104,0.6)]' : 'opacity-50 grayscale'}`}><Download size={24} className={generatedImage ? 'animate-bounce' : ''} /><span>{t.saveReceipt}</span></button>
                <button onClick={handleResetClick} className="w-full flex items-center justify-center space-x-2 text-[#75a968] font-bold py-3 md:py-4 hover:bg-[#e2e9d4]/30 rounded-xl transition-colors md:text-lg mb-8"><RotateCcw size={20} /><span>{t.splitAnother}</span></button>
                <Footnote />
            </div>
        </div>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default SummaryView;
