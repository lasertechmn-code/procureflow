import React, { useMemo, useState } from 'react';
import { PurchaseRequest, RequestStatus, Priority, UserRole } from '../types';
import { Search, Plus, Clock, FileText, CheckCircle, Package, Truck, XCircle, AlertCircle, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  requests: PurchaseRequest[];
  role: UserRole;
  currentUserName: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}

const StatusBadge = ({ status }: { status: RequestStatus }) => {
  // Industrial Style: Solid colors or high contrast outlines, no soft glows
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
    <span className={`flex items-center gap-2 px-2.5 py-1 rounded-sm text-[11px] font-mono uppercase tracking-wide border ${styles[status]}`}>
      <Icon size={12} strokeWidth={2.5} />
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
  return <span className={`text-xs font-mono uppercase ${styles[priority]}`}>{priority}</span>;
};

const RequestTable = ({ requests, onSelect }: { requests: PurchaseRequest[], onSelect: (id: string) => void }) => {
    if (requests.length === 0) {
        return <div className="p-12 text-center border border-dashed border-border text-gray-600 font-mono text-sm">NO DATA AVAILABLE</div>
    }
    return (
        <div className="overflow-x-auto border border-border bg-[#09090b]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-gray-500 uppercase text-[10px] font-mono tracking-wider">
                <th className="px-6 py-3 font-medium">ID</th>
                <th className="px-6 py-3 font-medium">Project</th>
                <th className="px-6 py-3 font-medium">Requester</th>
                <th className="px-6 py-3 font-medium">Items</th>
                <th className="px-6 py-3 font-medium">Total</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Priority</th>
                <th className="px-6 py-3 font-medium">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
               {requests.map((req) => (
                <tr 
                    key={req.id} 
                    onClick={() => onSelect(req.id)}
                    className="hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4 font-mono text-xs text-gray-400 group-hover:text-white transition-colors">{req.id}</td>
                  <td className="px-6 py-4 font-medium text-white">{req.projectCode}</td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{req.requesterName}</td>
                  <td className="px-6 py-4 text-gray-400 font-mono text-xs">{req.items.length}</td>
                  <td className="px-6 py-4 text-white font-mono tracking-tight">${req.totalAmount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-6 py-4"><PriorityBadge priority={req.priority} /></td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{new Date(req.neededByDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ requests, role, currentUserName, onSelect, onNew }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const roleFilteredRequests = useMemo(() => {
      if (role === 'Employee') {
          return requests.filter(r => r.requesterName === currentUserName);
      }
      return requests;
  }, [requests, role, currentUserName]);

  const searchedRequests = useMemo(() => {
      return roleFilteredRequests.filter(r => 
        r.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [roleFilteredRequests, searchTerm]);

  const pendingRequests = useMemo(() => {
      return searchedRequests.filter(r => r.status === RequestStatus.PENDING);
  }, [searchedRequests]);

  const historyRequests = useMemo(() => {
      return searchedRequests.filter(r => r.status !== RequestStatus.PENDING);
  }, [searchedRequests]);


  return (
    <div className="space-y-8">
      
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
            <input 
                type="text" 
                placeholder={role === 'Employee' ? "Search requests..." : "Search all records..."}
                className="w-full bg-black border border-border rounded-sm pl-10 pr-4 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-brand transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        {role === 'Employee' && (
             <button 
                onClick={onNew}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand hover:bg-brandHover text-white px-5 py-2 rounded-sm text-sm font-bold uppercase tracking-wide transition-colors"
            >
                <Plus size={16} />
                Create Request
            </button>
        )}
      </div>

      {/* ESS: Pending / Action Required Section */}
      {role === 'ESS' && (
          <div className="space-y-3">
             <div className="flex items-center gap-3 text-yellow-500 mb-2 pl-1">
                 <AlertCircle size={18} />
                 <h2 className="text-sm font-bold tracking-widest uppercase">Action Required</h2>
                 <span className="bg-yellow-500 text-black px-1.5 py-0.5 text-[10px] font-bold font-mono">
                     {pendingRequests.length}
                 </span>
             </div>
             <RequestTable requests={pendingRequests} onSelect={onSelect} />
          </div>
      )}

      {/* Main Table */}
      <div className="space-y-3">
         <div className="flex items-center gap-2 pl-1 pt-4">
            <h2 className="text-sm font-bold text-gray-500 tracking-widest uppercase">
                {role === 'ESS' ? 'History Log' : 'Active Requests'}
            </h2>
         </div>
         
         <RequestTable requests={role === 'ESS' ? historyRequests : searchedRequests} onSelect={onSelect} />
      </div>
    </div>
  );
};