import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { authenticateUser } from '../services/db';
import { ChevronRight, Hexagon, Lock, User as UserIcon, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
        const user = authenticateUser(username, password);
        setIsLoading(false);

        if (user) {
            onLogin(user);
        } else {
            setError('Invalid credentials.');
        }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex w-full bg-[#050505] text-white overflow-hidden">
      
      {/* Left Side - Graphic & Branding */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 border-r border-border/30">
         <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
             {/* Tech Circuit SVG Background */}
             <svg className="w-full h-full" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
                <circle cx="400" cy="400" r="300" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="10 5" className="animate-spin-slow" />
                <circle cx="400" cy="400" r="200" fill="none" stroke="#27272a" strokeWidth="2" />
                <path d="M400,100 L400,700 M100,400 L700,400" stroke="#3b82f6" strokeWidth="1" opacity="0.3" />
                <rect x="350" y="350" width="100" height="100" fill="none" stroke="#EE3124" strokeWidth="2" />
             </svg>
         </div>
         
         <div className="z-10 mt-20">
             <div className="flex items-center gap-4 mb-6">
                <Hexagon size={64} strokeWidth={1.5} className="text-logoRed fill-logoRed/10" />
                <h1 className="text-6xl font-extrabold tracking-tighter text-white">
                    PROCURE<span className="text-gray-600">FLOW</span>
                </h1>
             </div>
             <p className="text-xl text-gray-400 max-w-md font-light leading-relaxed">
                 Enterprise Resource Planning & Purchase Request Authorization System.
             </p>
         </div>

         <div className="z-10">
             <div className="flex gap-4 mb-4">
                 <div className="h-2 w-24 bg-logoRed"></div>
                 <div className="h-2 w-8 bg-brand"></div>
                 <div className="h-2 w-2 bg-gray-600"></div>
             </div>
             <p className="text-xs font-mono text-gray-600">SYSTEM STATUS: ONLINE // V4.0.1</p>
         </div>
      </div>

      {/* Right Side - Big Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 relative">
          <div className="w-full max-w-xl space-y-10">
              
              <div className="space-y-2">
                  <h2 className="text-4xl font-bold text-white">Authenticate</h2>
                  <p className="text-gray-400">Enter your personnel credentials to access the secure network.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-8">
                  <div className="space-y-6">
                      <div className="relative group">
                          <label className="block text-sm font-mono text-brand mb-2 uppercase tracking-wider font-bold">Username / ID</label>
                          <div className="relative">
                              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand transition-colors" size={24} />
                              <input 
                                  type="text" 
                                  required
                                  autoFocus
                                  className="w-full bg-[#09090b] border-2 border-border px-14 py-5 text-xl text-white placeholder-gray-700 focus:outline-none focus:border-brand transition-all rounded-lg"
                                  placeholder="username"
                                  value={username}
                                  onChange={(e) => setUsername(e.target.value)}
                              />
                          </div>
                      </div>

                      <div className="relative group">
                          <label className="block text-sm font-mono text-brand mb-2 uppercase tracking-wider font-bold">Secure Key</label>
                          <div className="relative">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand transition-colors" size={24} />
                              <input 
                                  type="password" 
                                  required
                                  className="w-full bg-[#09090b] border-2 border-border px-14 py-5 text-xl text-white placeholder-gray-700 focus:outline-none focus:border-brand transition-all rounded-lg"
                                  placeholder="••••••••"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                              />
                          </div>
                      </div>
                  </div>

                  {error && (
                      <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-400">
                          <AlertCircle size={24} />
                          <span className="font-medium text-lg">{error}</span>
                      </div>
                  )}

                  <button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-brand hover:bg-brandHover text-white text-xl font-bold py-6 rounded-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transform hover:-translate-y-1"
                  >
                      {isLoading ? (
                          <span className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></span>
                      ) : (
                          <>
                              INITIATE SESSION <ChevronRight size={28} strokeWidth={3} />
                          </>
                      )}
                  </button>
              </form>

              {/* Helpful Hint for demo/mock purpose, tailored to the new logic */}
              <div className="pt-8 border-t border-border/50 text-center">
                  <p className="text-sm text-gray-500 mb-4">
                      <span className="font-bold text-gray-400">Default Password Policy:</span> Last Name + First Initial (e.g., 'JonesG')
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                      <button onClick={() => { setUsername('morgan'); setPassword('ElliotM'); }} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-xs text-gray-400 border border-border">Morgan (Employee)</button>
                      <button onClick={() => { setUsername('mike'); setPassword('GreereM'); }} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-xs text-gray-400 border border-border">Mike (ESS)</button>
                      <button onClick={() => { setUsername('admin'); setPassword('admin123'); }} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-xs text-gray-400 border border-border">System Admin</button>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};