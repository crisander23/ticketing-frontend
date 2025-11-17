'use client';
import { useEffect } from 'react';

export default function Modal({ 
  open, 
  onClose, 
  title, 
  children, 
  footer,
  // 1. Accept the 'surface' prop, default to 'light'
  surface = 'light' 
}) {
  
  useEffect(() => {
    function onEsc(e){ if(e.key === 'Escape') onClose?.(); }
    if (open) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  // 2. Define theme classes based on the 'surface' prop
  const isDark = surface === 'dark';

  const backdropClass = isDark 
    ? "bg-black/70 backdrop-blur-sm" 
    : "bg-black/30 backdrop-blur-sm";
    
  const panelClass = isDark
    ? "rounded-xl border border-white/15 bg-slate-900 shadow-xl"
    : "rounded-xl border border-slate-200 bg-white shadow-xl";

  const titleClass = isDark 
    ? "text-lg font-semibold text-white" 
    : "text-lg font-semibold text-slate-900";
    
  const titleBarClass = isDark
    ? "pb-3 mb-3 border-b border-white/15"
    : "pb-3 mb-3 border-b border-slate-200";

  const footerClass = isDark
    ? "mt-4 pt-4 border-t border-white/15 flex justify-end gap-2"
    : "mt-4 pt-4 border-t border-slate-200 flex justify-end gap-2";
  

  if (!open) return null;
  
  return (
    // 3. Apply the dynamic backdrop class
    <div 
      className={`fixed inset-0 z-50 ${backdropClass} flex justify-center pt-16 sm:pt-24 px-4`} 
      onClick={onClose}
    >
      <div
        // 4. Apply the dynamic panel class (removed 'p-4' to add structure)
        className={`w-full max-w-lg h-fit ${panelClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 5. Apply dynamic title classes */}
        {title ? (
          <div className={`px-4 pt-4 ${titleBarClass}`}>
            <div className={titleClass}>{title}</div>
          </div>
        ) : null}
        
        {/* 6. Add padding to the children area */}
        <div className="p-4">{children}</div>
        
        {/* 7. Apply dynamic footer classes */}
        {footer ? (
          <div className={`px-4 pb-4 ${footerClass}`}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}