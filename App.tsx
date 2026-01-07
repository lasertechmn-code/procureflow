import React, { useState, useEffect, useMemo } from 'react';
import { Dashboard } from './components/Dashboard';
import { RequestForm } from './components/RequestForm';
import { RequestDetail } from './components/RequestDetail';
import { Analytics } from './components/Analytics';
import { Login } from './components/Login';
import { AdminPanel } from './components/AdminPanel';
import { getRequests, getRequestById, updateUserPassword } from './services/db';
import { AppState, ViewState, UserRole, RequestStatus, User } from './types';
import { LayoutDashboard, LogOut, BarChart3, Hexagon, Bell, ShieldCheck, Lock } from 'lucide-react';

const App = () => {
  const [appState, setAppState] = useState<AppState>({
    currentView: 'dashboard',
    selectedRequestId: null,
    currentUser: null
  });

  const [data, setData] = useState(getRequests());
  // Password Change Modal State
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    setData(getRequests());
  }, [appState.currentView, appState.selectedRequestId, appState.currentUser]);

  // Check for default password on login
  useEffect(() => {
      if (appState.currentUser?.isDefaultPassword) {
          setShowPwdModal(true);
      } else {
          setShowPwdModal(false);
      }
  }, [appState.currentUser]);

  const navigate = (view: ViewState, id: string | null = null) => {
    setAppState(prev => ({ ...prev, currentView: view, selectedRequestId: id }));
  };

  const handleLogin = (user: User) => {
      setAppState({
          currentUser: user,
          currentView: user.role === 'Admin' ? 'admin_panel' : 'dashboard',
          selectedRequestId: null
      });
  };

  const handleLogout = () => {
      setAppState(prev => ({ ...prev, currentUser: null }));
  };

  const handleChangePassword = (e: React.FormEvent) => {
      e.preventDefault();
      if(appState.currentUser && newPassword.length >= 4) {
          updateUserPassword(appState.currentUser.id, newPassword);
          setAppState(prev => ({
              ...prev,
              currentUser: { ...prev.currentUser!, isDefaultPassword: false }
          }));
          setShowPwdModal(false);
          setNewPassword('');
      } else {
          alert("Password too short");
      }
  };

  const handleDeferPasswordChange = () => {
      if (confirm("You will be reminded again next time you login. Continue?")) {
          setShowPwdModal(false);
      }
  };

  // Notification Logic
  const notifications = useMemo(() => {
      if (!appState.currentUser) return [];
      
      const userName = `${appState.currentUser.firstName} ${appState.currentUser.lastName} - ${appState.currentUser.jobTitle}`; // Formatting name to match DB

      if (appState.currentUser.role === 'ESS') {
          return data.filter(r => r.status === RequestStatus.PENDING);
      } else if (appState.currentUser.role === 'Employee') {
          return data.filter(r => 
              r.requesterName.includes(appState.currentUser!.lastName) && 
              (r.status === RequestStatus.NEEDS_INFO || r.status === RequestStatus.REJECTED)
          );
      }
      return [];
  }, [data, appState.currentUser]);

  const renderContent = () => {
    switch (appState.currentView) {
      case 'new_request':
        return (
          <RequestForm 
            currentUser={`${appState.currentUser?.firstName} ${appState.currentUser?.lastName} - ${appState.currentUser?.jobTitle}`}
            onCancel={() => navigate('dashboard')}
            onSave={() => navigate('dashboard')}
          />
        );
      case 'edit_request':
         if (!appState.selectedRequestId) return <div>Error: No request selected</div>;
         const requestToEdit = getRequestById(appState.selectedRequestId);
         return (
             <RequestForm 
                initialData={requestToEdit}
                currentUser={`${appState.currentUser?.firstName} ${appState.currentUser?.lastName} - ${appState.currentUser?.jobTitle}`}
                onCancel={() => navigate('detail', appState.selectedRequestId)}
                onSave={() => navigate('detail', appState.selectedRequestId)}
             />
         );
      case 'detail':
        if (!appState.selectedRequestId) return null;
        const request = getRequestById(appState.selectedRequestId);
        if (!request) return <div>Request not found</div>;
        return (
          <RequestDetail 
            request={request}
            currentUserRole={appState.currentUser?.role || 'Employee'}
            onBack={() => navigate('dashboard')}
            onUpdate={() => setData(getRequests())}
            onEdit={() => navigate('edit_request', request.id)}
          />
        );
      case 'analytics':
          return <Analytics requests={data} />;
      case 'admin_panel':
          return <AdminPanel />;
      case 'dashboard':
      default:
        return (
          <Dashboard 
            requests={data}
            role={appState.currentUser?.role || 'Employee'}
            currentUserName={`${appState.currentUser?.firstName} ${appState.currentUser?.lastName} - ${appState.currentUser?.jobTitle}`}
            onSelect={(id) => navigate('detail', id)}
            onNew={() => navigate('new_request')}
          />
        );
    }
  };

  const showAnalytics = appState.currentUser?.role === 'ESS' || appState.currentUser?.role === 'Admin';
  const isAdmin = appState.currentUser?.role === 'Admin';

  if (!appState.currentUser) {
      return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-gray-100 font-sans selection:bg-brand/20 selection:text-white">
      
      {/* Password Change Modal */}
      {showPwdModal && (
          <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
              <div className="bg-surface border-2 border-yellow-500/50 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
                  <div className="flex items-center gap-3 text-yellow-500 mb-4">
                      <Lock size={32} />
                      <h2 className="text-2xl font-bold">Security Alert</h2>
                  </div>
                  <p className="text-gray-300 mb-6">
                      You are using a default generated password. Organization policy requires you to update your credentials immediately.
                  </p>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                          <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">New Password</label>
                          <input 
                              type="password" 
                              required 
                              minLength={4}
                              className="w-full bg-black border border-border rounded px-4 py-3 text-white focus:border-brand outline-none"
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                          />
                      </div>
                      <div className="flex gap-3 pt-2">
                          <button type="submit" className="flex-1 bg-brand hover:bg-brandHover text-white py-3 rounded-lg font-bold">Update Now</button>
                          <button type="button" onClick={handleDeferPasswordChange} className="px-4 text-gray-500 hover:text-white underline text-sm">Defer</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Navbar */}
      <nav className="border-b border-border bg-[#09090b] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => isAdmin ? navigate('admin_panel') : navigate('dashboard')}>
                <Hexagon size={32} strokeWidth={1.5} className="text-logoRed fill-logoRed/10" />
                <span className="font-bold tracking-tight text-2xl text-white">PROCURE<span className="text-gray-500">FLOW</span></span>
              </div>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-1">
                  {!isAdmin && (
                    <button 
                        onClick={() => navigate('dashboard')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${appState.currentView === 'dashboard' ? 'bg-brand text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'text-gray-400 hover:text-white'}`}
                    >
                        <LayoutDashboard size={18} />
                        Dashboard
                    </button>
                  )}
                  {showAnalytics && (
                      <button 
                        onClick={() => navigate('analytics')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${appState.currentView === 'analytics' ? 'bg-brand text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'text-gray-400 hover:text-white'}`}
                      >
                          <BarChart3 size={18} />
                          Analytics
                      </button>
                  )}
                  {isAdmin && (
                      <button 
                        onClick={() => navigate('admin_panel')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${appState.currentView === 'admin_panel' ? 'bg-brand text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'text-gray-400 hover:text-white'}`}
                      >
                          <ShieldCheck size={18} />
                          Admin
                      </button>
                  )}
              </div>
          </div>

          <div className="flex items-center gap-6">
             {/* Notification Bell (Not for Admin) */}
             {!isAdmin && (
                 <div className="relative group cursor-pointer">
                     <Bell size={22} className="text-gray-400 group-hover:text-white transition-colors" />
                     {notifications.length > 0 && (
                         <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand rounded-full text-[10px] font-bold flex items-center justify-center text-white border-2 border-[#09090b]">
                             {notifications.length}
                         </span>
                     )}
                     {/* Dropdown Tooltip for Notifications */}
                     <div className="absolute right-0 top-full mt-4 w-72 bg-surface border border-border shadow-2xl rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50 invisible group-hover:visible">
                          <div className="p-4 border-b border-border text-xs font-bold uppercase tracking-wider text-gray-500">
                              System Alerts
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                              {notifications.length === 0 ? (
                                  <div className="p-6 text-center text-xs text-gray-600 font-mono">No new alerts</div>
                              ) : (
                                  notifications.map(n => (
                                      <div 
                                        key={n.id} 
                                        onClick={() => navigate('detail', n.id)}
                                        className="p-4 hover:bg-white/5 cursor-pointer border-b border-border/50 last:border-0"
                                      >
                                          <div className="flex justify-between items-start mb-1">
                                              <span className="text-xs font-bold text-white">{n.id}</span>
                                              <span className="text-[10px] text-gray-500">{new Date(n.updatedAt).toLocaleDateString()}</span>
                                          </div>
                                          <div className="text-xs text-gray-400 mb-2">{n.projectCode}</div>
                                          <div className={`text-[10px] uppercase font-bold px-2 py-1 inline-block rounded-md ${
                                              n.status === RequestStatus.NEEDS_INFO ? 'bg-orange-500/20 text-orange-400' :
                                              n.status === RequestStatus.REJECTED ? 'bg-red-500/20 text-red-400' :
                                              'bg-yellow-500/20 text-yellow-400'
                                          }`}>
                                              {n.status}
                                          </div>
                                      </div>
                                  ))
                              )}
                          </div>
                     </div>
                 </div>
             )}

             <div className="text-right hidden sm:block border-r border-border pr-6">
                 <div className="text-xs font-mono text-gray-500 uppercase tracking-wider">User ID</div>
                 <div className="text-sm font-bold text-white">{appState.currentUser.lastName}, {appState.currentUser.firstName}</div>
             </div>
             
             <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-brand transition-colors uppercase tracking-wider font-bold"
             >
                 <LogOut size={18} />
                 Sign Out
             </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;