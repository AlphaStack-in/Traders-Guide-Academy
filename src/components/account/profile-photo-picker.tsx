"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateSubscriberPhoto } from "@/app/account/profile/actions";

interface ProfilePhotoPickerProps {
  name: string;
  initialPhotoUrl: string | null;
}

const MAX_PHOTO_BYTES = 3 * 1024 * 1024; // 3MB — stored as a base64 data URL directly on Subscriber.photoUrl

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Circular avatar + camera-icon uploader for /account/profile. Converts the
 * chosen image to a base64 data URL client-side (same approach as
 * chart-image-uploader.tsx) and saves it immediately via
 * updateSubscriberPhoto — there's no separate blob-storage step, so this
 * persists on pick rather than waiting for a form submit.
 */
export function ProfilePhotoPicker({ name, initialPhotoUrl }: ProfilePhotoPickerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialPhotoUrl);
  const [isUploading, setIsUploading] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("That photo is too large — please pick one under 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string | undefined;
      if (!dataUrl) return;

      setPreview(dataUrl);
      setIsUploading(true);
      const result = await updateSubscriberPhoto(dataUrl);
      setIsUploading(false);

      if (!result.success) {
        toast.error(result.error ?? "Couldn't save your photo. Please try again.");
        setPreview(initialPhotoUrl);
        return;
      }
      toast.success("Profile photo updated.");
      router.refresh();
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="relative shrink-0">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-black/40 font-heading text-lg font-bold text-primary">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span>{initialsFrom(name)}</span>
        )}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        aria-label="Change profile photo"
        disabled={isUploading}
        className="signalflow-glow signalflow-btn-gradient absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-black shadow-md disabled:opacity-60"
      >
        <Camera className="h-3.5 w-3.5" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
