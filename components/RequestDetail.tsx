import React, { useState, useRef, useEffect } from 'react';
import { PurchaseRequest, RequestStatus, Message, Priority, UserRole, ApprovalEvent } from '../types';
import { ArrowLeft, Send, Paperclip, Printer, Trash2, CheckCircle, XCircle, Clock, AlertCircle, Edit, File, X, Image as ImageIcon, Download, FileText } from 'lucide-react';
import { addMessage, processApproval, deleteRequest } from '../services/db';

interface RequestDetailProps {
  request: PurchaseRequest;
  currentUserRole: UserRole;
  onBack: () => void;
  onUpdate: () => void;
  onEdit: () => void;
}

export const RequestDetail: React.FC<RequestDetailProps> = ({ request, currentUserRole, onBack, onUpdate, onEdit }) => {
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<{name: string, type: string, data: string}[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [request.messages, selectedFiles]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const newFiles: {name: string, type: string, data: string}[] = [];
          
          for (let i = 0; i < e.target.files.length; i++) {
              const file = e.target.files[i];
              if (file.size > 2 * 1024 * 1024) {
                  alert(`File ${file.name} is too large. Max 2MB allowed.`);
                  continue;
              }

              const base64 = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(file);
              });

              newFiles.push({
                  name: file.name,
                  type: file.type,
                  data: base64
              });
          }
          
          setSelectedFiles(prev => [...prev, ...newFiles]);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const removeAttachment = (index: number) => {
      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    
    // In a real app we would store file metadata properly. Here we are jamming the base64 string
    // but appending a delimiter to simulate metadata storage: "base64|filename|type"
    const attachments = selectedFiles.map(f => `${f.data}|${f.name}|${f.type}`);

    const msg: Message = {
      id: Date.now().toString(),
      sender: currentUserRole,
      senderName: currentUserRole === 'Employee' ? request.requesterName : `ESS Team`,
      text: newMessage,
      timestamp: new Date().toISOString(),
      attachments: attachments
    };

    addMessage(request.id, msg);
    setNewMessage('');
    setSelectedFiles([]);
    onUpdate();
  };

  const handleAction = (action: 'Order' | 'Reject' | 'RequestInfo' | 'Received') => {
      if (action === 'Reject' && !note) {
          alert("Please add a note explaining the rejection.");
          return;
      }
      if (action === 'RequestInfo' && !note) {
          alert("Please add a note for the requester.");
          return;
      }

      processApproval(request.id, currentUserRole, action, note);
      setNote('');
      onUpdate();
  };

  const handleDelete = () => {
      if(confirm("Are you sure you want to delete this request? This cannot be undone.")) {
          deleteRequest(request.id);
          onBack();
      }
  };

  const renderAttachment = (attachmentStr: string) => {
      // Handle legacy attachments (just base64) vs new ones with metadata
      let dataUrl = attachmentStr;
      let name = "Attachment";
      let type = "unknown";

      if (attachmentStr.includes('|')) {
          const parts = attachmentStr.split('|');
          if (parts.length >= 3) {
              dataUrl = parts[0];
              name = parts[1];
              type = parts[2];
          }
      } else if (attachmentStr.startsWith('data:image')) {
          type = 'image/png'; // assumption for legacy
      }

      const isImage = type.startsWith('image/');

      return (
          <div className="mt-2 group relative">
              <div className="flex items-center gap-3 p-2 bg-[#09090b] border border-border rounded-sm max-w-full overflow-hidden">
                 <div className="flex-shrink-0 w-10 h-10 bg-surface flex items-center justify-center border border-border">
                     {isImage ? <ImageIcon size={20} className="text-gray-400" /> : <FileText size={20} className="text-gray-400" />}
                 </div>
                 <div className="min-w-0 flex-1">
                     <div className="text-xs text-white truncate font-medium">{name}</div>
                     <div className="text-[10px] text-gray-500 uppercase">{type.split('/')[1] || 'FILE'}</div>
                 </div>
                 <a 
                    href={dataUrl} 
                    download={name}
                    className="p-2 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Download"
                 >
                     <Download size={16} />
                 </a>
              </div>
              
              {/* Image Preview if applicable */}
              {isImage && (
                  <div className="mt-2 border border-border bg-black">
                      <img src={dataUrl} alt={name} className="max-h-48 object-contain mx-auto" />
                  </div>
              )}
          </div>
      );
  };

  // Permission Logic
  const canEdit = currentUserRole === 'Employee' && (request.status === RequestStatus.PENDING || request.status === RequestStatus.NEEDS_INFO || request.status === RequestStatus.REJECTED);
  const canDelete = currentUserRole === 'Employee' && request.status === RequestStatus.PENDING;
  const isESS = currentUserRole === 'ESS';

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-80px)] grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
      
      {/* Left Column: Details & Timeline (2/3 width) */}
      <div className="lg:col-span-2 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex-none flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-sm text-gray-400 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight leading-none uppercase">{request.projectCode}</h1>
                    <span className="text-gray-500 font-mono text-xs">ID: {request.id}</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                 {canEdit && (
                     <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-border text-white rounded-sm transition-colors text-xs font-bold uppercase tracking-wide">
                        <Edit size={14} />
                        {request.status === RequestStatus.PENDING ? 'Edit' : 'Edit & Resubmit'}
                     </button>
                 )}
                 <button onClick={() => window.print()} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-sm transition-colors">
                    <Printer size={18} />
                 </button>
                 {(canDelete || currentUserRole === 'Admin') && (
                     <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-500/10 rounded-sm transition-colors">
                        <Trash2 size={18} />
                     </button>
                 )}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin">
            
            {/* Status & Actions Banner */}
            <div className="bg-surface border border-border p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="text-xs font-mono text-gray-500 mb-1 uppercase">Current Status</div>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-white uppercase tracking-tight">{request.status}</span>
                            <span className={`w-3 h-3 ${
                                request.status === 'Ordered' ? 'bg-green-500' : 
                                request.status === 'Received' ? 'bg-teal-500' :
                                request.status === 'Rejected' ? 'bg-red-500' :
                                request.status === 'Needs Info' ? 'bg-orange-500' : 'bg-yellow-500'
                            }`}></span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                         <div className="text-3xl font-mono text-white font-bold tracking-tighter">${request.totalAmount.toFixed(2)}</div>
                         
                         {/* ESS Actions */}
                         {isESS && (
                             <div className="flex flex-wrap gap-2 justify-end">
                                {request.status !== RequestStatus.REJECTED && request.status !== RequestStatus.RECEIVED && (
                                    <button onClick={() => handleAction('Reject')} className="px-4 py-1.5 bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20 transition-colors text-xs font-bold uppercase">Reject</button>
                                )}
                                {request.status !== RequestStatus.NEEDS_INFO && request.status !== RequestStatus.RECEIVED && request.status !== RequestStatus.REJECTED && (
                                    <button onClick={() => handleAction('RequestInfo')} className="px-4 py-1.5 bg-orange-500/10 text-orange-500 border border-orange-500/50 hover:bg-orange-500/20 transition-colors text-xs font-bold uppercase">Request Info</button>
                                )}
                                {request.status !== RequestStatus.ORDERED && request.status !== RequestStatus.RECEIVED && request.status !== RequestStatus.REJECTED && (
                                    <button onClick={() => handleAction('Order')} className="px-4 py-1.5 bg-green-600 text-white hover:bg-green-500 transition-colors text-xs font-bold uppercase">Mark Ordered</button>
                                )}
                                {request.status === RequestStatus.ORDERED && (
                                    <button onClick={() => handleAction('Received')} className="px-4 py-1.5 bg-teal-600 text-white hover:bg-teal-500 transition-colors text-xs font-bold uppercase">Mark Received</button>
                                )}
                             </div>
                         )}
                    </div>
                </div>
                {isESS && (
                    <div className="mt-4 pt-4 border-t border-border">
                         <input 
                            type="text" 
                            placeholder="Add a note (required for Reject/Info)..."
                            className="w-full bg-[#09090b] border border-border px-4 py-2 text-sm text-white focus:border-white outline-none"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                         />
                    </div>
                )}
            </div>

            {/* Workflow Timeline */}
            <div className="bg-surface border border-border p-6">
                <h3 className="text-xs font-mono text-gray-500 mb-6 uppercase tracking-wider">Audit Log</h3>
                <div className="relative pl-4 space-y-8">
                    <div className="absolute left-[23px] top-2 bottom-2 w-px bg-border"></div>

                    {request.approvalTimeline.map((event, idx) => {
                        return (
                            <div key={event.id} className="relative flex items-start gap-4">
                                <div className={`relative z-10 w-3 h-3 mt-1.5 border ${
                                    event.action.includes('Rejected') ? 'bg-red-500 border-red-500' :
                                    event.action.includes('Info') ? 'bg-orange-500 border-orange-500' :
                                    event.action.includes('Ordered') ? 'bg-green-500 border-green-500' :
                                    'bg-[#09090b] border-white'
                                }`}></div>
                                <div className="flex-1 bg-black/20 p-3 border border-border">
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-white text-sm uppercase">{event.action}</span>
                                        <span className="text-[10px] font-mono text-gray-500">{new Date(event.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1 font-mono">
                                        USER: <span className="text-gray-300">{event.actorName}</span>
                                    </div>
                                    {event.note && (
                                        <div className="mt-2 text-sm text-gray-300 bg-white/5 p-2 border-l-2 border-gray-600">
                                            "{event.note}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Line Items */}
            <div className="bg-surface border border-border">
                <div className="px-6 py-4 border-b border-border font-bold text-white flex justify-between items-center bg-black/20 uppercase text-sm tracking-wider">
                    <span>Manifest</span>
                    <span className="text-xs bg-white/10 px-2 py-1 text-gray-300 font-mono">{request.items.length} ITEMS</span>
                </div>
                <div className="divide-y divide-border">
                    {request.items.map((item) => (
                        <div key={item.id} className="p-4 hover:bg-white/5 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-white text-sm">{item.name}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                                    <div className="flex gap-4 mt-2 text-[10px] font-mono text-gray-400 uppercase">
                                        <span>VEND: <span className="text-gray-300">{item.vendor}</span></span>
                                        <span>PN: <span className="text-gray-300">{item.mfgPartNumber}</span></span>
                                        {item.url && (
                                            <a href={item.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">LINK</a>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono text-white font-bold">${(item.quantity * item.pricePerUnit).toFixed(2)}</div>
                                    <div className="text-[10px] text-gray-500 uppercase">{item.quantity} {item.unitType} @ ${item.pricePerUnit}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Request Details Metadata */}
            <div className="bg-surface border border-border p-6">
                <h3 className="text-xs font-mono text-gray-500 mb-4 uppercase tracking-wider">System Metadata</h3>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div>
                        <span className="block text-gray-500 text-xs font-mono uppercase mb-1">Requester</span>
                        <span className="text-white font-medium">{request.requesterName}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs font-mono uppercase mb-1">Due Date</span>
                        <span className="text-white font-medium">{new Date(request.neededByDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs font-mono uppercase mb-1">Priority</span>
                        <span className={`font-bold uppercase text-xs px-2 py-0.5 border inline-block ${
                            request.priority === Priority.CRITICAL ? 'text-red-500 border-red-500' : 'text-white border-gray-600'
                        }`}>{request.priority}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs font-mono uppercase mb-1">Notes</span>
                        <p className="text-gray-300 text-xs">{request.notes || '-'}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Right Column: Chat/Activity (1/3 width) */}
      <div className="lg:col-span-1 bg-surface border border-border flex flex-col h-full overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-black/20">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                <AlertCircle size={14} className="text-white" />
                Comms Channel
            </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#050505]">
             {request.messages.length === 0 ? (
                 <div className="text-center text-gray-600 text-xs mt-10 font-mono uppercase">
                     // No transmission history
                 </div>
             ) : (
                 request.messages.map(msg => {
                     const isMe = msg.sender === currentUserRole || (currentUserRole === 'ESS' && msg.sender === 'ESS'); 
                     return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {/* Replaced white bubble with dark zinc theme */}
                            <div className={`max-w-[85%] border p-3 text-sm ${
                                isMe ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-black text-gray-300 border-zinc-800'
                            }`}>
                                <p>{msg.text}</p>
                                {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="space-y-2 mt-2 pt-2 border-t border-white/10">
                                        {msg.attachments.map((att, i) => (
                                            <div key={i}>{renderAttachment(att)}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <span className="text-[9px] font-mono text-gray-500 mt-1 uppercase">
                                {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                     )
                 })
             )}
             <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-3 bg-surface border-t border-border">
             {selectedFiles.length > 0 && (
                 <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                     {selectedFiles.map((file, idx) => (
                         <div key={idx} className="relative flex-none w-16 h-16 bg-black border border-border flex items-center justify-center overflow-hidden group">
                             {file.type.startsWith('image/') ? (
                                 <img src={file.data} alt="preview" className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                             ) : (
                                 <File className="text-gray-500" />
                             )}
                             <button 
                                onClick={() => removeAttachment(idx)}
                                className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                                 <X size={10} />
                             </button>
                         </div>
                     ))}
                 </div>
             )}

            <form onSubmit={handleSendMessage}>
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="TRANSMIT MESSAGE..."
                        className="w-full bg-[#09090b] border border-border pl-4 pr-12 py-3 text-sm text-white focus:border-white outline-none font-mono placeholder-gray-700"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button 
                        type="submit"
                        disabled={!newMessage.trim() && selectedFiles.length === 0}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:bg-gray-600 disabled:text-gray-400 transition-colors rounded-sm"
                    >
                        <Send size={16} />
                    </button>
                </div>
                <div className="flex justify-between items-center mt-2 px-1">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        multiple 
                        onChange={handleFileSelect}
                    />
                    <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-gray-500 hover:text-white transition-colors flex items-center gap-1.5 uppercase text-[10px] font-bold tracking-wider"
                    >
                        <Paperclip size={14} />
                        ATTACH_FILE
                    </button>
                    <span className="text-[9px] font-mono text-gray-600 uppercase">SECURE_CHANNEL_ACTIVE</span>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};