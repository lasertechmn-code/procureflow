import React, { useState, useEffect } from 'react';
import { LineItem, PurchaseRequest, RequestStatus, Priority, UserRole } from '../types';
import { Plus, Trash2, Save, ArrowLeft, ExternalLink } from 'lucide-react';
import { saveRequest } from '../services/db';

interface RequestFormProps {
  initialData?: PurchaseRequest;
  currentUser: string;
  onCancel: () => void;
  onSave: () => void;
}

const emptyItem: LineItem = {
  id: '',
  name: '',
  description: '',
  vendor: '',
  mfgPartNumber: '',
  url: '',
  quantity: 1,
  unitType: 'Each',
  pricePerUnit: 0,
};

export const RequestForm: React.FC<RequestFormProps> = ({ initialData, currentUser, onCancel, onSave }) => {
  const [projectCode, setProjectCode] = useState(initialData?.projectCode || '');
  const [priority, setPriority] = useState<Priority>(initialData?.priority || Priority.NORMAL);
  const [neededByDate, setNeededByDate] = useState<string>(
      initialData ? new Date(initialData.neededByDate).toISOString().split('T')[0] : 
      new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [items, setItems] = useState<LineItem[]>(initialData?.items || [{ ...emptyItem, id: Date.now().toString() }]);

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addItem = () => {
    setItems(prev => [...prev, { ...emptyItem, id: Date.now().toString() }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const subTotal = items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const requestToSave: PurchaseRequest = {
      id: initialData?.id || `REQ-${Math.floor(Math.random() * 10000)}`,
      projectCode,
      requesterName: initialData?.requesterName || currentUser,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      neededByDate: new Date(neededByDate).toISOString(),
      priority,
      status: initialData ? initialData.status : RequestStatus.PENDING, 
      items,
      messages: initialData?.messages || [],
      approvalTimeline: initialData?.approvalTimeline || [],
      totalAmount: subTotal,
      notes
    };
    
    saveRequest(requestToSave);
    onSave();
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-sm transition-colors text-gray-400">
          <ArrowLeft size={24} />
        </button>
        <div>
            <h1 className="text-2xl font-bold text-white tracking-tight uppercase">
                {initialData ? `EDIT_REQ: ${initialData.id}` : 'NEW_REQUEST_ENTRY'}
            </h1>
            <p className="text-xs font-mono text-gray-500 mt-1">FILL ALL REQUIRED FIELDS (*)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* General Info Card */}
        <div className="bg-surface border border-border p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 border-b border-border pb-2">Project Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-1 uppercase">Project Name / Code *</label>
              <input 
                required
                type="text" 
                className="w-full bg-[#09090b] border border-border px-4 py-2 text-white focus:border-brand outline-none transition-colors rounded-sm"
                placeholder="e.g. PROJECT-ALPHA"
                value={projectCode}
                onChange={e => setProjectCode(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-1 uppercase">Requester</label>
              <input 
                type="text" 
                disabled
                className="w-full bg-surface border border-border px-4 py-2 text-gray-500 cursor-not-allowed rounded-sm"
                value={initialData?.requesterName || currentUser}
              />
            </div>
            <div>
               <label className="block text-xs font-mono text-gray-400 mb-1 uppercase">Priority Level</label>
               <select 
                 className="w-full bg-[#09090b] border border-border px-4 py-2 text-white focus:border-brand outline-none rounded-sm"
                 value={priority}
                 onChange={e => setPriority(e.target.value as Priority)}
               >
                 {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
               </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-1 uppercase">Required Date</label>
              <input 
                type="date" 
                className="w-full bg-[#09090b] border border-border px-4 py-2 text-white focus:border-brand outline-none rounded-sm"
                value={neededByDate}
                onChange={e => setNeededByDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-4">
           <div className="flex justify-between items-end px-1">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Line Items</h2>
                <div className="text-right text-gray-500 text-xs font-mono">
                    COUNT: <span className="text-white">{items.length}</span>
                </div>
           </div>

           {items.map((item, index) => (
             <div key={item.id} className="bg-surface border border-border p-6 relative group">
                <div className="absolute top-4 right-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        type="button" 
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-sm transition-colors"
                        disabled={items.length === 1}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-1 flex items-center justify-center md:justify-start">
                        <span className="w-6 h-6 border border-border bg-black text-gray-500 flex items-center justify-center text-[10px] font-mono">
                            {String(index + 1).padStart(2, '0')}
                        </span>
                    </div>
                    
                    {/* First Row: Description & Identifiers */}
                    <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="md:col-span-1">
                                <label className="block text-[10px] font-mono text-gray-500 mb-1 uppercase">Item Name *</label>
                                <input 
                                    required
                                    placeholder="WIDGET-A"
                                    className="w-full bg-[#09090b] border border-border px-3 py-2 text-sm text-white focus:border-brand outline-none rounded-sm"
                                    value={item.name}
                                    onChange={e => updateItem(item.id, 'name', e.target.value)}
                                />
                             </div>
                             <div className="md:col-span-2">
                                <label className="block text-[10px] font-mono text-gray-500 mb-1 uppercase">Description / Specs</label>
                                <input 
                                    placeholder="Technical specifications..."
                                    className="w-full bg-[#09090b] border border-border px-3 py-2 text-sm text-white focus:border-brand outline-none rounded-sm"
                                    value={item.description}
                                    onChange={e => updateItem(item.id, 'description', e.target.value)}
                                />
                             </div>
                        </div>

                        {/* Vendor Info */}
                        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-[10px] font-mono text-gray-500 mb-1 uppercase">Vendor</label>
                                <input 
                                    placeholder="SUPPLIER X"
                                    className="w-full bg-[#09090b] border border-border px-3 py-2 text-sm text-white focus:border-brand outline-none rounded-sm"
                                    value={item.vendor}
                                    onChange={e => updateItem(item.id, 'vendor', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-mono text-gray-500 mb-1 uppercase">MFG Part #</label>
                                <input 
                                    placeholder="PN-0000"
                                    className="w-full bg-[#09090b] border border-border px-3 py-2 text-sm text-white focus:border-brand outline-none rounded-sm"
                                    value={item.mfgPartNumber}
                                    onChange={e => updateItem(item.id, 'mfgPartNumber', e.target.value)}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] font-mono text-gray-500 mb-1 uppercase">Product Link</label>
                                <div className="relative">
                                    <input 
                                        type="url"
                                        placeholder="https://..."
                                        className="w-full bg-[#09090b] border border-border pl-3 pr-8 py-2 text-sm text-blue-400 underline focus:border-brand outline-none rounded-sm"
                                        value={item.url}
                                        onChange={e => updateItem(item.id, 'url', e.target.value)}
                                    />
                                    <ExternalLink size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="md:col-span-2 bg-black/40 border border-border p-3 rounded-sm grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                            <div>
                                <label className="block text-[10px] font-mono text-gray-500 mb-1 uppercase">Qty</label>
                                <input 
                                    type="number"
                                    min="1"
                                    className="w-full bg-[#09090b] border border-border px-3 py-2 text-sm text-white focus:border-brand outline-none rounded-sm text-center"
                                    value={item.quantity}
                                    onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-mono text-gray-500 mb-1 uppercase">Unit Type</label>
                                <input 
                                    placeholder="EA"
                                    className="w-full bg-[#09090b] border border-border px-3 py-2 text-sm text-white focus:border-brand outline-none rounded-sm"
                                    value={item.unitType}
                                    onChange={e => updateItem(item.id, 'unitType', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-mono text-gray-500 mb-1 uppercase">Unit Price</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                                    <input 
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-full bg-[#09090b] border border-border pl-6 pr-3 py-2 text-sm text-white focus:border-brand outline-none rounded-sm text-right"
                                        value={item.pricePerUnit}
                                        onChange={e => updateItem(item.id, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                            <div className="text-right">
                                <label className="block text-[10px] font-mono text-gray-500 mb-1 uppercase">Line Total</label>
                                <span className="font-mono font-medium text-white text-lg">
                                    ${(item.quantity * item.pricePerUnit).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
           ))}

           <button 
             type="button"
             onClick={addItem}
             className="w-full py-3 border border-dashed border-border text-gray-500 hover:text-white hover:border-brand hover:bg-white/5 transition-all flex items-center justify-center gap-2 rounded-sm uppercase text-xs font-bold tracking-wider"
           >
             <Plus size={16} />
             Add Item
           </button>
        </div>

        {/* Footer / Totals */}
        <div className="bg-surface border border-border p-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="w-full md:w-1/2">
                    <label className="block text-xs font-mono text-gray-400 mb-2 uppercase">Notes / Justification</label>
                    <textarea 
                        className="w-full h-24 bg-[#09090b] border border-border px-4 py-2 text-sm text-white focus:border-brand outline-none resize-none rounded-sm"
                        placeholder="Provide business justification..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                    ></textarea>
                </div>
                <div className="w-full md:w-1/3 space-y-4">
                    <div className="flex justify-between items-center text-gray-400 font-mono text-sm">
                        <span>SUBTOTAL</span>
                        <span>${subTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-400 font-mono text-sm">
                        <span>TAX/SHIPPING</span>
                        <span className="text-xs text-gray-600">CALCULATED_LATER</span>
                    </div>
                    <div className="pt-4 border-t border-border flex justify-between items-center">
                        <span className="text-lg font-bold text-white uppercase tracking-tight">Grand Total</span>
                        <span className="text-2xl font-bold text-white font-mono">${subTotal.toFixed(2)}</span>
                    </div>
                    
                    <button 
                        type="submit"
                        className="w-full bg-brand hover:bg-brandHover text-white py-3 rounded-sm font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        <Save size={18} />
                        {initialData ? 'UPDATE REQUEST' : 'SUBMIT REQUEST'}
                    </button>
                </div>
            </div>
        </div>
      </form>
    </div>
  );
};