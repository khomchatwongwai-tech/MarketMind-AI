import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { LanguageCode } from '../i18n/types';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full' | 'header' | 'mobile-row';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { language, setLanguage, languages, currentLanguageInfo } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLanguages = languages.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
    setSearch('');
  };

  if (variant === 'mobile-row') {
    return (
      <div className={`relative w-full text-left ${className}`} ref={dropdownRef}>
        {/* Full-width mobile trigger card */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-[#101010] hover:bg-[#151515] border border-[#242424] hover:border-[#D4AF37]/50 text-xs font-semibold text-white transition select-none shadow-sm cursor-pointer"
          title="Change Terminal Language"
          aria-label="Change Terminal Language"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">{currentLanguageInfo.flag}</span>
            <span className="font-semibold text-white">{currentLanguageInfo.nativeName}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#9CA3AF] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
          <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl bg-[#15171a] border border-[#2d3139] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-[#e2e8f0]">
            {/* Header & Quick Search */}
            <div className="p-2.5 border-b border-[#23272f] bg-[#1c1f24]">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#121316] rounded-lg border border-[#2d3139]">
                <Globe className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search language / ภาษา..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* List of languages */}
            <div className="max-h-72 overflow-y-auto py-1 divide-y divide-[#23272f]/40">
              {filteredLanguages.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500">No language found</div>
              ) : (
                filteredLanguages.map((item) => {
                  const isSelected = item.code === language;
                  return (
                    <button
                      key={item.code}
                      onClick={() => handleSelect(item.code)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#D4AF37]/15 text-[#F2D675] font-bold'
                          : 'text-slate-300 hover:bg-[#1c1f24] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base leading-none">{item.flag}</span>
                        <div>
                          <div className="font-semibold text-slate-200">{item.nativeName}</div>
                          <div className="text-[10px] text-slate-500">{item.name}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#1c1f24] hover:bg-[#282c34] border border-[#2d3139] hover:border-[#3b404d] text-xs font-semibold text-slate-200 transition select-none shadow-sm cursor-pointer"
        title="Change Language"
        aria-label="Change Language"
        aria-expanded={isOpen}
      >
        <span className="text-sm leading-none">{currentLanguageInfo.flag}</span>
        <span className="font-medium text-slate-200">{currentLanguageInfo.nativeName}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 rounded-lg bg-[#15171a] border border-[#2d3139] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-[#e2e8f0]">
          {/* Header & Quick Search */}
          <div className="p-2 border-b border-[#23272f] bg-[#1c1f24]">
            <div className="flex items-center gap-2 px-2 py-1 bg-[#121316] rounded border border-[#2d3139]">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search language / ภาษา..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                autoFocus
              />
            </div>
          </div>

          {/* List of languages */}
          <div className="max-h-72 overflow-y-auto py-1 divide-y divide-[#23272f]/40">
            {filteredLanguages.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500">No language found</div>
            ) : (
              filteredLanguages.map((item) => {
                const isSelected = item.code === language;
                return (
                  <button
                    key={item.code}
                    onClick={() => handleSelect(item.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#6366f1]/15 text-[#818cf8] font-bold'
                        : 'text-slate-300 hover:bg-[#1c1f24] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base leading-none">{item.flag}</span>
                      <div>
                        <div className="font-semibold text-slate-200">{item.nativeName}</div>
                        <div className="text-[10px] text-slate-500">{item.name}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#818cf8]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
