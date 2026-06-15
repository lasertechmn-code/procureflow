import React, { useMemo, useState } from 'react';
import { PurchaseRequest, RequestStatus, Priority, UserRole, ExplorerFilters } from '../types';
import { Search, Plus, Clock, FileText, CheckCircle, Package, Truck, XCircle, AlertCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { Highlight } from '../services/itemCategory';

interface DashboardProps {
  requests: PurchaseRequest[];
  role: UserRole;
  currentUserName: string;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onOpenExplorer: (filters: ExplorerFilters) => void;
}

// Fuzzy-ish search: all tokens in query must appear somewhere in the target string
const fuzzyMatch = (target: string, query: string): boolean => {
  const t = target.toLowerCase();
  return query.toLowerCase().split(/\s+/).filter(Boolean).every(token => t.includes(token));
};

const prMatchesSearch = (r: PurchaseRequest, query: string): boolean => {
  if (!query.trim()) return true;
  // Top-level fields
  const topLevel = [r.id, r.projectCode, r.requesterName, r.notes, r.status, r.priority].join(' ');
  if (fuzzyMatch(topLevel, query)) return true;
  // Line item fields
  return r.items.some(item =>
    fuzzyMatch(
      [item.name, item.description, item.vendor, item.mfgPartNumber, item.itemType ?? '', item.buildCell ?? ''].join(' '),
      query
    )
  );
};

const StatusBadge = ({ status }: { status: RequestStatus }) => {
  const styles = {
    [RequestStatus.DRAFT]: 'text-gray-500 border-gray-700',
    [RequestStatus.PENDING]: 'text-yellow-500 border-yellow-700 bg-yellow-500/10',
    [RequestStatus.NEEDS_INFO]: 'text-orange-500 border-orange-700 bg-orange-500/10',
    [RequestStatus.ORDERED]: 'text-green-500 border-green-700 bg-green-500/10',
    [RequestStatus.RECEIVED]: 'text-teal-400 border-teal-800 bg-teal-500/10',
    [RequestStatus.REJECTED]: 'text-red-500 border-red-800 bg-red-500/10',
    [RequestStatus.CANCELLED]: 'text-gray-500 border-gray-700 decoration-line-through',
  };

  const icons = {
    [RequestStatus.DRAFT]: FileText,
    [RequestStatus.PENDING]: Clock,
    [RequestStatus.NEEDS_INFO]: AlertTriangle,
    [RequestStatus.ORDERED]: Truck,
    [RequestStatus.RECEIVED]: CheckCircle,
    [RequestStatus.REJECTED]: XCircle,
    [RequestStatus.CANCELLED]: XCircle,
  };

  const Icon = icons[status] || FileText;

  return (
    <span className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-mono uppercase tracking-wide border ${styles[status]}`}>
      <Icon size={14} strokeWidth={2.5} />
      {status}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const styles = {
    [Priority.LOW]: 'text-gray-500',
    [Priority.NORMAL]: 'text-blue-400',
    [Priority.HIGH]: 'text-orange-400 font-bold',
    [Priority.CRITICAL]: 'text-red-500 font-extrabold',
  };
  return <span className={`text-base font-mono uppercase ${styles[priority]}`}>{priority}</span>;
};

const RequestTable = ({ requests, onSelect, searchTerm, onOpenWorkcell }: { requests: PurchaseRequest[], onSelect: (id: string) => void, searchTerm: string, onOpenWorkcell: (wc: string) => void }) => {
    if (requests.length === 0) {
        return <div className="p-14 text-center border border-dashed border-border text-gray-600 font-mono text-lg">NO DATA AVAILABLE</div>
    }
    return (
        <div className="overflow-x-auto border border-border bg-[#09090b]">
          <table className="w-full text-left text-base">
            <thead>
              <tr className="border-b border-border bg-surface text-gray-400 uppercase text-sm font-mono tracking-wider">
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium">Workcell</th>
                <th className="px-6 py-4 font-medium">Requester</th>
                <th className="px-6 py-4 font-medium">Items</th>
                <th className="px-6 py-4 font-medium">Total</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Priority</th>
                <th className="px-6 py-4 font-medium">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
               {requests.map((req) => (
                <tr 
                    key={req.id} 
                    onClick={() => onSelect(req.id)}
                    className="hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-5 font-mono text-base text-gray-400 group-hover:text-white transition-colors">{req.id}</td>
                  <td className="px-6 py-5 font-semibold text-white text-base">
                    <button
                      onClick={(e) => { e.stopPropagation(); onOpenWorkcell(req.projectCode); }}
                      className="hover:text-brand hover:underline transition-colors text-left"
                      title={`Browse all ${req.projectCode} items`}
                    >
                      <Highlight text={req.projectCode} term={searchTerm} />
                    </button>
                  </td>
                  <td className="px-6 py-5 text-gray-300 text-base"><Highlight text={req.requesterName} term={searchTerm} /></td>
                  <td className="px-6 py-5 text-gray-400 font-mono text-base">{req.items.length}</td>
                  <td className="px-6 py-5 text-white font-mono tracking-tight text-base">${req.totalAmount.toFixed(2)}</td>
                  <td className="px-6 py-5">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-6 py-5"><PriorityBadge priority={req.priority} /></td>
                  <td className="px-6 py-5 font-mono text-base text-gray-400">{new Date(req.neededByDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ requests, role, currentUserName, searchTerm, onSearchChange, onSelect, onNew, onOpenExplorer }) => {
  const [searchAll, setSearchAll] = useState(role !== 'Employee');

  // Base pool: own PRs vs all PRs controlled by checkbox
  const basePool = useMemo(() => {
    if (searchAll) return requests;
    return requests.filter(r => r.requesterName === currentUserName);
  }, [requests, currentUserName, searchAll]);

  const searchedRequests = useMemo(() => {
    return basePool.filter(r => prMatchesSearch(r, searchTerm));
  }, [basePool, searchTerm]);

  const pendingRequests = useMemo(() => {
      return searchedRequests.filter(r => r.status === RequestStatus.PENDING);
  }, [searchedRequests]);

  const historyRequests = useMemo(() => {
      return searchedRequests.filter(r => r.status !== RequestStatus.PENDING);
  }, [searchedRequests]);

  const matchHint = searchTerm.trim()
    ? `${searchedRequests.length} result${searchedRequests.length !== 1 ? 's' : ''}`
    : null;

  const openWorkcell = (wc: string) => onOpenExplorer({ workcell: wc });

  return (
    <div className="space-y-8">
      
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-[480px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                  type="text" 
                  placeholder="Search items, vendors, part numbers, notes..."
                  className="w-full bg-black border border-border rounded-sm pl-11 pr-4 py-3 text-base text-white placeholder-gray-600 focus:outline-none focus:border-brand transition-colors"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
              />
              {matchHint && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-500">{matchHint}</span>
              )}
          </div>
          {/* Search scope toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={searchAll}
              onChange={e => setSearchAll(e.target.checked)}
              className="w-4 h-4 accent-brand cursor-pointer"
            />
            <span className="text-sm font-mono text-gray-400 uppercase tracking-wide">
              Search all PRs {!searchAll && <span className="text-gray-600">(currently: my PRs only)</span>}
            </span>
          </label>
          {/* CTA: jump into the flattened item catalog with the current term */}
          <button
            onClick={() => onOpenExplorer({ search: searchTerm })}
            className="flex items-center gap-1.5 text-sm font-mono text-brand hover:underline w-fit"
          >
            <Package size={14} />
            {searchTerm.trim() ? `Find "${searchTerm}" in the item catalog` : 'Browse the full item catalog'}
            <ArrowRight size={14} />
          </button>
        </div>

        {role === 'Employee' && (
             <button 
                onClick={onNew}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand hover:bg-brandHover text-white px-8 py-3 rounded-sm text-base font-bold uppercase tracking-wide transition-colors"
            >
                <Plus size={18} />
                Create Request
            </button>
        )}
      </div>

      {/* ESS: Pending / Action Required Section */}
      {role === 'ESS' && (
          <div className="space-y-3">
             <div className="flex items-center gap-3 text-yellow-500 mb-2 pl-1">
                 <AlertCircle size={20} />
                 <h2 className="text-lg font-bold tracking-widest uppercase">Action Required</h2>
                 <span className="bg-yellow-500 text-black px-2 py-0.5 text-sm font-bold font-mono">
                     {pendingRequests.length}
                 </span>
             </div>
             <RequestTable requests={pendingRequests} onSelect={onSelect} searchTerm={searchTerm} onOpenWorkcell={openWorkcell} />
          </div>
      )}

      {/* Main Table */}
      <div className="space-y-3">
         <div className="flex items-center gap-2 pl-1 pt-4">
            <h2 className="text-lg font-bold text-gray-500 tracking-widest uppercase">
                {role === 'ESS' ? 'History Log' : (searchAll ? 'All Requests' : 'My Requests')}
            </h2>
         </div>
         
         <RequestTable requests={role === 'ESS' ? historyRequests : searchedRequests} onSelect={onSelect} searchTerm={searchTerm} onOpenWorkcell={openWorkcell} />
      </div>
    </div>
  );
};