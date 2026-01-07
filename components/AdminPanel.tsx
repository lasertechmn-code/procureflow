import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getUsers, addUser, adminResetPassword, generateDefaultPassword } from '../services/db';
import { ShieldCheck, UserPlus, RefreshCw, Lock, Copy } from 'lucide-react';

export const AdminPanel: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    
    // Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [role, setRole] = useState<UserRole>('Employee');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [tempPassword, setTempPassword] = useState<{userId: string, pwd: string} | null>(null);

    useEffect(() => {
        setUsers(getUsers());
    }, []);

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const newUser = addUser(firstName, lastName, jobTitle, role, username);
            setUsers(getUsers());
            setTempPassword({ userId: newUser.id, pwd: generateDefaultPassword(firstName, lastName) });
            setShowAddModal(false);
            setFirstName(''); setLastName(''); setJobTitle(''); setUsername(''); setRole('Employee');
        } catch (err: any) {
            setError(err.message || 'Failed to add user');
        }
    };

    const handleResetPassword = (userId: string) => {
        if(confirm("Are you sure you want to reset this user's password to default?")) {
            const newPwd = adminResetPassword(userId);
            setUsers(getUsers());
            setTempPassword({ userId, pwd: newPwd });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="text-brand" />
                        Admin Console
                    </h2>
                    <p className="text-gray-400 text-sm font-mono mt-1">USER_MANAGEMENT // SECURITY_V4</p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-brand hover:bg-brandHover text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-brand/20"
                >
                    <UserPlus size={18} />
                    Add New User
                </button>
            </div>

            {/* Temporary Password Display Banner */}
            {tempPassword && (
                <div className="bg-green-500/10 border border-green-500/50 p-4 rounded-lg flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                    <div>
                        <p className="text-green-400 font-bold mb-1">Success</p>
                        <p className="text-gray-300 text-sm">
                            Password for user set to: <span className="font-mono bg-black px-2 py-0.5 rounded text-white font-bold">{tempPassword.pwd}</span>
                        </p>
                    </div>
                    <button onClick={() => setTempPassword(null)} className="text-gray-500 hover:text-white">Close</button>
                </div>
            )}

            <div className="bg-[#09090b] border border-border rounded-xl overflow-hidden shadow-2xl">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-border bg-surface text-gray-500 uppercase text-[10px] font-mono tracking-wider">
                            <th className="px-6 py-4">Identity</th>
                            <th className="px-6 py-4">Role / Title</th>
                            <th className="px-6 py-4">Username</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-white text-base">{user.lastName}, {user.firstName}</div>
                                    <div className="text-xs text-gray-500 font-mono">ID: {user.id}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${
                                        user.role === 'Admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                        user.role === 'ESS' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                        'bg-brand/20 text-brand border border-brand/30'
                                    }`}>
                                        {user.role}
                                    </div>
                                    <div className="text-gray-400 text-xs">{user.jobTitle}</div>
                                </td>
                                <td className="px-6 py-4 font-mono text-gray-300">{user.username}</td>
                                <td className="px-6 py-4">
                                    {user.isDefaultPassword ? (
                                        <span className="flex items-center gap-1.5 text-yellow-500 text-xs font-bold bg-yellow-500/10 px-2 py-1 rounded w-fit">
                                            <Lock size={12} /> Default Pwd
                                        </span>
                                    ) : (
                                        <span className="text-green-500 text-xs font-bold bg-green-500/10 px-2 py-1 rounded w-fit">
                                            Secure
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleResetPassword(user.id)}
                                        className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                                        title="Reset Password"
                                    >
                                        <RefreshCw size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#09090b] border border-border p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
                        <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
                        <h3 className="text-xl font-bold text-white mb-6">Provision New User</h3>
                        
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">First Name</label>
                                    <input 
                                        required 
                                        className="w-full bg-black border border-border rounded px-3 py-2 text-white focus:border-brand outline-none" 
                                        value={firstName} onChange={e => setFirstName(e.target.value)} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">Last Name</label>
                                    <input 
                                        required 
                                        className="w-full bg-black border border-border rounded px-3 py-2 text-white focus:border-brand outline-none" 
                                        value={lastName} onChange={e => setLastName(e.target.value)} 
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">Job Title / Dept</label>
                                <input 
                                    required 
                                    className="w-full bg-black border border-border rounded px-3 py-2 text-white focus:border-brand outline-none" 
                                    value={jobTitle} onChange={e => setJobTitle(e.target.value)} 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">Role</label>
                                    <select 
                                        className="w-full bg-black border border-border rounded px-3 py-2 text-white focus:border-brand outline-none" 
                                        value={role} onChange={e => setRole(e.target.value as UserRole)}
                                    >
                                        <option value="Employee">Employee</option>
                                        <option value="ESS">ESS</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">Username</label>
                                    <input 
                                        required 
                                        className="w-full bg-black border border-border rounded px-3 py-2 text-white focus:border-brand outline-none" 
                                        value={username} onChange={e => setUsername(e.target.value)} 
                                    />
                                </div>
                            </div>

                            {error && <div className="text-red-500 text-xs p-2 bg-red-500/10 rounded border border-red-500/20">{error}</div>}

                            <div className="pt-4">
                                <button type="submit" className="w-full bg-brand hover:bg-brandHover text-white py-3 rounded-lg font-bold">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};