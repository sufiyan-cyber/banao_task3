'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Loader2 } from 'lucide-react';

interface LaunchDemoButtonProps {
  className?: string;
  label?: string;
}

export function LaunchDemoButton({
  className = 'btn-primary text-xs px-4 py-2.5 flex items-center gap-2 shadow-sm',
  label = '1-Click Demo Scenario',
}: LaunchDemoButtonProps) {
  const router = useRouter();
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunch = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLaunching) return;
    setIsLaunching(true);

    try {
      const res = await fetch('/api/demo/quick-start', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        alert(data.error || 'Failed to start demo scenario');
        setIsLaunching(false);
      }
    } catch (err: any) {
      console.error('Demo launch error:', err);
      alert('Failed to launch demo scenario. Please check system console.');
      setIsLaunching(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLaunch}
      disabled={isLaunching}
      className={`${className} disabled:opacity-75 cursor-pointer disabled:cursor-not-allowed`}
      title="Instantly generate a production batch with realistic kiln drift and candidate corrections"
    >
      {isLaunching ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B8860B]" />
          <span>Launching Demo...</span>
        </>
      ) : (
        <>
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
