import React, { useState } from 'react';
import {
  ShieldAlert,
  Users,
  DollarSign,
  Activity,
  MessageSquare,
  Radio,
  Sparkles,
  Search,
  CheckCircle2,
  Trash2,
  Lock,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Send,
} from 'lucide-react';
import { SupportTicket, UserProfile } from '../types/user';
import { UserService } from '../services/userService';

interface AdminDashboardViewProps {
  currentUser: UserProfile;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tickets' | 'broadcast'>('overview');
  const [tickets, setTickets] = useState<SupportTicket[]>(UserService.getSupportTickets());
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('CPI Report release scheduled for 08:30 AM ET tomorrow. Expect heightened index volatility.');
  const [broadcastActive, setBroadcastActive] = useState(true);
  const [broadcastSaved, setBroadcastSaved] = useState(false);

  // Mock user roster for admin
  const [usersList, setUsersList] = useState<Array<{ id: string; name: string; email: string; plan: string; joined: string; apiCalls: number; status: string }>>([
    { id: 'usr_admin', name: 'Master Administrator', email: 'khomchatwongwai@gmail.com', plan: 'Enterprise', joined: '2025-01-15', apiCalls: 84290, status: 'Active' },
    { id: 'usr_hedge_1', name: 'Citadel Quant Desk', email: 'trading@citadel-mock.com', plan: 'Enterprise', joined: '2025-03-10', apiCalls: 541200, status: 'Active' },
    { id: 'usr_prop_2', name: 'Apex Prop Traders', email: 'desk@apexprop-mock.com', plan: 'Institutional', joined: '2025-04-02', apiCalls: 189400, status: 'Active' },
    { id: 'usr_pro_3', name: 'Marcus Sterling', email: 'm.sterling@capital.io', plan: 'Pro', joined: '2025-06-18', apiCalls: 24500, status: 'Active' },
    { id: 'usr_free_4', name: 'Elena Rostova', email: 'elena.r@gmail.com', plan: 'Free', joined: '2025-07-22', apiCalls: 1240, status: 'Active' },
  ]);

  const handleResolveTicket = (ticketId: string) => {
    if (!replyText.trim()) return;
    UserService.resolveSupportTicket(ticketId, replyText.trim());
    setTickets(UserService.getSupportTickets());
    setSelectedTicket(null);
    setReplyText('');
  };

  const handleSaveBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcastSaved(true);
    setTimeout(() => setBroadcastSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 select-none text-[#e2e8f0]">
      {/* Header Bar */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>MarketMind Master Administration Console</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded font-mono font-bold">
                ROOT PRIVILEGES
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Authenticated Admin: <span className="text-white font-mono">{currentUser.email}</span>
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-[#1c1f24] p-1 rounded-lg border border-[#2d3139] text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1 rounded transition ${
              activeTab === 'overview' ? 'bg-[#6366f1] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Telemetry &amp; MRR
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1 rounded transition ${
              activeTab === 'users' ? 'bg-[#6366f1] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Users ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-3 py-1 rounded transition ${
              activeTab === 'tickets' ? 'bg-[#6366f1] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Support Tickets ({tickets.filter((t) => t.status === 'Open').length} Open)
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-3 py-1 rounded transition ${
              activeTab === 'broadcast' ? 'bg-[#6366f1] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Emergency Banner
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#181a1f] border border-[#2d3139] rounded-xl p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-emerald-400" />
                Monthly Recurring Rev (MRR)
              </span>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-1">$48,920</div>
              <span className="text-[10px] text-slate-400 font-mono">+18.4% this month</span>
            </div>

            <div className="bg-[#181a1f] border border-[#2d3139] rounded-xl p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3 text-[#818cf8]" />
                Active Terminal Seats
              </span>
              <div className="text-2xl font-black font-mono text-[#818cf8] mt-1">1,482</div>
              <span className="text-[10px] text-slate-400 font-mono">312 Pro &bull; 86 Inst</span>
            </div>

            <div className="bg-[#181a1f] border border-[#2d3139] rounded-xl p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3 h-3 text-purple-400" />
                API Queries / 24h
              </span>
              <div className="text-2xl font-black font-mono text-purple-400 mt-1">4.2M</div>
              <span className="text-[10px] text-slate-400 font-mono">Avg Latency: 16ms</span>
            </div>

            <div className="bg-[#181a1f] border border-[#2d3139] rounded-xl p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Gemini 3.7 Inferences
              </span>
              <div className="text-2xl font-black font-mono text-amber-400 mt-1">184,200</div>
              <span className="text-[10px] text-emerald-400 font-mono">100% Success Rate</span>
            </div>
          </div>

          <div className="bg-[#181a1f] border border-[#2d3139] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Real-Time Server Node Health
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 bg-[#14161a] border border-[#2d3139] rounded-lg space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">NY4 Equinix Primary:</span>
                  <span className="text-emerald-400 font-bold">12ms (99.99%)</span>
                </div>
                <div className="w-full bg-[#23272f] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full w-[99%]" />
                </div>
              </div>

              <div className="p-3 bg-[#14161a] border border-[#2d3139] rounded-lg space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Chicago CME Gateway:</span>
                  <span className="text-emerald-400 font-bold">18ms (99.98%)</span>
                </div>
                <div className="w-full bg-[#23272f] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full w-[98%]" />
                </div>
              </div>

              <div className="p-3 bg-[#14161a] border border-[#2d3139] rounded-lg space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Gemini Flash AI Pool:</span>
                  <span className="text-emerald-400 font-bold">340ms (100%)</span>
                </div>
                <div className="w-full bg-[#23272f] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full w-[100%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="bg-[#181a1f] border border-[#2d3139] rounded-xl overflow-hidden">
          <div className="p-3 border-b border-[#2d3139] flex justify-between items-center bg-[#15171a]">
            <h3 className="text-xs font-bold text-white uppercase font-mono">
              Registered Institutional Seats &amp; API Usage
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Showing {usersList.length} Active Accounts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1c1f24] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-[#2d3139]">
                <tr>
                  <th className="p-3">User / Organization</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Subscription Tier</th>
                  <th className="p-3">Joined Date</th>
                  <th className="p-3">API Calls (30d)</th>
                  <th className="p-3">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23272f]">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-[#1c1f24]/70">
                    <td className="p-3 font-bold text-white">{u.name}</td>
                    <td className="p-3 font-mono text-slate-300">{u.email}</td>
                    <td className="p-3">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                        u.plan === 'Enterprise'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : u.plan === 'Institutional'
                          ? 'bg-[#6366f1]/20 text-[#a5b4fc] border border-[#6366f1]/40'
                          : u.plan === 'Pro'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-700/40 text-slate-400 border border-slate-600'
                      }`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-400">{u.joined}</td>
                    <td className="p-3 font-mono font-bold text-white">{u.apiCalls.toLocaleString()}</td>
                    <td className="p-3">
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3" />
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUPPORT TICKETS TAB */}
      {activeTab === 'tickets' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 bg-[#181a1f] border border-[#2d3139] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase font-mono border-b border-[#2d3139] pb-2">
              Incoming Support Queue
            </h3>
            <div className="space-y-2">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTicket(t);
                    setReplyText(t.response || '');
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    selectedTicket?.id === t.id
                      ? 'bg-[#6366f1]/20 border-[#6366f1]'
                      : 'bg-[#14161a] border-[#2d3139] hover:border-slate-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-xs text-white">{t.subject}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                      t.status === 'Open'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{t.message}</p>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    {t.userName} &bull; {t.category} &bull; Priority: {t.priority}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-6 bg-[#181a1f] border border-[#2d3139] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase font-mono border-b border-[#2d3139] pb-2">
              Ticket Resolution Desk
            </h3>
            {selectedTicket ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#14161a] border border-[#2d3139] rounded-lg space-y-1">
                  <div className="font-bold text-white">{selectedTicket.subject}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    From: {selectedTicket.userName} ({selectedTicket.userEmail}) &bull; {selectedTicket.createdAt}
                  </div>
                  <p className="text-slate-300 pt-1 leading-relaxed">{selectedTicket.message}</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Official Admin Resolution Response
                  </label>
                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type official reply to dispatch..."
                    className="w-full bg-[#14161a] border border-[#2d3139] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#6366f1]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleResolveTicket(selectedTicket.id)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Send Resolution &amp; Close Ticket</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs font-mono">
                Select a ticket from the left column to review and dispatch a response.
              </div>
            )}
          </div>
        </div>
      )}

      {/* BROADCAST BANNER TAB */}
      {activeTab === 'broadcast' && (
        <div className="bg-[#181a1f] border border-[#2d3139] rounded-xl p-5 space-y-4 max-w-2xl">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Emergency Terminal Broadcast Dispatcher
            </h3>
            <p className="text-xs text-slate-400">
              Broadcast critical market events, scheduled maintenance, or volatility notices to all active terminals worldwide.
            </p>
          </div>

          <form onSubmit={handleSaveBroadcast} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Banner Message Text
              </label>
              <textarea
                rows={3}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full bg-[#14161a] border border-[#2d3139] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#6366f1]"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={broadcastActive}
                onChange={(e) => setBroadcastActive(e.target.checked)}
                className="accent-[#6366f1]"
              />
              <span>Enable Active Global Broadcast across Header Bar</span>
            </label>

            <div className="flex items-center justify-between pt-2 border-t border-[#2d3139]">
              {broadcastSaved ? (
                <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Broadcast updated globally!
                </span>
              ) : <div />}

              <button
                type="submit"
                className="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Broadcast</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
