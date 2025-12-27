
import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, ArrowRight, Check, CheckCheck, X, Palette } from 'lucide-react';
import { ReceiptItem, Friend, COLORS } from '../types';
import { Translation } from '../translations';
import { Footnote } from './UploadView';

interface AssignViewProps {
  items: ReceiptItem[];
  friends: Friend[];
  setItems: React.Dispatch<React.SetStateAction<ReceiptItem[]>>;
  setFriends: React.Dispatch<React.SetStateAction<Friend[]>>;
  currency: string;
  onNext: () => void;
  locale: string;
  useDecimals: boolean;
  t: Translation;
}

interface AddFriendFormProps {
  newFriendName: string;
  setNewFriendName: (val: string) => void;
  selectedColor: string;
  setSelectedColor: (val: string) => void;
  addFriend: (e?: React.FormEvent) => void;
  t: Translation;
}

const AddFriendForm: React.FC<AddFriendFormProps> = ({ 
  newFriendName, setNewFriendName, selectedColor, setSelectedColor, addFriend, t 
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) setIsPickerOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <form onSubmit={addFriend} className="flex gap-2 bg-[#f5f5e9] p-2 md:p-3 rounded-2xl border border-[#e2e9d4] relative z-30">
        <div className="relative" ref={pickerRef}>
            <button type="button" onClick={() => setIsPickerOpen(!isPickerOpen)} className="w-10 h-10 md:w-12 md:h-12 rounded-xl shadow-sm border-2 border-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shrink-0 overflow-hidden relative" style={{ backgroundColor: selectedColor }}>
               <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"><Palette size={18} className="text-white drop-shadow-sm" /></div>
            </button>
            {isPickerOpen && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-white rounded-2xl shadow-xl border border-[#e2e9d4] grid grid-cols-5 gap-2 z-50 w-[230px] animate-pop-in">
                    {COLORS.map((c) => (
                        <button key={c} type="button" onClick={() => { setSelectedColor(c); setIsPickerOpen(false); }} className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${selectedColor === c ? 'border-gray-600 scale-110 shadow-md ring-2 ring-white' : 'border-transparent hover:scale-110 hover:shadow-sm'}`} style={{ backgroundColor: c }}>
                          {selectedColor === c && <Check size={14} className="text-white drop-shadow-md" strokeWidth={3} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
        <input type="text" placeholder={t.newFriendPlaceholder} value={newFriendName} onChange={(e) => setNewFriendName(e.target.value)} className="flex-1 bg-transparent px-3 py-2 md:px-5 md:py-3 font-medium focus:outline-none placeholder:text-gray-400 text-sm md:text-lg min-w-0 text-gray-800" />
        <button type="submit" disabled={!newFriendName} className="bg-[#75a968] text-white p-2.5 md:p-3.5 rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 shadow-sm shrink-0 aspect-square flex items-center justify-center"><UserPlus size={20} /></button>
    </form>
  );
};

const AssignView: React.FC<AssignViewProps> = ({ 
  items, friends, setItems, setFriends, currency, onNext, locale, useDecimals, t 
}) => {
  const [newFriendName, setNewFriendName] = useState('');
  const [activeFriendId, setActiveFriendId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(() => COLORS[friends.length % COLORS.length]);

  useEffect(() => { setSelectedColor(COLORS[friends.length % COLORS.length]); }, [friends.length]);
  const addFriend = (e?: React.FormEvent) => {
    e?.preventDefault(); if (!newFriendName.trim()) return;
    const newFriend: Friend = { id: `friend-${Date.now()}`, name: newFriendName.trim(), color: selectedColor };
    setFriends([...friends, newFriend]); setNewFriendName(''); setActiveFriendId(newFriend.id);
  };
  const removeFriend = (friendId: string, e: React.MouseEvent) => {
    e.stopPropagation(); setFriends(prev => prev.filter(f => f.id !== friendId));
    setItems(prev => prev.map(item => ({ ...item, assignedTo: item.assignedTo.filter(id => id !== friendId) })));
    if (activeFriendId === friendId) setActiveFriendId(null);
  };
  const toggleAssignment = (itemId: string) => {
    if (!activeFriendId) return;
    setItems(prevItems => prevItems.map(item => {
      if (item.id !== itemId) return item;
      const isAssigned = item.assignedTo.includes(activeFriendId);
      return { ...item, assignedTo: isAssigned ? item.assignedTo.filter(id => id !== activeFriendId) : [...item.assignedTo, activeFriendId] };
    }));
  };
  const getAssignedCount = (friendId: string) => items.filter(i => i.assignedTo.includes(friendId)).length;
  const allSelected = activeFriendId ? items.length > 0 && items.every(item => item.assignedTo.includes(activeFriendId)) : false;
  const handleToggleAll = () => {
    if (!activeFriendId) return;
    setItems(prev => prev.map(item => {
        const isAssigned = item.assignedTo.includes(activeFriendId);
        return { ...item, assignedTo: allSelected ? item.assignedTo.filter(id => id !== activeFriendId) : (isAssigned ? item.assignedTo : [...item.assignedTo, activeFriendId]) };
    }));
  };
  const formatPrice = (price: number) => {
    try { return price.toLocaleString(locale, { minimumFractionDigits: useDecimals ? 2 : 0, maximumFractionDigits: useDecimals ? 2 : 0 }); } catch { return price.toFixed(useDecimals ? 2 : 0); }
  };

  return (
    <div className="pb-8 md:h-full">
      <div className="space-y-1 mb-6 animate-pop-in">
          <h2 className="text-2xl md:text-4xl font-extrabold text-[#3a5a31]">{t.whoAteWhat}</h2>
          <p className="text-gray-500 font-medium md:text-xl">{t.tapToAssign}</p>
      </div>

      <div className="md:hidden animate-pop-in mb-6 relative z-50">
        <AddFriendForm newFriendName={newFriendName} setNewFriendName={setNewFriendName} selectedColor={selectedColor} setSelectedColor={setSelectedColor} addFriend={addFriend} t={t} />
        {friends.length > 0 && (
            <div className="mt-4 flex overflow-x-auto no-scrollbar space-x-4 p-4 -mx-4 px-8 relative z-10">
                {friends.map(friend => {
                    const isActive = activeFriendId === friend.id;
                    const count = getAssignedCount(friend.id);
                    return (
                        <button key={friend.id} onClick={() => setActiveFriendId(friend.id)} className={`flex-shrink-0 relative flex flex-col items-center space-y-2 transition-all duration-200 ${isActive ? 'transform scale-105' : 'opacity-90'}`}>
                            <div className="relative">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-all border-2 ${isActive ? 'border-white ring-2 ring-[#75a968]' : 'border-transparent'}`} style={{ backgroundColor: friend.color }}><span className="text-white font-bold text-xl">{friend.name.charAt(0).toUpperCase()}</span></div>
                                {isActive && <div onClick={(e) => removeFriend(friend.id, e)} className="absolute -top-1.5 -left-1.5 bg-red-100 text-red-500 p-1 rounded-full shadow-sm border border-white z-20 hover:bg-red-200"><X size={10} strokeWidth={3} /></div>}
                                {count > 0 && <div className="absolute -top-1.5 -right-1.5 bg-[#e2e9d4] text-[#3a5a31] text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm border border-white z-10">{count}</div>}
                            </div>
                            <span className={`text-xs font-bold truncate max-w-[60px] ${isActive ? 'text-[#3a5a31]' : 'text-gray-500'}`}>{friend.name}</span>
                        </button>
                    );
                })}
            </div>
        )}
      </div>

      <div className="md:grid md:grid-cols-12 md:gap-16 md:h-full">
        <div className="md:col-span-7 space-y-4 md:space-y-6 animate-pop-in relative z-0">
            <div className="flex justify-between items-center mb-3 px-1 min-h-[32px] md:min-h-[40px]"><span className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider">{items.length} {t.itemsCount}</span>
                {activeFriendId && items.length > 0 && (
                <button onClick={handleToggleAll} className={`text-xs md:text-sm font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-all flex items-center space-x-1.5 active:scale-95 ${allSelected ? 'bg-[#75a968] text-white shadow-sm' : 'bg-[#e2e9d4] text-[#3a5a31] hover:bg-[#d1dcb8]'}`}>
                    {allSelected ? <><CheckCheck size={14} /><span>{t.unselectAll}</span></> : <><CheckCheck size={14} className="opacity-50" /><span>{t.selectAll}</span></>}
                </button>
                )}
            </div>
            <div className="space-y-3 md:space-y-4">
            {items.map((item, index) => {
                const isAssignedToActive = activeFriendId && item.assignedTo.includes(activeFriendId);
                const hasAssignments = item.assignedTo.length > 0;
                return (
                <div key={item.id} onClick={() => toggleAssignment(item.id)} className={`relative p-4 md:p-5 rounded-2xl md:rounded-[1.5rem] border-2 transition-all cursor-pointer group active:scale-[0.98] ${isAssignedToActive ? 'bg-white border-[#75a968] shadow-[0px_4px_0px_rgba(117,169,104,0.2)]' : 'bg-white border-transparent hover:border-[#e2e9d4] shadow-sm'}`} style={{ animation: 'popIn 0.3s ease-out forwards', animationDelay: `${index * 0.03}s`, opacity: 0 }}>
                    <div className="flex justify-between items-center relative z-10">
                    <div className="flex-1 flex items-start space-x-2 md:space-x-3"><span className="text-xs md:text-sm font-extrabold text-[#3a5a31] bg-[#e2e9d4] px-2 py-1 md:px-3 md:py-1.5 rounded-lg shrink-0 mt-0.5">x{item.quantity}</span><div className="min-w-0 flex flex-col items-start"><h3 className={`text-base md:text-lg font-bold leading-tight ${isAssignedToActive ? 'text-[#3a5a31]' : 'text-gray-800'}`}>{item.name}</h3><p className="text-sm md:text-base font-medium text-gray-400 mt-0.5">{currency} {formatPrice(item.price)}</p></div></div>
                    {isAssignedToActive ? <div className="bg-[#75a968] text-white rounded-full p-1.5 md:p-2 shadow-sm animate-pop-in shrink-0 ml-2"><Check size={18} strokeWidth={3} /></div> : <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-gray-100 group-hover:border-[#75a968]/30 shrink-0 ml-2"></div>}
                    </div>
                    {hasAssignments && <div className="flex mt-3 pl-1 -space-x-2 md:-space-x-3 overflow-hidden py-1">{item.assignedTo.map(fid => { const f = friends.find(fr => fr.id === fid); if (!f) return null; return <div key={fid} className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-[9px] md:text-xs font-bold shadow-sm relative z-0 hover:z-10 hover:scale-110 transition-transform" style={{ backgroundColor: f.color }}>{f.name.charAt(0).toUpperCase()}</div>; })}</div>}
                </div>
                );
            })}
            </div>
        </div>

        <div className="md:col-span-5 md:flex md:flex-col md:justify-between animate-pop-in">
            <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-[#e2e9d4] mb-6 md:mb-0 hidden md:block">
                <div className="hidden md:block"><AddFriendForm newFriendName={newFriendName} setNewFriendName={setNewFriendName} selectedColor={selectedColor} setSelectedColor={setSelectedColor} addFriend={addFriend} t={t} /></div>
                <div className="hidden md:flex flex-col space-y-4 overflow-y-auto max-h-[600px] mt-6 p-2 -m-2">
                    {friends.map(friend => {
                        const isActive = activeFriendId === friend.id;
                        const count = getAssignedCount(friend.id);
                        return (
                        <div key={friend.id} className="relative group/item z-0">
                            <button onClick={() => setActiveFriendId(friend.id)} className={`flex-shrink-0 relative flex flex-col items-center space-y-1 transition-all duration-300 w-full md:flex-row md:space-y-0 md:space-x-4 md:p-4 md:rounded-2xl md:border-2 md:text-left ${isActive ? 'md:bg-[#f5f5e9] md:border-[#75a968] md:shadow-sm md:scale-[1.02]' : 'opacity-80 group-hover/item:opacity-100 group-hover/item:md:bg-[#fbfbf6] group-hover/item:md:border-[#e2e9d4] md:border-transparent'}`}>
                                <div className="relative"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-all border-2 md:w-16 md:h-16 md:rounded-2xl ${isActive ? 'border-white ring-2 ring-[#75a968]' : 'border-transparent'}`} style={{ backgroundColor: friend.color }}><span className="text-white font-bold text-xl md:text-2xl">{friend.name.charAt(0).toUpperCase()}</span></div>{count > 0 && <div className="absolute -top-2 -right-2 bg-[#e2e9d4] text-[#3a5a31] text-xs md:text-sm font-bold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full shadow-sm border border-white z-10">{count}</div>}</div>
                                <span className={`text-xs font-bold ${isActive ? 'text-[#3a5a31]' : 'text-gray-500'} md:text-lg`}>{friend.name}</span>
                            </button>
                            <button onClick={(e) => removeFriend(friend.id, e)} className="absolute top-3 right-3 p-1.5 rounded-full bg-white hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100 border border-gray-100 hover:border-red-100 shadow-sm"><X size={16} /></button>
                        </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="w-full mt-12 pt-8">
                <button onClick={onNext} disabled={friends.length === 0} className="w-full flex items-center justify-center space-x-2 bg-[#e2e9d4] text-[#3a5a31] font-bold text-lg md:text-xl py-4 md:py-6 rounded-2xl btn-3d disabled:opacity-50 mb-8">
                  <span>{t.paymentDetails}</span>
                  <ArrowRight size={24} />
                </button>
                <Footnote />
            </div>
        </div>
      </div>
    </div>
  );
};

export default AssignView;
