"use client";

import React, { useState, useEffect, useRef } from "react";
import { Image as ImageIcon, Upload, X, RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChartImageUploaderProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}

export function ChartImageUploader({
  value,
  onChange,
  label = "TradingView Chart Screenshot",
}: ChartImageUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle Clipboard Ctrl+V Paste
  useEffect(() => {
    function handleGlobalPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processFile(file);
            break;
          }
        }
      }
    }

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, []);

  function processFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onChange(result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5 text-primary" />
          <span>{label}</span>
          <span className="text-[10px] text-muted-foreground/70 normal-case">
            (Paste Ctrl+V, Drag & Drop or Upload)
          </span>
        </label>
      )}

      {value ? (
        <div className="relative group rounded-xl border border-white/10 bg-black/40 p-2 overflow-hidden flex flex-col items-center">
          <div className="relative w-full max-h-48 rounded-lg overflow-hidden flex items-center justify-center bg-black/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="TradingView Chart"
              className="max-h-48 object-contain rounded-md cursor-pointer transition-transform hover:scale-[1.01]"
              onClick={() => setPreviewOpen(true)}
            />
          </div>

          <div className="mt-2 flex items-center gap-2 w-full justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreviewOpen(true)}
              className="h-7 text-xs gap-1 border-white/10"
            >
              <Eye className="h-3 w-3" />
              <span>Preview</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-7 text-xs gap-1 border-white/10"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Replace</span>
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onChange(null)}
              className="h-7 text-xs gap-1"
            >
              <X className="h-3 w-3" />
              <span>Remove</span>
            </Button>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center ${
            dragOver
              ? "border-primary bg-primary/10"
              : "border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/[0.07]"
          }`}
        >
          <div className="p-2.5 rounded-full bg-primary/10 text-primary">
            <Upload className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-medium text-foreground">
              Click to browse or drag & drop TradingView screenshot
            </p>
            <p className="text-[11px] text-muted-foreground">
              Tip: Copy chart screenshot on TradingView and press <kbd className="px-1 py-0.5 rounded bg-white/10 text-[10px]">Ctrl+V</kbd> anywhere on this page
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Expanded Lightbox Preview Modal */}
      {previewOpen && value && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-[#111218] border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                TradingView Chart Analysis
              </span>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-auto flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Full Chart Analysis"
                className="max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
