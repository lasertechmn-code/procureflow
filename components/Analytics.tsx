import React, { useMemo } from 'react';
import { PurchaseRequest, RequestStatus } from '../types';
import { BarChart, DollarSign, Clock, List, Download } from 'lucide-react';

interface AnalyticsProps {
  requests: PurchaseRequest[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ requests }) => {
  const stats = useMemo(() => {
    const totalSpend = requests.reduce((acc, r) => acc + r.totalAmount, 0);
    const openRequests = requests.filter(r => r.status.includes('Pending')).length;
    
    // Calculate avg time from Submitted to Ordered
    const completedReqs = requests.filter(r => 
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
    requests.forEach(r => {
        spendByProject[r.projectCode] = (spendByProject[r.projectCode] || 0) + r.totalAmount;
    });

    // Status Count
    const statusCounts: Record<string, number> = {};
    requests.forEach(r => {
        statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });

    return { totalSpend, openRequests, avgHours, spendByProject, statusCounts };
  }, [requests]);

  const maxProjectSpend = Math.max(...Object.values(stats.spendByProject), 1);

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
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-surface border border-border">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-900/30 text-blue-400 rounded-lg">
                      <DollarSign size={24} />
                  </div>
                  <div>
                      <p className="text-sm text-gray-400">Total Spend</p>
                      <p className="text-2xl font-bold text-white">${stats.totalSpend.toLocaleString()}</p>
                  </div>
              </div>
          </div>
          <div className="p-6 rounded-xl bg-surface border border-border">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-900/30 text-yellow-400 rounded-lg">
                      <List size={24} />
                  </div>
                  <div>
                      <p className="text-sm text-gray-400">Open Requests</p>
                      <p className="text-2xl font-bold text-white">{stats.openRequests}</p>
                  </div>
              </div>
          </div>
          <div className="p-6 rounded-xl bg-surface border border-border">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-900/30 text-emerald-400 rounded-lg">
                      <Clock size={24} />
                  </div>
                  <div>
                      <p className="text-sm text-gray-400">Avg. Approval Time</p>
                      <p className="text-2xl font-bold text-white">{stats.avgHours.toFixed(1)} hrs</p>
                  </div>
              </div>
          </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spend By Project Chart */}
          <div className="p-6 rounded-xl bg-surface border border-border">
              <h3 className="text-lg font-medium text-white mb-6">Spend by Project</h3>
              <div className="space-y-5">
                  {Object.entries(stats.spendByProject)
                    .sort(([, a], [, b]) => b - a)
                    .map(([project, amount], index) => {
                      const colorClass = projectColors[index % projectColors.length];
                      return (
                          <div key={project}>
                              <div className="flex justify-between text-sm mb-1.5">
                                  <span className="text-gray-300 font-medium">{project}</span>
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
              <h3 className="text-lg font-medium text-white mb-6">Request Status Distribution</h3>
              <div className="flex flex-wrap gap-4">
                  {Object.entries(stats.statusCounts).map(([status, count]) => (
                      <div key={status} className="flex-1 min-w-[120px] p-4 bg-background/50 rounded-lg border border-border">
                          <p className="text-xs text-gray-400 mb-1">{status}</p>
                          <p className="text-2xl font-bold text-white">{count}</p>
                      </div>
                  ))}
              </div>
              <div className="mt-8">
                  <p className="text-sm text-gray-400 mb-2">Request Volume</p>
                   <div className="flex w-full h-4 rounded-full overflow-hidden">
                      {Object.entries(stats.statusCounts).map(([status, count], i) => {
                          const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-yellow-500', 'bg-red-500', 'bg-gray-500'];
                          return (
                              <div 
                                key={status} 
                                className={`${colors[i % colors.length]} h-full`}
                                style={{ width: `${(count / requests.length) * 100}%` }}
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
              <h3 className="text-lg font-medium text-white">All Request Transactions</h3>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition-colors">
                  <Download size={16} />
                  Export CSV
              </button>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
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
                      {requests.map(r => (
                          <tr key={r.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-3 font-mono text-gray-400">{r.id}</td>
                              <td className="px-6 py-3 text-gray-300">{new Date(r.createdAt).toLocaleDateString()}</td>
                              <td className="px-6 py-3 text-white">{r.requesterName}</td>
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
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};