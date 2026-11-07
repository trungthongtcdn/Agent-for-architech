type P = { className?: string };
const base = (className?: string) => ({
  className: className ?? "size-5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
});

export const IconSpark = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
    <path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8z" />
  </svg>
);
export const IconGrid = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
  </svg>
);
export const IconCoin = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M14.8 9.2c-.5-.9-1.6-1.4-2.8-1.4-1.6 0-2.8.8-2.8 2s1.1 1.7 2.8 2.1 2.8.9 2.8 2.1-1.2 2.1-2.8 2.1c-1.3 0-2.4-.6-2.9-1.5M12 6.3v1.5M12 16.2v1.5" />
  </svg>
);
export const IconShield = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 3l7.5 3v5.5c0 4.5-3.1 8.3-7.5 9.5-4.4-1.2-7.5-5-7.5-9.5V6z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
export const IconUpload = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 16V4M7 9l5-5 5 5" />
    <path d="M4 15v3.5A1.5 1.5 0 005.5 20h13a1.5 1.5 0 001.5-1.5V15" />
  </svg>
);
export const IconDownload = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 4v12M7 11l5 5 5-5" />
    <path d="M4 18.5h16" />
  </svg>
);
export const IconLogout = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M15 4h3.5A1.5 1.5 0 0120 5.5v13a1.5 1.5 0 01-1.5 1.5H15" />
    <path d="M10 8l-4 4 4 4M6 12h10" />
  </svg>
);
export const IconX = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const IconVideo = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <path d="M16 10.5l5-3v9l-5-3z" />
  </svg>
);
export const IconExpand = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);
export const IconSofa = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M5 11V8a2 2 0 012-2h10a2 2 0 012 2v3" />
    <path d="M3 13a2 2 0 014 0v1h10v-1a2 2 0 014 0v4a1 1 0 01-1 1H4a1 1 0 01-1-1z" />
    <path d="M6 18v2M18 18v2" />
  </svg>
);
export const IconBuilding = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M4 21V5.5L12 3v18M12 8.5l8 2.5v10M3 21h18" />
    <path d="M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2" />
  </svg>
);
