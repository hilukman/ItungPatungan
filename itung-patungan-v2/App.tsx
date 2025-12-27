
import React, { useState } from 'react';
import UploadView from './components/UploadView';
import EditView from './components/EditView';
import AssignView from './components/AssignView';
import PaymentView from './components/PaymentView';
import SummaryView from './components/SummaryView';
import { ReceiptItem, Friend, PaymentDetails, ViewState, CURRENCY_OPTIONS } from './types';
import { Receipt, Users, CreditCard, CheckCircle, ChevronLeft, Globe } from 'lucide-react';
import { translations, LANGUAGES, LanguageCode } from './translations';

const App: React.FC = () => {
  // State
  const [view, setView] = useState<ViewState>('upload');
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [currency, setCurrency] = useState('$');
  const [tax, setTax] = useState(0); // This is now tax AMOUNT, not percent
  const [service, setService] = useState(0); // This is now service AMOUNT, not percent
  const [deliveryFee, setDeliveryFee] = useState(0); // Delivery Fee Amount
  const [discount, setDiscount] = useState(0); // This is discount AMOUNT
  const [friends, setFriends] = useState<Friend[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    bankName: '',
    accountNumber: '',
    accountName: '',
  });

  // Formatting Preferences
  const [locale, setLocale] = useState<string>('en-US');
  const [useDecimals, setUseDecimals] = useState<boolean>(true);
  const [lang, setLang] = useState<LanguageCode>('en');

  const t = translations[lang];

  // Handlers
  const handleAnalysisComplete = (
      newItems: ReceiptItem[], 
      detectedCurrency: string, 
      detectedTaxAmount?: number, 
      detectedServiceAmount?: number, 
      detectedDiscountAmount?: number,
      detectedDeliveryFeeAmount?: number
  ) => {
    setItems(newItems);
    
    // Try to auto-match currency to our supported options
    const normalizedDetected = detectedCurrency.trim().toUpperCase();
    const matchedOption = CURRENCY_OPTIONS.find(c => 
      c.code === normalizedDetected || 
      c.symbol === detectedCurrency.trim() ||
      (detectedCurrency.toLowerCase().includes('rp') && c.code === 'IDR') ||
      (detectedCurrency.includes('€') && c.code === 'EUR')
    );

    if (matchedOption) {
      setCurrency(matchedOption.symbol);
      setLocale(matchedOption.locale);
      setUseDecimals(matchedOption.defaultDecimals);
    } else {
      // Fallback
      setCurrency(detectedCurrency);
      const isIdr = detectedCurrency.toLowerCase().includes('rp') || detectedCurrency.toLowerCase().includes('idr');
      setLocale(isIdr ? 'id-ID' : 'en-US');
      setUseDecimals(!isIdr);
    }

    // Set amounts or default to 0 if not detected
    setTax(detectedTaxAmount || 0);
    setService(detectedServiceAmount || 0);
    setDiscount(detectedDiscountAmount || 0);
    setDeliveryFee(detectedDeliveryFeeAmount || 0);
    
    setView('edit');
  };

  const handleReset = () => {
    setItems([]);
    setFriends([]);
    setPaymentDetails({ bankName: '', accountNumber: '', accountName: '' });
    setTax(0);
    setService(0);
    setDiscount(0);
    setDeliveryFee(0);
    setView('upload');
  };

  // Progress Steps UI
  const steps = [
    { id: 'upload', icon: Receipt },
    { id: 'edit', icon: Receipt },
    { id: 'assign', icon: Users },
    { id: 'payment', icon: CreditCard },
    { id: 'summary', icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === view);

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setView(steps[currentStepIndex - 1].id as ViewState);
    }
  };

  const handleStepClick = (stepId: string) => {
    const targetIndex = steps.findIndex(s => s.id === stepId);
    // Only allow navigating to previous steps (or current)
    if (targetIndex < currentStepIndex) {
      setView(stepId as ViewState);
    }
  };

  // Check for shared bill data on load
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');
    if (shareData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(shareData)));
        setItems(decoded.items || []);
        setFriends(decoded.friends || []);
        setPaymentDetails(decoded.paymentDetails || {});
        
        // Handle legacy links where it might have been named taxPercent/servicePercent or tax/service
        setTax(decoded.taxAmount || decoded.tax || 0);
        setService(decoded.serviceAmount || decoded.service || 0);
        setDeliveryFee(decoded.deliveryFeeAmount || decoded.deliveryFee || 0);
        setDiscount(decoded.discountAmount || 0);
        
        setCurrency(decoded.currency || '$');
        
        // Robust locale validation
        let safeLocale = 'en-US';
        if (decoded.locale) {
          try {
            // Check if locale is valid by attempting to create a formatter
            new Intl.NumberFormat(decoded.locale);
            safeLocale = decoded.locale;
          } catch (e) {
            console.warn(`Invalid locale in share link: ${decoded.locale}, reverting to en-US`);
          }
        }
        setLocale(safeLocale);

        setUseDecimals(decoded.useDecimals ?? true);
        if (decoded.lang && translations[decoded.lang as LanguageCode]) {
            setLang(decoded.lang as LanguageCode);
        }
        setView('summary');
      } catch (e) {
        console.error("Failed to load shared bill", e);
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f5f5e9] md:py-8 lg:py-12">
      {/* Language Selector Overlay */}
      <div className="absolute top-4 right-4 z-50">
          <div className="relative group">
              <button className="flex items-center space-x-1 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#e2e9d4] shadow-sm text-xs font-bold text-[#3a5a31] hover:bg-white transition-all">
                  <Globe size={14} />
                  <span>{LANGUAGES.find(l => l.code === lang)?.code.toUpperCase()}</span>
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#e2e9d4] overflow-hidden hidden group-hover:block max-h-60 overflow-y-auto">
                  {LANGUAGES.map((l) => (
                      <button 
                        key={l.code}
                        onClick={() => setLang(l.code)}
                        className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-[#f5f5e9] ${lang === l.code ? 'text-[#75a968] bg-[#f5f5e9]/50' : 'text-gray-700'}`}
                      >
                          {l.label}
                      </button>
                  ))}
              </div>
          </div>
      </div>

      {/* Main Content Container - Pushed down more on mobile with pt-20 */}
      <main className="flex-1 w-full p-6 pt-20 max-w-md mx-auto md:max-w-7xl md:p-10 md:pt-10 transition-all duration-300">
         
         {/* Navigation Header */}
         {view !== 'upload' && (
             <div className="relative flex items-center justify-center mb-8 h-12 md:mb-12">
               {/* Back Button - Fixed Left Alignment */}
               <button 
                  onClick={handleBack}
                  aria-label="Go Back"
                  className="absolute left-0 w-10 h-10 flex items-center justify-center bg-white/60 backdrop-blur-md rounded-full border border-[#e2e9d4] shadow-sm text-[#3a5a31] hover:bg-[#75a968] hover:text-white transition-colors active:scale-95"
               >
                 <ChevronLeft size={24} />
               </button>

               {/* Step Indicator Pill */}
               <div className="flex items-center space-x-2 px-4 py-2 bg-white/40 backdrop-blur-md rounded-full border border-[#e2e9d4] shadow-sm">
                 {steps.slice(1).map((step, idx) => {
                   const stepRealIndex = idx + 1; // +1 because slice removed upload
                   const isActive = stepRealIndex <= currentStepIndex;
                   const isClickable = stepRealIndex < currentStepIndex;

                   return (
                     <div 
                      key={step.id} 
                      onClick={() => isClickable && handleStepClick(step.id)}
                      className={`h-2.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                        isActive ? 'w-10 bg-[#75a968]' : 'w-2.5 bg-[#d1dcb8]'
                      } ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                     />
                   );
                 })}
               </div>
             </div>
           )}

        {view === 'upload' && (
          <UploadView 
            onAnalysisComplete={handleAnalysisComplete} 
            t={t}
          />
        )}

        {view === 'edit' && (
          <EditView 
            items={items}
            currency={currency}
            setCurrency={setCurrency}
            tax={tax}
            service={service}
            deliveryFee={deliveryFee}
            discount={discount}
            setItems={setItems}
            setTax={setTax}
            setService={setService}
            setDeliveryFee={setDeliveryFee}
            setDiscount={setDiscount}
            onNext={() => setView('assign')}
            // Formatting props
            locale={locale}
            setLocale={setLocale}
            useDecimals={useDecimals}
            setUseDecimals={setUseDecimals}
            t={t}
          />
        )}

        {view === 'assign' && (
          <AssignView 
            items={items}
            friends={friends}
            setItems={setItems}
            setFriends={setFriends}
            currency={currency}
            onNext={() => setView('payment')}
            locale={locale}
            useDecimals={useDecimals}
            t={t}
          />
        )}

        {view === 'payment' && (
          <PaymentView 
            details={paymentDetails}
            setDetails={setPaymentDetails}
            onNext={() => setView('summary')}
            t={t}
          />
        )}

        {view === 'summary' && (
          <SummaryView 
            items={items}
            friends={friends}
            tax={tax}
            service={service}
            deliveryFee={deliveryFee}
            discount={discount}
            currency={currency}
            paymentDetails={paymentDetails}
            onReset={handleReset}
            locale={locale}
            useDecimals={useDecimals}
            lang={lang}
            t={t}
          />
        )}
      </main>
    </div>
  );
};

export default App;
