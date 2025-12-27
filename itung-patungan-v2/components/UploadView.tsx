
import React, { useRef, useState } from 'react';
import { Camera, Zap, ScanLine, Plus, X } from 'lucide-react';
import { analyzeReceiptImage } from '../services/geminiService';
import { enhanceImageForOCR, resizeImage } from '../services/imageUtils';
import { ReceiptItem } from '../types';
import { Translation } from '../translations';

// Define the UploadViewProps interface
interface UploadViewProps {
  onAnalysisComplete: (
    items: ReceiptItem[],
    currency: string,
    taxAmount?: number,
    serviceAmount?: number,
    discountAmount?: number,
    deliveryFeeAmount?: number
  ) => void;
  t: Translation;
}

export const Footnote = () => (
  <footer className="w-full py-2 px-1 md:px-4 text-center space-y-0.5">
    <p className="text-[9px] md:text-[11px] text-slate-400 font-medium tracking-tight leading-relaxed">
      Remember, final check is on you & verify before paying.
    </p>
    <p className="text-[10px] md:text-[12px] text-slate-500 font-bold tracking-tight whitespace-nowrap">
      &copy; 2025 Itung Patungan &bull; Vibe Coded by <a href="https://www.linkedin.com/in/hiluk/" target="_blank" rel="noopener noreferrer" className="text-[#75a968] underline decoration-dotted underline-offset-4 hover:decoration-solid transition-colors">Lukman Hakim</a>
    </p>
  </footer>
);

const UploadView: React.FC<UploadViewProps> = ({ onAnalysisComplete, t }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError(null);
    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            const resized = await resizeImage(base64, 1024);
            const enhanced = await enhanceImageForOCR(resized);
            newImages.push(enhanced);
        } catch (err) {
            console.error("Error processing file", file.name, err);
            setError("Some images couldn't be processed. Please try again.");
        }
    }
    setImages(prev => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
      setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartAnalysis = async () => {
      if (images.length === 0) return;
      setIsAnalyzing(true);
      setError(null);
      try {
        const result = await analyzeReceiptImage(images);
        const items: ReceiptItem[] = result.items.map((item, index) => ({
            id: `item-${Date.now()}-${index}`,
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1,
            assignedTo: []
        }));
        onAnalysisComplete(items, result.currency || '$', result.taxAmount, result.serviceAmount, result.discountAmount, result.deliveryFeeAmount);
      } catch (err) {
        console.error("Analysis failed:", err);
        setError("Oops! Couldn't read that receipt. Try a clearer photo?");
        setIsAnalyzing(false);
      }
  };

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-160px)] text-center animate-pop-in max-w-2xl mx-auto w-full pb-8 md:pb-4 pt-4 md:pt-0">
      <div className="flex-1 w-full flex flex-col items-center justify-center space-y-8 md:space-y-10">
        <div className="space-y-4">
          <div className="relative inline-block">
              <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-[8px_8px_0px_rgba(117,169,104,0.2)] border-2 border-[#e2e9d4] transform -rotate-6 transition-transform hover:rotate-0 duration-300">
              <ScanLine size={48} className="text-[#75a968]" />
              </div>
              <div className="absolute -top-2 -right-2 bg-[#75a968] text-white p-2 rounded-full shadow-md animate-bounce">
                  <Zap size={16} fill="white" />
              </div>
          </div>
          <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-[#3a5a31] mb-2">{t.appName}</h1>
              <p className="text-gray-500 font-medium max-w-xs mx-auto text-lg leading-relaxed whitespace-pre-line">
              {isAnalyzing ? t.scanning : t.subheading}
              </p>
          </div>
        </div>

        <div className="w-full flex justify-center items-center">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center space-y-8 w-full animate-pop-in">
              <div className="relative w-48 h-64 bg-white rounded-xl shadow-[8px_8px_0px_rgba(117,169,104,0.1)] border-2 border-[#e2e9d4] overflow-hidden">
                  <div className="p-5 space-y-4 opacity-30 flex flex-col h-full">
                      <div className="w-16 h-4 bg-gray-400 rounded-md mx-auto mb-2"></div>
                      <div className="space-y-3 flex-1">
                          {[1, 2, 3, 4].map(i => (
                              <div key={i} className="flex justify-between items-center">
                                  <div className="w-20 h-2 bg-gray-300 rounded"></div>
                                  <div className="w-8 h-2 bg-gray-300 rounded"></div>
                              </div>
                          ))}
                          <div className="border-t-2 border-dashed border-gray-300 my-2"></div>
                          <div className="flex justify-between items-center mt-auto">
                                  <div className="w-10 h-3 bg-gray-400 rounded"></div>
                                  <div className="w-12 h-3 bg-gray-400 rounded"></div>
                          </div>
                      </div>
                  </div>
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-[#75a968] shadow-[0_0_20px_#75a968] animate-scan z-10"></div>
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#75a968]/10 to-transparent animate-scan pointer-events-none" style={{ animationDelay: '0.1s' }}></div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm text-gray-500 font-medium">{t.hangTight}</p>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-6">
              <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              
              {images.length === 0 ? (
                  <div className="animate-pop-in max-w-xs mx-auto flex flex-col items-center">
                    <div className="space-y-5 flex flex-col items-center w-full">
                        <button onClick={() => fileInputRef.current?.click()} className="group w-full flex items-center justify-center space-x-3 bg-[#e2e9d4] text-[#3a5a31] font-bold text-xl py-5 px-6 rounded-2xl btn-3d">
                            <Camera size={28} className="group-hover:scale-110 transition-transform" />
                            <span>{t.scanReceipt}</span>
                        </button>
                        <div className="inline-block bg-white/70 py-2.5 px-8 rounded-full border border-white/40 shadow-sm text-sm text-gray-400 font-bold uppercase tracking-wider">
                            {t.supportedFormats}
                        </div>
                    </div>
                  </div>
              ) : (
                  <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
                          {images.map((img, idx) => (
                              <div key={idx} className="relative aspect-[3/4] bg-white rounded-2xl border-2 border-[#e2e9d4] shadow-sm overflow-hidden group animate-pop-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                                  <img src={img} alt={`${t.receiptLabel} ${idx + 1}`} className="w-full h-full object-cover" />
                                  <button onClick={() => removeImage(idx)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"><X size={14} strokeWidth={3} /></button>
                                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm">{t.receiptLabel} {idx + 1}</div>
                              </div>
                          ))}
                          <button onClick={() => fileInputRef.current?.click()} className="aspect-[3/4] rounded-2xl border-2 border-dashed border-[#c4cca3] flex flex-col items-center justify-center text-[#75a968] hover:bg-[#f5f5e9] hover:border-[#75a968] transition-all group">
                              <div className="w-12 h-12 bg-[#e2e9d4] rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"><Plus size={24} /></div>
                              <span className="font-bold text-sm">{t.addMoreReceipts}</span>
                          </button>
                      </div>
                      <div className="max-w-sm mx-auto flex flex-col items-center">
                          <button onClick={handleStartAnalysis} className="w-full flex items-center justify-center space-x-2 bg-[#75a968] text-white font-bold text-xl py-4 rounded-2xl shadow-[0px_4px_0px_rgba(58,90,49,1)] active:shadow-none active:translate-y-[4px] transition-all">
                              <Zap size={24} className="fill-current" />
                              <span>{t.startSplitting} ({images.length})</span>
                          </button>
                      </div>
                  </div>
              )}
              {error && <div className="p-4 bg-red-50 text-red-600 font-medium rounded-2xl border-2 border-red-100 animate-pop-in max-w-md mx-auto">{error}</div>}
            </div>
          )}
        </div>
      </div>

      <div className="w-full mt-16 md:mt-auto pt-8">
        <Footnote />
      </div>
    </div>
  );
};

export default UploadView;
