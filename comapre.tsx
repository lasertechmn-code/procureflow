import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Minus, Send, Paperclip, FileText, CheckCircle2, 
  Clock, User, Eye, Download, Search, Filter, 
  Building2, Package, DollarSign, LinkIcon, 
  MessageSquare, Settings2, Bell, Moon, Sun,
  ChevronRight, ChevronDown, AlertCircle
} from 'lucide-react';

// Mock data — realistic, detailed
const mockRequests = [
  {
    id: 'PR-2025-001',
    title: 'Q3 Hardware Refresh — Engineering',
    status: 'submitted',
    urgency: 'high',
    createdAt: '2025-12-28T10:30:00Z',
    updatedAt: '2025-12-29T14:22:00Z',
    requester: { name: 'Alex Johnson', dept: 'Engineering', avatar: 'AJ' },
    items: [
      { 
        id: 1, 
        item: 'Laptop', 
        description: 'Dell XPS 15 Developer Edition — i9, 64GB RAM, 2TB NVMe', 
        project: 'INFRA-2025-Q3', 
        company: 'Dell Technologies', 
        partNumber: 'XPS15-DEV-2025-64', 
        link: 'https://www.dell.com/en-us/work/shop/workstations-and-all-in-ones/xps-15-laptop/spd/xps-15-9530-laptop',
        quantity: 5, 
        units: 'each', 
        price: 2499.99 
      },
      { 
        id: 2, 
        item: 'Docking Station', 
        description: 'Dell WD19TB Thunderbolt™ Dock — 240W, 14 ports', 
        project: 'INFRA-2025-Q3', 
        company: 'Dell Technologies', 
        partNumber: 'WD19TB-240W', 
        link: 'https://www.dell.com/en-us/work/shop/dell-thunderbolt-dock-wd19tb/apd/210-axoi/pc-accessories',
        quantity: 5, 
        units: 'each', 
        price: 379.99 
      }
    ],
    messages: [
      { 
        id: 1, 
        sender: { name: 'Alex Johnson', role: 'employee', avatar: 'AJ' }, 
        text: 'Team needs these by Jan 15 for new project kickoff.', 
        timestamp: '2025-12-28T10:35:00Z', 
        attachments: [] 
      },
      { 
        id: 2, 
        sender: { name: 'Maria Chen', role: 'ess', avatar: 'MC' }, 
        text: 'Can you confirm if extended 3-year ProSupport is required?', 
        timestamp: '2025-12-28T11:20:00Z', 
        attachments: [] 
      }
    ],
    total: 14399.90
  },
  {
    id: 'PR-2025-002',
    title: 'Spring Summit Branding Assets',
    status: 'approved',
    urgency: 'medium',
    createdAt: '2025-12-27T09:15:00Z',
    updatedAt: '2025-12-29T08:45:00Z',
    requester: { name: 'Sam Rivera', dept: 'Marketing', avatar: 'SR' },
    items: [
      { 
        id: 1, 
        item: 'Roll-up Banner Stands', 
        description: '36\"×84\" — Matte finish, aluminum frame, carry case', 
        project: 'MKT-2025-SPRING', 
        company: 'Vistaprint Pro', 
        partNumber: 'VS-BANNER-36X84-MATTE', 
        link: 'https://www.vistaprint.com/banners/roll-up-banners',
        quantity: 10, 
        units: 'each', 
        price: 94.50 
      },
      { 
        id: 2, 
        item: 'Trifold Brochures', 
        description: '8.5\"×11\" folded — 100lb gloss text, full color, 2,500 ct', 
        project: 'MKT-2025-SPRING', 
        company: 'Vistaprint Pro', 
        partNumber: 'VS-BROCHURE-TRI-2500', 
        link: 'https://www.vistaprint.com/brochures/tri-fold-brochures',
        quantity: 1, 
        units: 'lot', 
        price: 389.99 
      }
    ],
    messages: [
      { 
        id: 1, 
        sender: { name: 'Sam Rivera', role: 'employee', avatar: 'SR' }, 
        text: 'Trade show is March 12–14 in Chicago. Need ASAP.', 
        timestamp: '2025-12-27T09:20:00Z', 
        attachments: [{ name: 'summit_brand_guidelines.pdf', size: '2.4 MB', type: 'pdf' }] 
      },
      { 
        id: 2, 
        sender: { name: 'Maria Chen', role: 'ess', avatar: 'MC' }, 
        text: '✅ Approved. PO issued. Tracking # VSP-88421. ETA: Jan 22.', 
        timestamp: '2025-12-28T16:30:00Z', 
        attachments: [] 
      }
    ],
    total: 1334.99
  }
];

const STATUS_CONFIG = {
  draft: { label: 'DRAFT', color: '#64748b', bg: '#1e293b', border: '#334155' },
  submitted: { label: 'SUBMITTED', color: '#38bdf8', bg: '#0c4a6e', border: '#075985' },
  review: { label: 'IN REVIEW', color: '#fbbf24', bg: '#7c2d12', border: '#9a3412' },
  approved: { label: 'APPROVED', color: '#34d399', bg: '#065f46', border: '#0d9488' },
  ordered: { label: 'ORDERED', color: '#c084fc', bg: '#581c87', border: '#7e22ce' },
  received: { label: 'RECEIVED', color: '#60a5fa', bg: '#1e3a8a', border: '#2563eb' }
};

const URGENCY_CONFIG = {
  low: { label: 'Low', color: '#94a3b8' },
  medium: { label: 'Medium', color: '#fbbf24' },
  high: { label: 'High', color: '#f87171' }
};

const App = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRequest, setCurrentRequest] = useState(mockRequests[0]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [userRole, setUserRole] = useState('ess'); // 'employee' or 'ess'
  const [expandedItems, setExpandedItems] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentRequest?.messages]);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatDate = (iso) => {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleItemExpand = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleStatusChange = (status) => {
    if (!currentRequest) return;
    setCurrentRequest({ ...currentRequest, status });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e6e6e6] font-sans antialiased">
      {/* Global Styles & Fonts */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Neue+Haas+Grotesk+Display+Pro:wght@500;700&family=GT+Pressura+Mono:wght@400;500;700&display=swap');
        
        :root {
          --font-display: 'Neue Haas Grotesk Display Pro', system-ui, sans-serif;
          --font-mono: 'GT Pressura Mono', ui-monospace, monospace;
        }
        
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        .border-separator {
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03), inset 0 -1px 0 rgba(0,0,0,0.3);
        }
        
        .card-bevel {
          box-shadow: 
            0 2px 0 rgba(255,255,255,0.02),
            0 4px 8px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.05),
            inset 0 -1px 0 rgba(0,0,0,0.5);
        }
        
        .status-badge {
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.75rem;
          border-radius: 0;
        }
      `}</style>

      {/* Header — Editorial Masthead Style */}
      <header className="border-b border-[#1a1a1c] bg-[#0d0d0f] px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-end space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#b87333] flex items-center justify-center">
                <Package className="w-5 h-5 text-[#0a0a0b]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  Procure<span className="text-[#b87333]">Flow</span>
                </h1>
                <p className="text-[#64748b] text-sm -mt-0.5">Executive Procurement Console</p>
              </div>
            </div>
            <div className="w-px h-8 bg-[#1a1a1c]"></div>
            <nav className="flex space-x-6 text-sm">
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'requests', label: 'Requests' },
                { id: 'new', label: 'New Request' },
                { id: 'review', label: 'Review Queue', show: userRole === 'ess' }
              ].filter(i => !i.show || i.show).map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`pb-2 px-1 relative font-medium ${
                    activeTab === item.id 
                      ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#b87333]' 
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded hover:bg-[#1a1a1c] transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5 text-[#b87333]" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <button className="p-2 rounded hover:bg-[#1a1a1c] relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff2e4d] rounded-full"></span>
            </button>
            
            <div className="flex items-center space-x-3 px-3 py-2 bg-[#121214] border border-[#1a1a1c]">
              <div className="w-8 h-8 bg-[#3b82f6] rounded-sm flex items-center justify-center text-xs font-bold">
                {userRole === 'employee' ? 'AJ' : 'MC'}
              </div>
              <div className="text-left">
                <div className="font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                  {userRole === 'employee' ? 'Alex Johnson' : 'Maria Chen'}
                </div>
                <div className="text-[#64748b] text-xs">{userRole === 'employee' ? 'Engineering' : 'ESS Lead'}</div>
              </div>
              <select 
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="ml-2 bg-transparent border-0 focus:ring-0 text-xs appearance-none"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
              >
                <option value="employee">Employee</option>
                <option value="ess">ESS Reviewer</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar — Minimalist Navigation */}
        <aside className="w-64 border-r border-[#1a1a1c] bg-[#0d0d0f] p-6 flex flex-col">
          <div className="mb-8">
            <h2 className="text-xs font-bold tracking-widest text-[#64748b] mb-4 uppercase">Quick Stats</h2>
            <div className="space-y-3">
              {[
                { label: 'Total Requests', value: mockRequests.length, color: '#94a3b8' },
                { label: 'Pending Review', value: mockRequests.filter(r => r.status === 'submitted').length, color: '#fbbf24' },
                { label: 'Urgent Items', value: mockRequests.filter(r => r.urgency === 'high').length, color: '#f87171' }
              ].map((stat, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-[#64748b]">{stat.label}:</span>
                  <span className="font-mono" style={{ color: stat.color }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-[#1a1a1c]">
            <h3 className="text-xs font-bold tracking-widest text-[#64748b] mb-3 uppercase">System</h3>
            <button className="flex items-center space-x-3 w-full text-left p-2 hover:bg-[#1a1a1c] rounded text-sm">
              <Settings2 className="w-4 h-4" />
              <span>Preferences</span>
            </button>
            <button className="flex items-center space-x-3 w-full text-left p-2 hover:bg-[#1a1a1c] rounded text-sm">
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Hero Section */}
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    Executive Dashboard
                  </h1>
                  <p className="text-[#94a3b8] max-w-2xl">
                    Real-time procurement intelligence. {mockRequests.length} active requests. Last updated {new Date().toLocaleTimeString()}.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('new')}
                  className="flex items-center space-x-2 bg-[#b87333] hover:bg-[#8b5a2b] text-[#0a0a0b] px-5 py-3 font-bold tracking-wide transition-colors"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <Plus className="w-4 h-4" />
                  <span>NEW REQUEST</span>
                </button>
              </div>

              {/* Status Overview — Horizontal Bar Chart Style */}
              <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                  const count = mockRequests.filter(r => r.status === status).length;
                  const pct = (count / mockRequests.length) * 100;
                  return (
                    <div key={status} className="bg-[#121214] p-5 border border-[#1a1a1c] card-bevel">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[#64748b] text-sm font-mono">{config.label}</span>
                        <span className="font-bold text-lg">{count}</span>
                      </div>
                      <div className="w-full bg-[#1a1a1c] rounded-sm h-2">
                        <div 
                          className="h-full rounded-sm"
                          style={{ 
                            width: `${pct}%`, 
                            backgroundColor: config.color,
                            boxShadow: `inset 0 0 4px ${config.color}80`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recent Requests — Editorial Grid */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                    Recent Activity
                  </h2>
                  <button className="text-[#64748b] hover:text-white flex items-center space-x-1 text-sm">
                    <span>View All</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {mockRequests.map(request => {
                    const status = STATUS_CONFIG[request.status];
                    return (
                      <div 
                        key={request.id}
                        onClick={() => {
                          setCurrentRequest(request);
                          setActiveTab('request');
                        }}
                        className="group cursor-pointer bg-[#121214] border border-[#1a1a1c] card-bevel hover:border-[#b87333] transition-all duration-300"
                      >
                        <div className="p-6">
                          <div className="flex items-start">
                            <div className="flex-1 pr-6">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-bold group-hover:text-[#b87333] transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
                                  {request.title}
                                </h3>
                                <span 
                                  className="status-badge"
                                  style={{ 
                                    color: status.color, 
                                    backgroundColor: status.bg,
                                    borderColor: status.border
                                  }}
                                >
                                  {status.label}
                                </span>
                                {request.urgency === 'high' && (
                                  <span className="flex items-center space-x-1 text-[#f87171] text-xs font-mono">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>URGENT</span>
                                  </span>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                                <div>
                                  <span className="text-[#64748b]">Requester:</span>
                                  <span className="ml-2 font-medium">{request.requester.name}</span>
                                </div>
                                <div>
                                  <span className="text-[#64748b]">Project:</span>
                                  <span className="ml-2 font-mono text-[#b87333]">{request.items[0]?.project}</span>
                                </div>
                                <div>
                                  <span className="text-[#64748b]">Total:</span>
                                  <span className="ml-2 font-bold text-lg">{formatCurrency(request.total)}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center text-[#94a3b8] text-xs">
                                <span>#{request.id} • Created {formatDate(request.createdAt)} • {request.items.length} items</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end justify-between">
                              <div className="w-10 h-10 bg-[#1a1a1c] border border-[#1a1a1c] flex items-center justify-center">
                                <Eye className="w-4 h-4 text-[#64748b] group-hover:text-white transition-colors" />
                              </div>
                              <ChevronRight className="w-5 h-5 text-[#64748b] group-hover:text-[#b87333] transition-colors" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Request Detail View — Cinematic, Data-Rich */}
          {(activeTab === 'request' || activeTab === 'review') && currentRequest && (
            <div className="space-y-8">
              {/* Request Header */}
              <div className="flex items-start justify-between">
                <div className="max-w-3xl">
                  <div className="flex items-center space-x-4 mb-2">
                    <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                      {currentRequest.title}
                    </h1>
                    <span 
                      className="status-badge px-4 py-1.5"
                      style={{ 
                        color: STATUS_CONFIG[currentRequest.status].color,
                        backgroundColor: STATUS_CONFIG[currentRequest.status].bg,
                        borderColor: STATUS_CONFIG[currentRequest.status].border
                      }}
                    >
                      {STATUS_CONFIG[currentRequest.status].label}
                    </span>
                    {currentRequest.urgency === 'high' && (
                      <span className="px-3 py-1 bg-[#1a1a1c] border border-[#f87171] text-[#f87171] text-xs font-mono font-bold">
                        URGENT
                      </span>
                    )}
                  </div>
                  <p className="text-[#94a3b8]">
                    Request #{currentRequest.id} • Created {formatDate(currentRequest.createdAt)} • Last updated {formatDate(currentRequest.updatedAt)}
                  </p>
                </div>

                {userRole === 'ess' && (
                  <div className="flex space-x-3">
                    <select
                      value={currentRequest.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="bg-[#121214] border border-[#1a1a1c] text-white px-4 py-2 font-mono text-sm appearance-none"
                      style={{ WebkitAppearance: 'none', backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3e%3cpath fill='%2394a3b8' d='M7 10l5 5 5-5z'/%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em' }}
                    >
                      {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                        <option key={value} value={value} className="bg-[#0a0a0b]">{config.label}</option>
                      ))}
                    </select>
                    <button className="p-2 bg-[#121214] border border-[#1a1a1c] hover:border-[#b87333]">
                      <Settings2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Requester Info */}
              <div className="flex items-center space-x-4 p-5 bg-[#121214] border border-[#1a1a1c] card-bevel max-w-2xl">
                <div className="w-12 h-12 bg-[#3b82f6] rounded-sm flex items-center justify-center text-lg font-bold">
                  {currentRequest.requester.avatar}
                </div>
                <div>
                  <div className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                    {currentRequest.requester.name}
                  </div>
                  <div className="text-[#94a3b8] text-sm">{currentRequest.requester.dept}</div>
                </div>
              </div>

              {/* Items Table — Editorial Layout */}
              <div className="bg-[#121214] border border-[#1a1a1c] card-bevel">
                <div className="px-6 py-4 border-b border-[#1a1a1c] flex items-center justify-between">
                  <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Request Details</h2>
                  <div className="text-lg font-bold text-[#b87333]">{formatCurrency(currentRequest.total)}</div>
                </div>

                <div className="divide-y divide-[#1a1a1c]">
                  {currentRequest.items.map((item, idx) => {
                    const isExpanded = expandedItems[item.id];
                    return (
                      <div key={item.id} className="group">
                        <div 
                          className="px-6 py-4 hover:bg-[#1a1a1c] cursor-pointer transition-colors"
                          onClick={() => toggleItemExpand(item.id)}
                        >
                          <div className="grid grid-cols-12 gap-4 items-start">
                            <div className="col-span-3 font-bold font-mono text-[#b87333]">{item.item}</div>
                            <div className="col-span-3 text-[#e6e6e6]">{item.description.substring(0, isExpanded ? 200 : 60)}{!isExpanded && item.description.length > 60 ? '...' : ''}</div>
                            <div className="col-span-2 font-mono text-[#64748b]">{item.project}</div>
                            <div className="col-span-1 text-right font-mono">{item.quantity}</div>
                            <div className="col-span-1 text-right font-mono">{formatCurrency(item.price)}</div>
                            <div className="col-span-1 text-right font-bold font-mono text-[#b87333]">
                              {formatCurrency(item.quantity * item.price)}
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <ChevronDown 
                                className={`w-4 h-4 text-[#64748b] transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                              />
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-6 pb-4 bg-[#0d0d0f] border-t border-[#1a1a1c]">
                            <div className="grid grid-cols-2 gap-6 text-sm">
                              <div>
                                <div className="text-[#64748b] mb-1">Company</div>
                                <div className="font-medium">{item.company}</div>
                              </div>
                              <div>
                                <div className="text-[#64748b] mb-1">Part Number</div>
                                <div className="font-mono text-[#b87333]">{item.partNumber}</div>
                              </div>
                              <div className="col-span-2">
                                <div className="text-[#64748b] mb-1">Purchase Link</div>
                                <a 
                                  href={item.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-2 text-[#3b82f6] hover:text-[#60a5fa] group/link"
                                >
                                  <LinkIcon className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                                  <span className="underline">{item.link}</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Discussion Thread — Editorial Messaging */}
              <div className="bg-[#121214] border border-[#1a1a1c] card-bevel">
                <div className="px-6 py-4 border-b border-[#1a1a1c] flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center space-x-2" style={{ fontFamily: 'var(--font-display)' }}>
                    <MessageSquare className="w-5 h-5" />
                    <span>Discussion</span>
                    <span className="text-[#64748b] text-sm font-normal">({currentRequest.messages.length} messages)</span>
                  </h2>
                  <button className="text-[#64748b] hover:text-white flex items-center space-x-1 text-sm">
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </div>

                <div className="p-6 max-h-96 overflow-y-auto space-y-5">
                  {currentRequest.messages.map((msg, idx) => (
                    <div 
                      key={msg.id} 
                      className={`p-5 rounded ${msg.sender.role === 'employee' ? 'bg-[#0d1b2a]' : 'bg-[#1a1226]'}`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-[#3b82f6] rounded-sm flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {msg.sender.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline space-x-3 mb-2">
                            <span className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                              {msg.sender.name}
                            </span>
                            <span className="text-[#64748b] text-sm">{formatDate(msg.timestamp)}</span>
                          </div>
                          <p className="leading-relaxed">{msg.text}</p>
                          {msg.attachments.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {msg.attachments.map((file, i) => (
                                <div key={i} className="flex items-center space-x-1 bg-[#1a1a1c] px-3 py-1.5 rounded text-sm">
                                  <FileText className="w-3.5 h-3.5" />
                                  <span className="font-mono">{file.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Composer */}
                <div className="border-t border-[#1a1a1c] p-6">
                  <div className="flex space-x-3">
                    <div className="flex-1 relative">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Add your message..."
                        className="w-full bg-[#1a1a1c] border border-[#1a1a1c] rounded px-4 py-3 focus:outline-none focus:border-[#b87333] resize-none"
                        rows="3"
                      />
                      {selectedFile && (
                        <div className="absolute top-2 right-3 bg-[#121214] px-2 py-1 rounded text-xs flex items-center space-x-1">
                          <FileText className="w-3 h-3" />
                          <span>{selectedFile.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button 
                        className="w-12 h-12 bg-[#1a1a1c] border border-[#1a1a1c] rounded flex items-center justify-center hover:border-[#b87333] transition-colors"
                        onClick={() => document.getElementById('file-upload').click()}
                      >
                        <Paperclip className="w-5 h-5" />
                        <input
                          id="file-upload"
                          type="file"
                          onChange={(e) => setSelectedFile(e.target.files[0])}
                          className="hidden"
                        />
                      </button>
                      <button 
                        onClick={() => {
                          if (newMessage.trim()) {
                            const newMsg = {
                              id: Date.now(),
                              sender: { 
                                name: userRole === 'employee' ? 'Alex Johnson' : 'Maria Chen',
                                role: userRole,
                                avatar: userRole === 'employee' ? 'AJ' : 'MC'
                              },
                              text: newMessage,
                              timestamp: new Date().toISOString(),
                              attachments: selectedFile ? [{ name: selectedFile.name, size: '1.2 MB' }] : []
                            };
                            setCurrentRequest({
                              ...currentRequest,
                              messages: [...currentRequest.messages, newMsg],
                              updatedAt: new Date().toISOString()
                            });
                            setNewMessage('');
                            setSelectedFile(null);
                          }
                        }}
                        disabled={!newMessage.trim()}
                        className="w-12 h-12 bg-[#b87333] hover:bg-[#8b5a2b] disabled:bg-[#1a1a1c] disabled:border disabled:border-[#1a1a1c] rounded flex items-center justify-center transition-colors"
                      >
                        <Send className="w-5 h-5 text-[#0a0a0b]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* New Request Form — Minimalist, Focused */}
          {activeTab === 'new' && (
            <div className="space-y-8">
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    New Purchase Request
                  </h1>
                  <p className="text-[#94a3b8]">Start with a single item. Add more as needed.</p>
                </div>
                <button className="flex items-center space-x-2 bg-[#b87333] hover:bg-[#8b5a2b] text-[#0a0a0b] px-5 py-3 font-bold tracking-wide transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>CREATE REQUEST</span>
                </button>
              </div>

              <div className="bg-[#121214] border border-[#1a1a1c] card-bevel">
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#94a3b8] mb-2">Request Title</label>
                      <input
                        type="text"
                        placeholder="e.g., Q3 Hardware Refresh"
                        className="w-full bg-[#1a1a1c] border border-[#1a1a1c] rounded px-4 py-3 focus:outline-none focus:border-[#b87333]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#94a3b8] mb-2">Urgency</label>
                      <select className="w-full bg-[#1a1a1c] border border-[#1a1a1c] rounded px-4 py-3 focus:outline-none focus:border-[#b87333] appearance-none">
                        <option>Medium</option>
                        <option>High</option>
                        <option>Low</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>Items</h3>
                      <button className="text-[#3b82f6] hover:text-[#60a5fa] flex items-center space-x-1 text-sm">
                        <Plus className="w-4 h-4" />
                        <span>Add Item</span>
                      </button>
                    </div>

                    <div className="border border-[#1a1a1c] rounded">
                      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[#1a1a1c] text-[#94a3b8] text-xs font-mono uppercase tracking-wider">
                        <div className="col-span-2">Item</div>
                        <div className="col-span-3">Description</div>
                        <div className="col-span-2">Project</div>
                        <div className="col-span-2">Company</div>
                        <div className="col-span-1 text-right">Qty</div>
                        <div className="col-span-1 text-right">Price</div>
                        <div className="col-span-1"></div>
                      </div>
                      
                      {/* Sample item */}
                      <div className="grid grid-cols-12 gap-4 px-4 py-3 border-t border-[#1a1a1c]">
                        <div className="col-span-2">
                          <input 
                            type="text" 
                            defaultValue="Laptop" 
                            className="w-full bg-transparent focus:outline-none font-mono"
                          />
                        </div>
                        <div className="col-span-3">
                          <input 
                            type="text" 
                            defaultValue="Dell XPS 15 Developer Edition" 
                            className="w-full bg-transparent focus:outline-none"
                          />
                        </div>
                        <div className="col-span-2">
                          <input 
                            type="text" 
                            defaultValue="INFRA-2025-Q3" 
                            className="w-full bg-transparent focus:outline-none font-mono text-[#b87333]"
                          />
                        </div>
                        <div className="col-span-2">
                          <input 
                            type="text" 
                            defaultValue="Dell" 
                            className="w-full bg-transparent focus:outline-none"
                          />
                        </div>
                        <div className="col-span-1 text-right">
                          <input 
                            type="number" 
                            defaultValue="5" 
                            className="w-16 bg-transparent focus:outline-none text-right font-mono"
                          />
                        </div>
                        <div className="col-span-1 text-right">
                          <input 
                            type="number" 
                            defaultValue="2499.99" 
                            className="w-20 bg-transparent focus:outline-none text-right font-mono"
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button className="p-1 text-[#f87171] hover:bg-[#1a1a1c] rounded">
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end">
                      <div className="text-right">
                        <div className="text-[#64748b]">Subtotal</div>
                        <div className="text-2xl font-bold text-[#b87333]">$12,499.95</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
