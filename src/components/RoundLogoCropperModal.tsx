import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crop, 
  ZoomIn, 
  RotateCw, 
  Check, 
  X, 
  Move,
  RotateCcw
} from 'lucide-react';

interface RoundLogoCropperModalProps {
  isOpen: boolean;
  logoNumber: 1 | 2;
  imageSrc: string;
  fileName?: string;
  logoTitle?: string;
  onClose: () => void;
  onSaveCropped: (croppedBlob: Blob, croppedDataUrl: string) => void;
}

export function RoundLogoCropperModal({
  isOpen,
  logoNumber,
  imageSrc,
  fileName,
  logoTitle,
  onClose,
  onSaveCropped,
}: RoundLogoCropperModalProps) {
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 1, height: 1 });
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load image when imageSrc changes
  useEffect(() => {
    if (!imageSrc) return;
    setImageLoaded(false);
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Viewport dimensions for cropping circle
  const VIEWPORT_SIZE = 280;
  const RADIUS = VIEWPORT_SIZE / 2;

  // Render crop preview canvas whenever scale, rotation, or position changes
  useEffect(() => {
    if (!imageLoaded || !imageRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = VIEWPORT_SIZE;
    canvas.height = VIEWPORT_SIZE;

    ctx.clearRect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);

    const img = imageRef.current;
    const baseScale = Math.max(VIEWPORT_SIZE / img.naturalWidth, VIEWPORT_SIZE / img.naturalHeight);
    const effectiveScale = baseScale * scale;

    ctx.save();
    // Center point
    ctx.translate(RADIUS + position.x, RADIUS + position.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(effectiveScale, effectiveScale);

    // Draw centered
    ctx.drawImage(
      img,
      -img.naturalWidth / 2,
      -img.naturalHeight / 2,
      img.naturalWidth,
      img.naturalHeight
    );
    ctx.restore();

    // Also generate mini clean circular preview
    const previewCanvas = previewCanvasRef.current;
    if (previewCanvas) {
      const pCtx = previewCanvas.getContext('2d');
      if (pCtx) {
        previewCanvas.width = 120;
        previewCanvas.height = 120;
        pCtx.clearRect(0, 0, 120, 120);

        // Circular clipping
        pCtx.save();
        pCtx.beginPath();
        pCtx.arc(60, 60, 58, 0, Math.PI * 2);
        pCtx.clip();

        // Draw scaled down
        pCtx.drawImage(canvas, 0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE, 0, 0, 120, 120);
        pCtx.restore();

        try {
          setPreviewUrl(previewCanvas.toDataURL('image/png'));
        } catch {}
      }
    }
  }, [imageLoaded, scale, rotation, position]);

  // Drag interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support for mobile / tablets
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Perform final high-resolution circular crop
  const handleApply = () => {
    if (!imageRef.current) return;

    const exportSize = 512;
    const exportRadius = exportSize / 2;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Circular Clip Path
    ctx.beginPath();
    ctx.arc(exportRadius, exportRadius, exportRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const img = imageRef.current;
    const factor = exportSize / VIEWPORT_SIZE;
    const baseScale = Math.max(VIEWPORT_SIZE / img.naturalWidth, VIEWPORT_SIZE / img.naturalHeight);
    const effectiveScale = baseScale * scale * factor;

    ctx.save();
    ctx.translate(exportRadius + position.x * factor, exportRadius + position.y * factor);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(effectiveScale, effectiveScale);

    ctx.drawImage(
      img,
      -img.naturalWidth / 2,
      -img.naturalHeight / 2,
      img.naturalWidth,
      img.naturalHeight
    );
    ctx.restore();

    exportCanvas.toBlob(
      (blob) => {
        if (blob) {
          const dataUrl = exportCanvas.toDataURL('image/png');
          onSaveCropped(blob, dataUrl);
        }
      },
      'image/png',
      0.95
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-5">
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          className="relative w-full max-w-lg rounded-2xl border-2 border-[#ffd700] bg-[#1e050c] p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(255,215,0,0.25)] flex flex-col items-center text-[#f5f2ed] font-sans"
        >
          {/* Header Bar */}
          <div className="w-full flex items-center justify-between border-b border-[#ffd700]/30 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full border border-[#ffd700]/60 bg-[#35101a] flex items-center justify-center text-[#ffd700] shadow-md">
                <Crop className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-royal text-base sm:text-lg font-bold text-[#ffd700]">
                  Round Crop Logo {logoNumber}: {logoNumber === 1 ? 'Primary (Left)' : 'Secondary (Right)'}
                </h3>
                <p className="text-[11px] text-[#e8cba4]/80">
                  Drag to reposition, zoom slider to scale, and crop into a circular emblem
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-full text-[#e8cba4]/70 hover:text-white hover:bg-[#3d1220] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Interactive Viewfinder & Drag Canvas */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full">
            {/* Main Interactive Round Viewfinder */}
            <div
              className="relative overflow-hidden rounded-2xl border-2 border-[#ffd700]/60 bg-black/90 cursor-grab active:cursor-grabbing shadow-inner select-none flex items-center justify-center"
              style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Underlying canvas */}
              <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

              {/* Circular Guide Overlay Mask */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                {/* Golden circular guide rim */}
                <div
                  className="rounded-full border-2 border-[#ffd700] shadow-[0_0_0_9999px_rgba(0,0,0,0.65),0_0_15px_rgba(255,215,0,0.5)]"
                  style={{ width: VIEWPORT_SIZE - 8, height: VIEWPORT_SIZE - 8 }}
                />
              </div>

              {/* Centered Crosshair helper */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
                <div className="h-4 w-[1px] bg-[#ffd700]" />
                <div className="w-4 h-[1px] bg-[#ffd700] absolute" />
              </div>

              {/* Drag Hint Badge */}
              <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-2.5 py-0.5 text-[10px] font-medium text-[#ffd700] flex items-center space-x-1 border border-[#ffd700]/30 backdrop-blur-xs">
                <Move className="h-3 w-3" />
                <span>Drag to Pan</span>
              </div>
            </div>

            {/* Live Round Preview Column */}
            <div className="flex flex-col items-center justify-center space-y-2.5">
              <span className="text-xs font-royal font-bold text-[#ffd700]">
                Website Result
              </span>

              {/* Live Round Logo Preview with Temple Gold Frame */}
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 sm:border-3 border-[#ffd700] bg-[#220710] shadow-[0_0_20px_rgba(255,215,0,0.4)] overflow-hidden flex items-center justify-center p-0.5">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Logo Preview"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <canvas ref={previewCanvasRef} className="h-full w-full rounded-full" />
                )}
                <div className="pointer-events-none absolute inset-0 rounded-full border border-white/20" />
              </div>

              <span className="text-[10px] text-[#e8cba4]/70 font-mono text-center max-w-[120px] truncate">
                {fileName || (logoNumber === 1 ? 'Primary Logo' : 'Secondary Logo')}
              </span>
            </div>
          </div>

          {/* Hidden Canvas for generating preview */}
          <canvas ref={previewCanvasRef} className="hidden" />

          {/* Zoom & Rotation Controls */}
          <div className="w-full mt-4 space-y-3 bg-[#140306]/80 p-3 rounded-xl border border-white/10">
            {/* Zoom Slider */}
            <div className="flex items-center justify-between space-x-3 text-xs">
              <div className="flex items-center space-x-1 text-[#ffd700] font-medium shrink-0">
                <ZoomIn className="h-3.5 w-3.5" />
                <span>Zoom Scale:</span>
              </div>

              <div className="flex-1 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.max(0.5, Number((s - 0.1).toFixed(2))))}
                  className="h-6 w-6 rounded bg-black/60 hover:bg-[#35101a] border border-white/20 text-[#ffd700] flex items-center justify-center text-xs font-bold"
                  title="Zoom Out"
                >
                  -
                </button>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="flex-1 accent-[#ffd700] h-1.5 bg-black/60 rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.min(3.0, Number((s + 0.1).toFixed(2))))}
                  className="h-6 w-6 rounded bg-black/60 hover:bg-[#35101a] border border-white/20 text-[#ffd700] flex items-center justify-center text-xs font-bold"
                  title="Zoom In"
                >
                  +
                </button>
              </div>

              <span className="font-mono text-xs font-bold text-[#ffd700] w-12 text-right">
                {Math.round(scale * 100)}%
              </span>
            </div>

            {/* Quick Alignment Actions */}
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-black/50 hover:bg-[#35101a] border border-white/10 text-xs text-[#e8cba4] hover:text-[#ffd700] transition-colors"
                >
                  <RotateCw className="h-3 w-3" />
                  <span>Rotate 90°</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setScale(1);
                    setPosition({ x: 0, y: 0 });
                    setRotation(0);
                  }}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-black/50 hover:bg-[#35101a] border border-white/10 text-xs text-[#e8cba4]/70 hover:text-white transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset Fit</span>
                </button>
              </div>

              <span className="text-[10px] text-[#e8cba4]/60">
                {naturalSize.width} × {naturalSize.height} px
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full mt-4 flex items-center justify-end space-x-2.5 pt-2 border-t border-[#ffd700]/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/20 bg-black/40 text-xs font-semibold text-[#e8cba4] hover:text-white hover:bg-black/60 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl border border-[#ffd700] bg-gradient-to-r from-[#9e1c36] via-[#b8223f] to-[#801429] text-xs font-bold text-[#ffd700] shadow-[0_4px_15px_rgba(184,34,63,0.5)] hover:shadow-[0_6px_20px_rgba(184,34,63,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all font-royal"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Apply Round Crop &amp; Save Logo</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
