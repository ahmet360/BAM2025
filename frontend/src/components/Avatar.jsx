import React from "react";

export default function Avatar() {
    // Placeholder SVG avatar with colored muscle groups
    return (
        <svg width="48" height="64" viewBox="0 0 48 64">
            {/* Head */}
            <circle cx="24" cy="12" r="10" fill="#ffe0b2" stroke="#333" strokeWidth="2" />
            {/* Body */}
            <rect x="16" y="22" width="16" height="24" rx="8" fill="#8bc34a" stroke="#333" strokeWidth="2" />
            {/* Arms */}
            <rect x="4" y="26" width="8" height="24" rx="4" fill="#ff9800" stroke="#333" strokeWidth="2" />
            <rect x="36" y="26" width="8" height="24" rx="4" fill="#ff9800" stroke="#333" strokeWidth="2" />
            {/* Legs */}
            <rect x="16" y="46" width="6" height="16" rx="3" fill="#f44336" stroke="#333" strokeWidth="2" />
            <rect x="26" y="46" width="6" height="16" rx="3" fill="#f44336" stroke="#333" strokeWidth="2" />
        </svg>
    );
} 