import React from 'react';

export const SearchIcon = ({ size = 13, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-1px', ...style }}>
    <circle cx="7" cy="7" r="5" />
    <line x1="10.5" y1="10.5" x2="14.5" y2="14.5" />
  </svg>
);

export const TerminalIcon = ({ size = 13, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-1px', ...style }}>
    <polyline points="4 6 7 8.5 4 11" />
    <line x1="9" y1="11" x2="12" y2="11" />
  </svg>
);

export const DocumentIcon = ({ size = 13, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-1px', ...style }}>
    <path d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6z" />
    <polyline points="9 2 9 6 13 6" />
    <line x1="5.5" y1="9" x2="10.5" y2="9" />
    <line x1="5.5" y1="11.5" x2="9.5" y2="11.5" />
  </svg>
);

export const GearIcon = ({ size = 13, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-1px', ...style }}>
    <circle cx="8" cy="8" r="2.5" />
    <path d="M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9" />
  </svg>
);

export const RefreshIcon = ({ size = 13, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-1px', ...style }}>
    <path d="M2.5 8a5.5 5.5 0 1 0 1.2-3.4" />
    <polyline points="2.5 3 2.5 6.5 6 6.5" />
  </svg>
);

export const PlusIcon = ({ size = 13, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-1px', ...style }}>
    <line x1="8" y1="3" x2="8" y2="13" />
    <line x1="3" y1="8" x2="13" y2="8" />
  </svg>
);

export const ChevronDownIcon = ({ size = 10, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '0px', ...style }}>
    <polyline points="4 6 8 10 12 6" />
  </svg>
);

export const CloseIcon = ({ size = 10, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '0px', ...style }}>
    <line x1="4" y1="4" x2="12" y2="12" />
    <line x1="12" y1="4" x2="4" y2="12" />
  </svg>
);

export const LightningIcon = ({ size = 13, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-1px', ...style }}>
    <polygon points="9 1 3 9 8 9 7 15 13 7 8 7" />
  </svg>
);

export const ServerIcon = ({ size = 13, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-1px', ...style }}>
    <rect x="2" y="2" width="12" height="5" rx="1.5" />
    <rect x="2" y="9" width="12" height="5" rx="1.5" />
    <line x1="4.5" y1="4.5" x2="5" y2="4.5" />
    <line x1="4.5" y1="11.5" x2="5" y2="11.5" />
  </svg>
);

export const KeyIcon = ({ size = 13, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-1px', ...style }}>
    <circle cx="5.5" cy="8" r="3.5" />
    <line x1="9" y1="8" x2="14" y2="8" />
    <line x1="12" y1="8" x2="12" y2="10.5" />
    <line x1="14" y1="8" x2="14" y2="10" />
  </svg>
);

export const TrashIcon = ({ size = 13, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-1px', ...style }}>
    <polyline points="2 4 14 4" />
    <path d="M5 4v-1a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
    <path d="M4 4l1 10a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l1-10" />
  </svg>
);
