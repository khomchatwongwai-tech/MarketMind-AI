import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Mail,
} from 'lucide-react';
import { SupportTicket, UserProfile } from '../types/user';
import { UserService } from '../services/userService';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

export const ContactSupportModal: React.FC<ContactSupportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>('Technical / Bug');
  const [priority, setPriority] = useState<SupportTicket['priority']>('Medium');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [myTickets, setMyTickets] = useState<SupportTicket[]>(UserService.getSupportTickets());
  const [viewTab, setViewTab] = useState<'create' | 'history'>('create');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    UserService.createSupportTicket({
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: currentUser.name,
      subject: subject.trim(),
      category,
      priority,
      message: message.trim(),
    });

    setMyTickets(UserService.getSupportTickets());
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setSubject('');
      setMessage('');
      setViewTab('history');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none animate-in fade-in">
      <div className="bg-[#15171a] border border-[#2d3139] rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl text-[#e2e8f0]">
        {/* Header */}
        <div className="p-4 bg-[#1c1f24] border-b border-[#2d3139] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#6366f1]/20 border border-[#6366f1]/40 flex items-center justify-center text-[#818cf8]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>Priority Quant Support Desk</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded font-mono">
                  SLA: &lt; 5 MINS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Direct access to our quant engineering &amp; institutional market data teams
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#2d3139] rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex border-b border-[#2d3139] bg-[#121316] px-4 gap-2 text-xs font-bold">
          <button
            onClick={() => setViewTab('create')}
            className={`py-2 px-3 border-b-2 transition ${
              viewTab === 'create'
                ? 'border-[#6366f1] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Submit New Ticket
          </button>
          <button
            onClick={() => setViewTab('history')}
            className={`py-2 px-3 border-b-2 transition ${
              viewTab === 'history'
                ? 'border-[#6366f1] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Ticket History ({myTickets.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {viewTab === 'create' ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              {isSubmitted ? (
                <div className="p-6 bg-emerald-950/30 border border-emerald-500/40 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h3 className="text-sm font-bold text-white">Ticket Submitted Successfully!</h3>
                  <p className="text-xs text-slate-300">
                    Our quant desk has received your inquiry. A response will be dispatched shortly to <span className="font-mono text-emerald-400">{currentUser.email}</span>.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e: any) => setCategory(e.target.value)}
                        className="w-full bg-[#1c1f24] border border-[#2d3139] focus:border-[#6366f1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="Technical / Bug">Technical Issue / Bug</option>
                        <option value="Market Data Feed">Market Data &amp; WebSocket Feed</option>
                        <option value="Subscription & Billing">Subscription &amp; Invoices</option>
                        <option value="API & Webhooks">Programmatic API &amp; Webhooks</option>
                        <option value="Feature Request">Feature Suggestion</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Urgency / Priority
                      </label>
                      <select
                        value={priority}
                        onChange={(e: any) => setPriority(e.target.value)}
                        className="w-full bg-[#1c1f24] border border-[#2d3139] focus:border-[#6366f1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-semibold"
                      >
                        <option value="Low">Low (General Question)</option>
                        <option value="Medium">Medium (Operational Inquiry)</option>
                        <option value="High">High (Data / Feed Degradation)</option>
                        <option value="Urgent">Urgent (Live Execution Blocker)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief summary of your inquiry..."
                      className="w-full bg-[#1c1f24] border border-[#2d3139] focus:border-[#6366f1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Detailed Message &amp; Diagnostic Context
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      placeholder="Describe what you observed, ticker symbols, or endpoint URLs..."
                      className="w-full bg-[#1c1f24] border border-[#2d3139] focus:border-[#6366f1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none leading-relaxed"
                      required
                    />
                  </div>

                  <div className="pt-2 flex justify-between items-center">
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Mail className="w-3 h-3 text-[#818cf8]" />
                      <span>Direct email: support@marketmind.ai</span>
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Ticket</span>
                    </button>
                  </div>
                </>
              )}
            </form>
          ) : (
            <div className="space-y-3">
              {myTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-3.5 bg-[#1c1f24] rounded-lg border border-[#2d3139] space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400">{ticket.id}</span>
                        <h4 className="font-bold text-xs text-white">{ticket.subject}</h4>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {ticket.category} &bull; Priority: {ticket.priority} &bull; {ticket.createdAt}
                      </span>
                    </div>

                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                        ticket.status === 'Resolved'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 bg-[#15171a] p-2 rounded border border-[#23272f]">
                    {ticket.message}
                  </p>

                  {ticket.response && (
                    <div className="p-2.5 bg-[#6366f1]/10 rounded border border-[#6366f1]/30 space-y-1">
                      <span className="text-[10px] font-bold text-[#a5b4fc] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#818cf8]" />
                        Support Desk Response:
                      </span>
                      <p className="text-[11px] text-slate-200">{ticket.response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
