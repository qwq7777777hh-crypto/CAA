
import React from 'react';

const PCBackgroundDecor: React.FC = () => {
  // Hexagon pattern data URI - Purple #a855f7 with low opacity
  const hexPattern = `data:image/svg+xml,%3Csvg width='56' height='98' viewBox='0 0 56 98' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg stroke='%23a855f7' stroke-width='1' stroke-opacity='0.15'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zM28 18v34'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E`;

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] hidden lg:block overflow-hidden">
      {/* 
        Layer A: Hexagonal Bio-Mesh 
        - Full screen
        - Low opacity
        - Radial mask to clear center for text readability
      */}
      <div 
        className="absolute inset-0 z-0 opacity-40"
        style={{
          backgroundImage: `url("${hexPattern}")`,
          backgroundSize: '56px 98px',
          maskImage: 'radial-gradient(circle at center, transparent 30%, black 100%)',
          WebkitMaskImage: 'radial-gradient(circle at center, transparent 30%, black 100%)'
        }}
      />

      {/* Layer C: Vignette - Deepen edges */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(5,5,5,0.4)_60%,rgba(0,0,0,0.9)_95%)] z-10" />

      {/* Layer B: Corner HUD Elements - High Z to stay sharp */}
      <div className="absolute inset-0 z-20">
        
        {/* TOP LEFT - Removed text to avoid overlap with main header */}
        <div className="absolute top-8 left-8 w-64 h-48 opacity-60">
           <div className="absolute top-0 left-0 w-24 h-[1px] bg-purple-500/50" />
           <div className="absolute top-0 left-0 w-[1px] h-24 bg-purple-500/50" />
           <div className="absolute top-0 left-0 w-2 h-2 bg-purple-500 shadow-[0_0_10px_#a855f7]" />
        </div>

        {/* TOP RIGHT - Removed text to avoid overlap with time display */}
        <div className="absolute top-8 right-8 w-64 h-48 opacity-60 flex flex-col items-end">
           <div className="absolute top-0 right-0 w-24 h-[1px] bg-purple-500/50" />
           <div className="absolute top-0 right-0 w-[1px] h-24 bg-purple-500/50" />
           <div className="absolute top-0 right-0 w-2 h-2 bg-purple-500 shadow-[0_0_10px_#a855f7]" />
        </div>

        {/* BOTTOM LEFT */}
        <div className="absolute bottom-8 left-8 w-64 h-48 opacity-60 flex flex-col justify-end">
           <div className="absolute bottom-0 left-0 w-24 h-[1px] bg-purple-500/50" />
           <div className="absolute bottom-0 left-0 w-[1px] h-24 bg-purple-500/50" />
           <div className="absolute bottom-0 left-0 w-2 h-2 bg-purple-500 shadow-[0_0_10px_#a855f7]" />
           
           <div className="absolute bottom-4 left-4 flex gap-1 items-end opacity-50">
              {[12, 24, 16, 32, 20, 12, 8].map((h, i) => (
                 <div key={i} className="w-1 bg-purple-500/50" style={{ height: `${h}px` }} />
              ))}
           </div>
           <div className="absolute bottom-4 left-24 text-[8px] text-purple-500/40 font-mono tracking-wider opacity-60">
              BIO_METRICS_SCAN
           </div>
        </div>

        {/* BOTTOM RIGHT */}
        <div className="absolute bottom-8 right-8 w-64 h-48 opacity-60 flex flex-col justify-end items-end">
           <div className="absolute bottom-0 right-0 w-24 h-[1px] bg-purple-500/50" />
           <div className="absolute bottom-0 right-0 w-[1px] h-24 bg-purple-500/50" />
           <div className="absolute bottom-0 right-0 w-2 h-2 bg-purple-500 shadow-[0_0_10px_#a855f7]" />
           
           <div className="absolute bottom-4 right-4 font-mono text-right">
              <div className="text-3xl font-bold text-purple-900/30 leading-none tracking-tighter">04</div>
              <div className="text-[8px] text-purple-500/40 tracking-[0.3em] mt-1">ZONE_DELTA</div>
           </div>
        </div>
        
      </div>
    </div>
  );
};

export default PCBackgroundDecor;
