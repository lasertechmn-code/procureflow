import React, { useMemo, useState } from 'react';
import { PurchaseRequest, RequestStatus, ExplorerFilters } from '../types';
import { BarChart, DollarSign, Clock, List, Download, User } from 'lucide-react';

interface AnalyticsProps {
  requests: PurchaseRequest[];
  currentUserName: string;
  onOpenExplorer: (filters: ExplorerFilters) => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({ requests, currentUserName, onOpenExplorer }) => {
  const [viewMode, setViewMode] = useState<'personal' | 'global'>('personal');

  const myRequests = useMemo(
    () => requests.filter(r => r.requesterName === currentUserName),
    [requests, currentUserName]
  );

  const activeRequests = viewMode === 'personal' ? myRequests : requests;

  const stats = useMemo<{
    totalSpend: number;
    openRequests: number;
    avgHours: number;
    spendByProject: Record<string, number>;
    statusCounts: Record<string, number>;
  }>(() => {
    const totalSpend = activeRequests.reduce((acc, r) => acc + r.totalAmount, 0);
    const openRequests = activeRequests.filter(r => r.status.includes('Pending')).length;
    
    // Calculate avg time from Submitted to Ordered
    const completedReqs = activeRequests.filter(r => 
        r.approvalTimeline.some(e => e.action === 'Submitted') && 
        r.approvalTimeline.some(e => e.action === 'Ordered')
    );
    
    let avgHours = 0;
    if (completedReqs.length > 0) {
        const totalDurationMs = completedReqs.reduce((acc, r) => {
            const submitted = new Date(r.approvalTimeline.find(e => e.action === 'Submitted')!.timestamp).getTime();
            const ordered = new Date(r.approvalTimeline.find(e => e.action === 'Ordered')!.timestamp).getTime();
            return acc + (ordered - submitted);
        }, 0);
        avgHours = (totalDurationMs / completedReqs.length) / (1000 * 60 * 60);
    }

    // Spend by Project
    const spendByProject: Record<string, number> = {};
    activeRequests.forEach(r => {
        spendByProject[r.projectCode] = (spendByProject[r.projectCode] || 0) + r.totalAmount;
    });

    // Status Count
    const statusCounts: Record<string, number> = {};
    activeRequests.forEach(r => {
        statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });

    return { totalSpend, openRequests, avgHours, spendByProject, statusCounts };
  }, [activeRequests]);

  const spendByProjectEntries = Object.entries(stats.spendByProject) as Array<[string, number]>;
  const statusEntries = Object.entries(stats.statusCounts) as Array<[string, number]>;
  const maxProjectSpend = Math.max(...spendByProjectEntries.map(([, amount]) => amount), 1);

  const myTotalSpend = useMemo(() => myRequests.reduce((acc, r) => acc + r.totalAmount, 0), [myRequests]);
  const globalTotalSpend = useMemo(() => requests.reduce((acc, r) => acc + r.totalAmount, 0), [requests]);
  const myPct = globalTotalSpend > 0 ? (myTotalSpend / globalTotalSpend) * 100 : 0;

  // Distinct colors for projects
  const projectColors = [
      'bg-blue-500', 
      'bg-purple-500', 
      'bg-emerald-500', 
      'bg-amber-500', 
      'bg-pink-500', 
      'bg-cyan-500', 
      'bg-rose-500'
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-12">

      {/* Personal vs Global toggle */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1">
          <button
            onClick={() => setViewMode('personal')}
            className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-mono uppercase tracking-wide transition-colors ${viewMode === 'personal' ? 'bg-brand text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <User size={14} />
            My Stats
          </button>
          <button
            onClick={() => setViewMode('global')}
            className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-mono uppercase tracking-wide transition-colors ${viewMode === 'global' ? 'bg-brand text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <BarChart size={14} />
            Global
          </button>
        </div>
        <div className="text-sm font-mono text-gray-500">
          Viewing: <span className="text-white font-bold">{viewMode === 'personal' ? currentUserName : 'All Users'}</span>
          {viewMode === 'global' && <span className="ml-3 text-gray-600">({requests.length} total PRs)</span>}
        </div>
      </div>

      {/* My Allocation vs Global card — always visible */}
      <div className="bg-surface border border-border p-6 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">Your Allocation vs Total Spend</p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-white">${myTotalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-gray-500 font-mono">/ ${globalTotalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total</span>
              <span className="text-brand font-bold font-mono">{myPct.toFixed(1)}%</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono text-gray-600 uppercase">My PRs: {myRequests.length} &nbsp;|&nbsp; All PRs: {requests.length}</p>
          </div>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
          <div
            className="bg-brand h-full rounded-full transition-all duration-500"
            style={{ width: `${myPct}%` }}
            title={`Your share: ${myPct.toFixed(1)}%`}
          />
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-surface border border-border">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-900/30 text-blue-400 rounded-lg">
                      <DollarSign size={24} />
                  </div>
                  <div>
                      <p className="text-base text-gray-400">Total Spend</p>
                      <p className="text-3xl font-bold text-white">${stats.totalSpend.toLocaleString()}</p>
                  </div>
              </div>
          </div>
          <div className="p-6 rounded-xl bg-surface border border-border cursor-pointer hover:border-yellow-700/60 transition-colors" onClick={() => onOpenExplorer({ status: RequestStatus.PENDING })} title="View pending items">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-900/30 text-yellow-400 rounded-lg">
                      <List size={24} />
                  </div>
                  <div>
                      <p className="text-base text-gray-400">Open Requests</p>
                      <p className="text-3xl font-bold text-white">{stats.openRequests}</p>
                  </div>
              </div>
          </div>
          <div className="p-6 rounded-xl bg-surface border border-border">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-900/30 text-emerald-400 rounded-lg">
                      <Clock size={24} />
                  </div>
                  <div>
                      <p className="text-base text-gray-400">Avg. Approval Time</p>
                      <p className="text-3xl font-bold text-white">{stats.avgHours.toFixed(1)} hrs</p>
                  </div>
              </div>
          </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spend By Project Chart */}
          <div className="p-6 rounded-xl bg-surface border border-border">
              <h3 className="text-xl font-semibold text-white mb-6">Spend by Workcell</h3>
              <div className="space-y-5">
                  {spendByProjectEntries
                    .sort(([, a], [, b]) => b - a)
                    .map(([project, amount], index) => {
                      const colorClass = projectColors[index % projectColors.length];
                      return (
                          <div key={project} className="cursor-pointer group" onClick={() => onOpenExplorer({ workcell: project })} title={`Browse ${project} items`}>
                              <div className="flex justify-between text-base mb-1.5">
                                  <span className="text-gray-300 font-medium group-hover:text-brand transition-colors">{project}</span>
                                  <span className="text-white font-mono font-bold">${amount.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                                  <div 
                                    className={`${colorClass} h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,0,0,0.3)]`}
                                    style={{ width: `${(amount / maxProjectSpend) * 100}%` }}
                                  ></div>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>

          {/* Status Distribution */}
          <div className="p-6 rounded-xl bg-surface border border-border">
              <h3 className="text-xl font-semibold text-white mb-6">Request Status Distribution</h3>
              <div className="flex flex-wrap gap-4">
                  {statusEntries.map(([status, count]) => (
                      <div key={status} onClick={() => onOpenExplorer({ status })} className="flex-1 min-w-[120px] p-4 bg-background/50 rounded-lg border border-border cursor-pointer hover:border-brand/50 transition-colors" title={`View ${status} items`}>
                          <p className="text-sm text-gray-400 mb-1">{status}</p>
                          <p className="text-3xl font-bold text-white">{count}</p>
                      </div>
                  ))}
              </div>
              <div className="mt-8">
                  <p className="text-base text-gray-400 mb-2">Request Volume</p>
                   <div className="flex w-full h-4 rounded-full overflow-hidden">
                      {statusEntries.map(([status, count], i) => {
                          const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-yellow-500', 'bg-red-500', 'bg-gray-500'];
                          return (
                              <div 
                                key={status} 
                                className={`${colors[i % colors.length]} h-full`}
                                style={{ width: `${(count / activeRequests.length) * 100}%` }}
                                title={`${status}: ${count}`}
                              ></div>
                          )
                      })}
                   </div>
              </div>
          </div>
      </div>

      {/* Detailed Request List */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border flex justify-between items-center bg-black/20">
              <h3 className="text-xl font-semibold text-white">
                {viewMode === 'personal' ? 'My Request Transactions' : 'All Request Transactions'}
              </h3>
              <span className="text-sm font-mono text-gray-500">{activeRequests.length} records</span>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-base">
                  <thead className="bg-black/20 text-gray-400">
                      <tr>
                          <th className="px-6 py-3 font-medium">ID</th>
                          <th className="px-6 py-3 font-medium">Date</th>
                          <th className="px-6 py-3 font-medium">Requester</th>
                          <th className="px-6 py-3 font-medium">Project</th>
                          <th className="px-6 py-3 font-medium">Items</th>
                          <th className="px-6 py-3 font-medium">Status</th>
                          <th className="px-6 py-3 font-medium text-right">Amount</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                      {activeRequests.map(r => {
                          const isMe = r.requesterName === currentUserName;
                          return (
                          <tr key={r.id} className={`transition-colors ${isMe && viewMode === 'global' ? 'bg-brand/5 hover:bg-brand/10' : 'hover:bg-white/5'}`}>
                              <td className="px-6 py-3 font-mono text-gray-400">{r.id}</td>
                              <td className="px-6 py-3 text-gray-300">{new Date(r.createdAt).toLocaleDateString()}</td>
                              <td className={`px-6 py-3 font-medium ${isMe ? 'text-brand' : 'text-white'}`}>
                                {r.requesterName}
                                {isMe && viewMode === 'global' && <span className="ml-2 text-[10px] font-mono bg-brand/20 text-brand px-1.5 py-0.5 rounded uppercase">You</span>}
                              </td>
                              <td className="px-6 py-3 text-gray-300">{r.projectCode}</td>
                              <td className="px-6 py-3 text-gray-400">{r.items.length}</td>
                              <td className="px-6 py-3">
                                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                      r.status === 'Ordered' ? 'bg-green-500' :
                                      r.status === 'Rejected' ? 'bg-red-500' :
                                      r.status === 'Received' ? 'bg-teal-500' :
                                      r.status.includes('Pending') ? 'bg-yellow-500' : 'bg-gray-500'
                                  }`}></span>
                                  {r.status}
                              </td>
                              <td className="px-6 py-3 text-right font-mono text-white">${r.totalAmount.toFixed(2)}</td>
                          </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};