import React, { useState } from 'react';
import { X, Flag, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { CommunityUserProfile, ReportCategory } from '../../types/community';
import { CommunityService } from '../../services/community/communityService';

interface ReportModalProps {
  targetType: 'POST' | 'COMMENT' | 'PROFILE';
  targetId: string;
  targetAuthorId: string;
  targetContentSnippet: string;
  currentUser: CommunityUserProfile;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  targetType,
  targetId,
  targetAuthorId,
  targetContentSnippet,
  currentUser,
  onClose,
}) => {
  const [category, setCategory] = useState<ReportCategory>('MANIPULATION');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await CommunityService.createReport({
        reporterId: currentUser.id,
        reporterEmail: currentUser.email,
        targetType,
        targetId,
        targetAuthorId,
        targetContentSnippet,
        category,
        description: description.trim(),
      });

      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f1013] border border-[#2d2d2d] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-[#242424] flex items-center justify-between bg-[#141518]">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Report Community Content</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Report Submitted to Compliance</h4>
            <p className="text-xs text-slate-400 max-w-xs">
              Thank you for keeping the MarketMind community safe. Our moderation team will review this case.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1.5">Violation Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ReportCategory)}
                className="w-full bg-[#15161a] border border-[#2a2b30] text-white text-xs px-3 py-2 rounded-xl focus:border-[#D4AF37]"
              >
                <option value="MANIPULATION">Pump and Dump / Market Manipulation / Fake Claims</option>
                <option value="PHISHING">Phishing / Scam Links / Malicious Redirects</option>
                <option value="SPAM">Commercial Spam / Unsolicited Promotion</option>
                <option value="IMPERSONATION">Impersonation of Analyst or Official Entity</option>
                <option value="HARASSMENT">Targeted Harassment or Hate Speech</option>
                <option value="COPYRIGHT">Copyright or Proprietary Data Infringement</option>
                <option value="OTHER">Other Community Guideline Breach</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1.5">Detailed Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain why this content violates compliance or safety standards..."
                rows={3}
                className="w-full bg-[#15161a] border border-[#2a2b30] text-white text-xs p-3 rounded-xl focus:border-[#D4AF37] resize-none"
              />
            </div>

            {error && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#242424]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!description.trim() || isSubmitting}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition disabled:opacity-40"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
