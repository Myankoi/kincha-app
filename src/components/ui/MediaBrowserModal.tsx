"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase, STORAGE_BUCKET } from "@/lib/supabase";
import { X, Folder, File, ArrowLeft, Search, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrutalButton } from "./BrutalButton";

interface MediaBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (path: string, type: "IMAGE" | "VIDEO" | "NONE") => void;
}

interface StorageItem {
  name: string;
  id: string | null;
  metadata?: {
    size: number;
    mimetype: string;
  };
}

export const MediaBrowserModal: React.FC<MediaBrowserModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [currentPath, setCurrentPath] = useState<string>("");
  const [items, setItems] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch items in the current path
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(currentPath || undefined, {
          limit: 100,
          offset: 0,
          sortBy: { column: "name", order: "asc" },
        });

      if (error) {
        console.error("Error listing storage items:", error);
      } else {
        setItems((data as StorageItem[]) || []);
      }
    } catch (e) {
      console.error("Unhandled storage fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen, fetchItems]);

  // Navigate into a folder
  const handleFolderClick = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
    setSearchQuery("");
  };

  // Navigate back
  const handleBackClick = () => {
    if (!currentPath) return;
    const parts = currentPath.split("/");
    parts.pop();
    setCurrentPath(parts.join("/"));
    setSearchQuery("");
  };

  // Upload a file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    // Auto-detect mimetype
    const mime = file.type;
    let folder = "images";
    let mediaType: "IMAGE" | "VIDEO" | "NONE" = "IMAGE";

    if (mime.startsWith("video/")) {
      folder = "videos";
      mediaType = "VIDEO";
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fullUploadPath = currentPath 
      ? `${currentPath}/${sanitizedName}` 
      : `${folder}/${sanitizedName}`;

    try {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fullUploadPath, file, {
          cacheControl: "3600",
          upsert: true, // Overwrite if exists
        });

      if (error) {
        setUploadError(`Gagal mengunggah: ${error.message}`);
      } else {
        onSelect(fullUploadPath, mediaType);
        onClose();
      }
    } catch (err: any) {
      setUploadError(`Sistem error: ${err.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  // Select an item
  const handleItemSelect = (item: StorageItem) => {
    const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;
    const mime = item.metadata?.mimetype || "";
    const isVideo = mime.startsWith("video/") || item.name.endsWith(".mp4") || item.name.endsWith(".mov");
    onSelect(fullPath, isVideo ? "VIDEO" : "IMAGE");
    onClose();
  };

  // Filtered files/folders
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Main explorer container */}
      <div className="relative z-10 w-full max-w-2xl bg-white border-4 border-black shadow-[8px_8px_0_0_#000] flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b-4 border-black bg-[#FFDB33] shrink-0">
          <div className="flex items-center gap-2">
            <Folder size={18} strokeWidth={3} className="text-black" />
            <h2 className="text-sm font-black uppercase tracking-wider text-black font-[family-name:var(--font-head)]">
              Media Explorer
            </h2>
          </div>
          <button
            onClick={onClose}
            className="border-2 border-black p-1 bg-white hover:bg-[#F5F5F0] transition-colors"
            aria-label="Tutup explorer"
          >
            <X size={16} strokeWidth={3} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b-4 border-black bg-[#F5F5F0] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center shrink-0">
          {/* Breadcrumb / Back button */}
          <div className="flex items-center gap-2 flex-1">
            {currentPath ? (
              <button
                onClick={handleBackClick}
                className="flex items-center gap-1 border-2 border-black bg-white px-2 py-1 text-xs font-bold shadow-[2px_2px_0_0_#000] hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_0_#000] active:translate-x-px active:translate-y-px active:shadow-none"
              >
                <ArrowLeft size={12} strokeWidth={2.5} />
                Kembali
              </button>
            ) : null}
            <span className="text-xs font-mono bg-white border-2 border-black px-2 py-1 truncate max-w-[200px] sm:max-w-xs">
              /{currentPath || "root"}
            </span>
          </div>

          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A5A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari file..."
              className="w-full pl-9 pr-4 py-1.5 border-2 border-black bg-white text-xs placeholder:text-[#AEAEAE] shadow-[2px_2px_0_0_#000] focus:outline-none focus:border-[#FFDB33]"
            />
          </div>

          {/* Upload Button */}
          <label className="flex items-center justify-center gap-1.5 border-2 border-black bg-[#a3e635] px-3 py-1.5 text-xs font-black uppercase tracking-wider cursor-pointer shadow-[2px_2px_0_0_#000] hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_0_#000] active:translate-x-px active:translate-y-px active:shadow-none select-none shrink-0 text-black">
            {uploading ? (
              <Loader2 size={12} className="animate-spin text-black" />
            ) : (
              <Upload size={12} strokeWidth={3} />
            )}
            {uploading ? "Mengunggah..." : "Upload Baru"}
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {/* Upload error banner */}
        {uploadError && (
          <div className="bg-[#FEF2F2] border-b-2 border-black px-4 py-2 text-xs font-semibold text-[#E63946] shrink-0">
            {uploadError}
          </div>
        )}

        {/* Explorer Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="animate-spin text-black" size={32} />
              <p className="text-xs font-bold uppercase tracking-wider text-[#5A5A5A]">Memuat media...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-xs font-bold text-[#5A5A5A]">Tidak ada file atau folder ditemukan.</p>
              <p className="text-[10px] text-[#AEAEAE] mt-1">Gunakan tombol &quot;Upload Baru&quot; untuk menambahkan media.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {filteredItems.map((item) => {
                const isFolder = item.id === null;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => (isFolder ? handleFolderClick(item.name) : handleItemSelect(item))}
                    className={cn(
                      "flex flex-col items-center justify-between p-3 border-2 border-black shadow-[2px_2px_0_0_#000] hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_0_#000] active:translate-x-px active:translate-y-px active:shadow-none text-left transition-all duration-100",
                      isFolder ? "bg-[#FFF9E0]" : "bg-white"
                    )}
                  >
                    <div className="flex-1 flex items-center justify-center mb-2">
                      {isFolder ? (
                        <Folder size={32} className="text-[#FFDB33] fill-[#FFDB33] stroke-black stroke-[2px]" />
                      ) : (
                        <File size={32} className="text-[#22d3ee] fill-[#CFFAFE] stroke-black stroke-[2px]" />
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-black text-center line-clamp-2 w-full break-all font-mono">
                      {item.name}
                    </span>
                    {!isFolder && item.metadata?.size && (
                      <span className="text-[9px] text-[#AEAEAE] mt-1">
                        {Math.round(item.metadata.size / 1024)} KB
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t-4 border-black bg-[#F5F5F0] flex justify-end gap-2 shrink-0">
          <BrutalButton variant="ghost" size="sm" onClick={onClose}>
            Batal
          </BrutalButton>
        </div>
      </div>
    </div>
  );
};

export default MediaBrowserModal;
