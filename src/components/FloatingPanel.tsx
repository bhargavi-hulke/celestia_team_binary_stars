import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { Minus, Plus, X, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../stores/appStore';

interface FloatingPanelProps {
  id: string;
  title: string;
  icon?: ReactNode;
  initialX?: number;
  initialY?: number;
  width?: string | number;
  maxHeight?: string | number;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  badge?: string;
  badgeColor?: string;
  className?: string;
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  id,
  title,
  icon,
  initialX = 24,
  initialY = 80,
  width = 360,
  maxHeight = '78vh',
  isOpen,
  onClose,
  children,
  badge,
  badgeColor = 'bg-cyan-950/80 text-cyan-400 border-cyan-800/80',
  className = '',
}) => {
  const { state, bringPanelToFront } = useApp();
  const zIndex = state.panelZIndices[id] || 30;

  // Local position state
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Bring to front when clicked
  const handlePanelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    bringPanelToFront(id);
  };

  // Dragging logic
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag from header handle
    e.stopPropagation();
    bringPanelToFront(id);
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.stopPropagation();

    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const panelW = panelRef.current?.offsetWidth || 340;
    const panelH = isCollapsed ? 48 : (panelRef.current?.offsetHeight || 300);

    // Clamp within viewport
    const newX = Math.max(10, Math.min(viewportW - panelW - 10, dragStartRef.current.posX + dx));
    const newY = Math.max(10, Math.min(viewportH - panelH - 10, dragStartRef.current.posY + dy));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      e.stopPropagation();
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore if not captured
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      onMouseDown={handlePanelClick}
      onWheel={(e) => e.stopPropagation()} // Prevent 3D Moon zoom when scrolling inside panel
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: typeof width === 'number' ? `${width}px` : width,
        zIndex,
      }}
      className={`fixed transition-shadow select-none ${
        isDragging ? 'cursor-grabbing select-none shadow-[0_20px_50px_rgba(0,0,0,0.85)]' : 'shadow-[0_12px_36px_rgba(0,0,0,0.65)]'
      } ${className}`}
    >
      <div className="bg-slate-950/70 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden flex flex-col ring-1 ring-white/5 transition-all duration-200">
        {/* Draggable Header */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="h-11 px-3.5 flex items-center justify-between border-b border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-colors cursor-grab active:cursor-grabbing"
        >
          {/* Left: Grip Handle + Icon + Title */}
          <div className="flex items-center gap-2 min-w-0">
            <GripVertical className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            {icon && <div className="text-cyan-400 shrink-0">{icon}</div>}
            <span className="font-mono text-xs font-semibold text-slate-200 tracking-wide truncate">
              {title}
            </span>
            {badge && (
              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-medium uppercase shrink-0 ${badgeColor}`}>
                {badge}
              </span>
            )}
          </div>

          {/* Right: Collapse & Close Actions */}
          <div className="flex items-center gap-1 shrink-0 ml-2" onPointerDown={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-rose-400 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
              title="Close panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expandable / Collapsible Body */}
        {!isCollapsed && (
          <div
            style={{ maxHeight }}
            className="overflow-y-auto p-3.5 text-xs font-mono text-slate-300"
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
};
