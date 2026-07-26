import type { CSSProperties } from "react";

interface IconProps {
  className?: string;
  style?: CSSProperties;
}

export function WhatsAppIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-1.735-.867-2.87-1.548-4.01-3.508-.303-.52.303-.483.868-1.61.099-.198.05-.371-.05-.52-.099-.148-.669-1.61-.917-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.148.198 2.03 3.104 4.976 4.228 2.945 1.124 2.945.75 3.472.7.527-.05 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.05 2C6.556 2 2.1 6.42 2.1 11.87c0 1.995.583 3.851 1.594 5.408L2 22l4.867-1.622a10.03 10.03 0 0 0 5.183 1.418h.005c5.494 0 9.95-4.42 9.95-9.87C22.005 6.42 17.548 2 12.05 2zm0 18.036h-.004a8.24 8.24 0 0 1-4.198-1.152l-.301-.18-3.12 1.04.994-3.033-.196-.312a8.062 8.062 0 0 1-1.281-4.409c0-4.478 3.646-8.114 8.11-8.114 4.325 0 8.11 3.594 8.11 8.114 0 4.478-3.645 8.046-8.114 8.046z" />
    </svg>
  );
}

export function TelegramIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M21.05 2.927 2.4 10.24c-1.27.51-1.263 1.216-.232 1.53l4.79 1.494 1.847 5.65c.225.62.116.865.766.865.5 0 .72-.228 1-.5l2.4-2.334 4.85 3.58c.892.494 1.535.238 1.76-.827l3.19-15.03c.32-1.302-.497-1.893-1.72-1.74zM8.5 14.086l9.24-8.35c.414-.36-.09-.535-.638-.208L6.42 12.86l-4.36-1.36 18.99-7.324-1.7 15.99-5.24-3.87-3.19 3.076z" />
    </svg>
  );
}

export function FacebookIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M13.5 21v-7.4h2.5l.4-2.9h-2.9V8.8c0-.84.23-1.4 1.44-1.4h1.54V4.8C16.24 4.71 15.24 4.6 14.06 4.6c-2.4 0-4.05 1.46-4.05 4.16v2.12H7.5v2.9h2.51V21h3.49z" />
    </svg>
  );
}

export function InstagramIcon({ className, style }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TwitterIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function YouTubeIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.56A3.02 3.02 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14c1.88.56 9.38.56 9.38.56s7.5 0 9.38-.56a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8zM9.6 15.6V8.4l6.24 3.6z" />
    </svg>
  );
}

export function LinkedInIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8.24H4.8V23H.22zm7.6 0h4.38v2.01h.06c.61-1.15 2.1-2.36 4.32-2.36 4.62 0 5.47 3.04 5.47 6.99V23h-4.57v-6.28c0-1.5-.03-3.42-2.08-3.42-2.09 0-2.41 1.63-2.41 3.31V23H7.82z" />
    </svg>
  );
}
