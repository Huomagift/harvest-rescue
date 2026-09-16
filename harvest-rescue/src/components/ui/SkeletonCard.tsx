"use client";

import React from "react";

interface SkeletonCardProps {
  count?: number;
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ count = 2, className = "" }) => {
  return (
    <div className={`space-y-4 w-full ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-5 sm:p-6 rounded-3xl bg-[#1E2320]/90 text-white border border-[#2D3430] shadow-sm space-y-4 animate-pulse"
        >
          {/* Top row: Circular avatar + 2 lines next to it */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#363E38] shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/5 bg-[#363E38] rounded-md" />
              <div className="h-3 w-2/5 bg-[#2B322D] rounded-md" />
            </div>
          </div>

          {/* Middle: Multiple full-width text line placeholders */}
          <div className="space-y-2.5 pt-1">
            <div className="h-3.5 w-full bg-[#363E38] rounded-md" />
            <div className="h-3.5 w-full bg-[#363E38] rounded-md" />
            <div className="h-3.5 w-4/5 bg-[#2B322D] rounded-md" />
          </div>

          {/* Bottom row: Small pill/action circles and button placeholders */}
          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#363E38]" />
              <div className="w-5 h-5 rounded-full bg-[#363E38]" />
              <div className="w-5 h-5 rounded-full bg-[#363E38]" />
              <div className="h-4 w-16 bg-[#2B322D] rounded-md ml-1" />
            </div>
            <div className="h-6 w-24 bg-[#363E38] rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonCard;
