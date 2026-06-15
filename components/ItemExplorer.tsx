import React, { useMemo, useState, useEffect } from 'react';
import { PurchaseRequest, RequestStatus, ExplorerFilters } from '../types';
import { Search, X, SlidersHorizontal, Package, ExternalLink } from 'lucide-react';
import { getItemCategory, CATEGORY_STYLES, ALL_CATEGORIES, Highlight, ItemCategory } from '../services/itemCategory';

interface FlatItem {
  reqId: string;
  reqStatus: RequestStatus;
  requesterName: string;
  workcell: string;
  date: string;          // ISO submitted/created
  itemId: string;
  name: string;
  description: string;
  vendor: string;
  vendorUrl?: string;
  mfgPartNumber: string;
  url: string;
  quantity: number;
  unitType: string;
  pricePerUnit: number;
  lineTotal: number;
  category: ItemCategory;
}

interface ItemExplorerProps {
  requests: PurchaseRequest[];
  initialFilters?: ExplorerFilters;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onOpenRequest: (id: string) => void;
}

const fuzzy = (target: string, query: string) => {
  const t = target.toLowerCase();
  return query.toLowerCase().split(/\s+/).filter(Boolean).every(tok => t.includes(tok));
};

export const ItemExplorer: React.FC<ItemExplorerProps> = ({ requests, initialFilters, searchTerm, onSearchChange, onOpenRequest }) => {
  const [filters, setFilters] = useState<ExplorerFilters>(initialFilters || {});

  // Sync incoming initial filters (e.g. clicked a workcell on another page)
  useEffect(() => {
    if (initialFilters) setFilters(prev => ({ ...prev, ...initialFilters }));
  }, [initialFilters]);

  // Flatten all line items with parent PR context
  const flatItems = useMemo<FlatItem[]>(() => {
    const out: FlatItem[] = [];
    for (const r of requests) {
      const date = r.submittedDate || r.createdAt;
      for (const it of r.items) {
        out.push({
          reqId: r.id,
          reqStatus: r.status,
          requesterName: r.requesterName,
          workcell: it.buildCell || r.projectCode || '—',
          date,
          itemId: it.id,
          name: it.name,
          description: it.description,
          vendor: it.vendor,
          vendorUrl: it.vendorUrl,
          mfgPartNumber: it.mfgPartNumber,
          url: it.url,
          quantity: it.quantity,
          unitType: it.unitType,
          pricePerUnit: it.pricePerUnit,
          lineTotal: it.quantity * it.pricePerUnit,
          category: getItemCategory(it),
        });
      }
    }
    return out;
  }, [requests]);

  // Distinct filter option lists
  const workcells = useMemo(() => Array.from(new Set(flatItems.map(i => i.workcell))).sort(), [flatItems]);
  const requesters = useMemo(() => Array.from(new Set(flatItems.map(i => i.requesterName))).sort(), [flatItems]);
  const suppliers = useMemo(() => Array.from(new Set(flatItems.map(i => i.vendor))).sort(), [flatItems]);

  const filtered = useMemo(() => {
    const min = filters.minPrice ? parseFloat(filters.minPrice) : null;
    const max = filters.maxPrice ? parseFloat(filters.maxPrice) : null;
    const from = filters.fromDate ? new Date(filters.fromDate).getTime() : null;
    const to = filters.toDate ? new Date(filters.toDate).getTime() + 86400000 : null; // inclusive end of day

    return flatItems.filter(i => {
      if (searchTerm.trim()) {
        const blob = [i.name, i.description, i.vendor, i.mfgPartNumber, i.workcell, i.requesterName, i.category].join(' ');
        if (!fuzzy(blob, searchTerm)) return false;
      }
      if (filters.workcell && i.workcell !== filters.workcell) return false;
      if (filters.requester && i.requesterName !== filters.requester) return false;
      if (filters.supplier && i.vendor !== filters.supplier) return false;
      if (filters.category && i.category !== filters.category) return false;
      if (filters.status && i.reqStatus !== filters.status) return false;
      if (min !== null && i.pricePerUnit < min) return false;
      if (max !== null && i.pricePerUnit > max) return false;
      if (from !== null || to !== null) {
        const t = new Date(i.date).getTime();
        if (from !== null && t < from) return false;
        if (to !== null && t >= to) return false;
      }
      return true;
    });
  }, [flatItems, filters, searchTerm]);

  const totalValue = useMemo(() => filtered.reduce((a, i) => a + i.lineTotal, 0), [filtered]);

  const setF = (patch: Partial<ExplorerFilters>) => setFilters(prev => ({ ...prev, ...patch }));
  const clearAll = () => { setFilters({}); onSearchChange(''); };

  const activeFilterCount = Object.entries(filters).filter(([, v]) => v && String(v).length > 0).length;

  const selectClass = 'bg-black border border-border rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-brand';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight uppercase flex items-center gap-3">
          <Package size={26} className="text-brand" /> Item Catalog
        </h1>
        <p className="text-gray-500 text-sm mt-1">Every line item ever ordered, flattened and searchable across all purchase requests.</p>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input
          type="text"
          placeholder="Search items, descriptions, part numbers, vendors..."
          className="w-full bg-black border border-border rounded-sm pl-11 pr-4 py-3 text-base text-white placeholder-gray-600 focus:outline-none focus:border-brand transition-colors"
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border p-4 rounded-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-gray-400 text-sm font-mono uppercase tracking-wider">
            <SlidersHorizontal size={16} /> Filters {activeFilterCount > 0 && <span className="text-brand">({activeFilterCount})</span>}
          </div>
          {(activeFilterCount > 0 || searchTerm) && (
            <button onClick={clearAll} className="flex items-center gap-1 text-xs font-mono text-gray-500 hover:text-white uppercase">
              <X size={14} /> Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-gray-500 uppercase">Workcell</span>
            <select className={selectClass} value={filters.workcell || ''} onChange={e => setF({ workcell: e.target.value })}>
              <option value="">All</option>
              {workcells.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-gray-500 uppercase">Requester</span>
            <select className={selectClass} value={filters.requester || ''} onChange={e => setF({ requester: e.target.value })}>
              <option value="">All</option>
              {requesters.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-gray-500 uppercase">Supplier</span>
            <select className={selectClass} value={filters.supplier || ''} onChange={e => setF({ supplier: e.target.value })}>
              <option value="">All</option>
              {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-gray-500 uppercase">Type</span>
            <select className={selectClass} value={filters.category || ''} onChange={e => setF({ category: e.target.value })}>
              <option value="">All</option>
              {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-gray-500 uppercase">Status</span>
            <select className={selectClass} value={filters.status || ''} onChange={e => setF({ status: e.target.value })}>
              <option value="">All</option>
              {Object.values(RequestStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-gray-500 uppercase">Unit Price ($)</span>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="min" className={`${selectClass} w-full`} value={filters.minPrice || ''} onChange={e => setF({ minPrice: e.target.value })} />
              <span className="text-gray-600">–</span>
              <input type="number" placeholder="max" className={`${selectClass} w-full`} value={filters.maxPrice || ''} onChange={e => setF({ maxPrice: e.target.value })} />
            </div>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-gray-500 uppercase">From Date</span>
            <input type="date" className={selectClass} value={filters.fromDate || ''} onChange={e => setF({ fromDate: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-gray-500 uppercase">To Date</span>
            <input type="date" className={selectClass} value={filters.toDate || ''} onChange={e => setF({ toDate: e.target.value })} />
          </label>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-mono">
        <span className="text-gray-400">{filtered.length} item{filtered.length !== 1 ? 's' : ''} matched</span>
        <span className="text-gray-400">Total value: <span className="text-white font-bold">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
      </div>

      {/* Results */}
      <div className="overflow-x-auto border border-border bg-[#09090b]">
        <table className="w-full text-left text-base">
          <thead>
            <tr className="border-b border-border bg-surface text-gray-400 uppercase text-xs font-mono tracking-wider">
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Workcell</th>
              <th className="px-4 py-3 font-medium">Supplier / PN</th>
              <th className="px-4 py-3 font-medium">Requester</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium text-right">Unit</th>
              <th className="px-4 py-3 font-medium text-right">Qty</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium">PR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {filtered.length === 0 ? (
              <tr><td colSpan={10} className="p-12 text-center text-gray-600 font-mono">NO ITEMS MATCH YOUR FILTERS</td></tr>
            ) : filtered.map(i => {
              const cat = CATEGORY_STYLES[i.category];
              return (
                <tr key={`${i.reqId}-${i.itemId}`} onClick={() => onOpenRequest(i.reqId)} className="hover:bg-white/5 cursor-pointer transition-colors group">
                  <td className="px-4 py-3 max-w-xs">
                    <div className="font-semibold text-white text-sm"><Highlight text={i.name} term={searchTerm} /></div>
                    <div className="text-xs text-gray-500 truncate max-w-[260px]"><Highlight text={i.description} term={searchTerm} /></div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setF({ category: i.category }); }}
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 border rounded-sm whitespace-nowrap hover:brightness-125 transition ${cat.badge}`}
                      title={`Filter to ${cat.label} items`}
                    >{cat.label}</button>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={(e) => { e.stopPropagation(); setF({ workcell: i.workcell }); }}
                      className="text-gray-300 hover:text-brand hover:underline transition-colors text-left"
                      title={`Filter to ${i.workcell} workcell`}
                    ><Highlight text={i.workcell} term={searchTerm} /></button>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-400">
                    <button
                      onClick={(e) => { e.stopPropagation(); setF({ supplier: i.vendor }); }}
                      className="text-gray-300 hover:text-brand hover:underline transition-colors text-left block"
                      title={`Filter to ${i.vendor}`}
                    ><Highlight text={i.vendor} term={searchTerm} /></button>
                    {i.url ? (
                      <a
                        href={i.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-400 hover:underline flex items-center gap-1"
                        title="Open product page"
                      ><Highlight text={i.mfgPartNumber} term={searchTerm} /><ExternalLink size={10} /></a>
                    ) : (
                      <span className="text-gray-600"><Highlight text={i.mfgPartNumber} term={searchTerm} /></span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={(e) => { e.stopPropagation(); setF({ requester: i.requesterName }); }}
                      className="text-gray-400 hover:text-brand hover:underline transition-colors text-left"
                      title={`See all ${i.requesterName} items`}
                    >{i.requesterName}</button>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">{new Date(i.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-gray-300">${i.pricePerUnit.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-gray-400">{i.quantity}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-white font-bold">${i.lineTotal.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); onOpenRequest(i.reqId); }}
                      className="flex items-center gap-1 text-xs font-mono text-brand hover:underline"
                      title="Open this purchase request"
                    >{i.reqId}<ExternalLink size={12} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
