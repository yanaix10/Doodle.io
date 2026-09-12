import React from "react";
import { cn } from "../lib/utils";

export function Avatar({ avatar, size = "md", className }) {
  const { color = "#6366f1", eyes = 0, mouth = 0, hat = 0 } = avatar || {};

  const sizeClasses = {
    xs: "w-8 h-8",
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20",
    xl: "w-28 h-28"
  };

  return (
    <div
      className={cn(
        "relative select-none flex items-center justify-center rounded-2xl shrink-0 transition-transform",
        sizeClasses[size] || sizeClasses.md,
        className
      )}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-sm overflow-visible"
      >
        {/* Blob Body */}
        <circle
          cx="50"
          cy="52"
          r="40"
          fill={color}
          stroke="#1e293b"
          strokeWidth="4"
        />

        {/* Belly highlight / 3D shading */}
        <ellipse
          cx="50"
          cy="70"
          rx="24"
          ry="14"
          fill="#ffffff"
          opacity="0.18"
        />

        {/* Eyes */}
        {eyes === 0 && (
          // Normal cartoon eyes
          <g>
            <circle cx="38" cy="46" r="6" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
            <circle cx="40" cy="46" r="3" fill="#1e293b" />
            <circle cx="62" cy="46" r="6" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
            <circle cx="64" cy="46" r="3" fill="#1e293b" />
          </g>
        )}

        {eyes === 1 && (
          // Happy curved eyes ^ ^
          <g stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" fill="none">
            <path d="M 33 48 Q 38 40 43 48" />
            <path d="M 57 48 Q 62 40 67 48" />
          </g>
        )}

        {eyes === 2 && (
          // Cool sunglasses
          <g>
            <path
              d="M 30 42 L 46 42 L 44 52 L 32 52 Z"
              fill="#0f172a"
              stroke="#0f172a"
              strokeWidth="2"
            />
            <path
              d="M 54 42 L 70 42 L 68 52 L 56 52 Z"
              fill="#0f172a"
              stroke="#0f172a"
              strokeWidth="2"
            />
            <line x1="46" y1="45" x2="54" y2="45" stroke="#0f172a" strokeWidth="3" />
            <line x1="33" y1="44" x2="43" y2="50" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
            <line x1="57" y1="44" x2="67" y2="50" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
          </g>
        )}

        {eyes === 3 && (
          // Winking
          <g>
            <circle cx="38" cy="46" r="6" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
            <circle cx="40" cy="46" r="3" fill="#1e293b" />
            <path d="M 57 48 Q 62 42 67 48" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </g>
        )}

        {eyes === 4 && (
          // Sleepy / chill straight lines
          <g stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round">
            <line x1="34" y1="46" x2="44" y2="46" />
            <line x1="56" y1="46" x2="66" y2="46" />
          </g>
        )}

        {eyes === 5 && (
          // Big anime sparkles
          <g>
            <circle cx="38" cy="46" r="8" fill="#1e293b" />
            <circle cx="36" cy="43" r="3" fill="#ffffff" />
            <circle cx="40" cy="48" r="1.5" fill="#ffffff" />
            <circle cx="62" cy="46" r="8" fill="#1e293b" />
            <circle cx="60" cy="43" r="3" fill="#ffffff" />
            <circle cx="64" cy="48" r="1.5" fill="#ffffff" />
          </g>
        )}

        {/* Blush cheeks */}
        <circle cx="28" cy="54" r="4" fill="#f43f5e" opacity="0.35" />
        <circle cx="72" cy="54" r="4" fill="#f43f5e" opacity="0.35" />

        {/* Mouth */}
        {mouth === 0 && (
          // Gentle smile
          <path
            d="M 42 60 Q 50 67 58 60"
            stroke="#1e293b"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {mouth === 1 && (
          // Open laughing mouth
          <g>
            <path
              d="M 40 58 Q 50 58 60 58 Q 50 74 40 58 Z"
              fill="#b91c1c"
              stroke="#1e293b"
              strokeWidth="2.5"
            />
            <ellipse cx="50" cy="65" rx="5" ry="3" fill="#fda4af" />
          </g>
        )}

        {mouth === 2 && (
          // Big grin showing teeth
          <g>
            <path
              d="M 38 58 Q 50 56 62 58 Q 50 72 38 58 Z"
              fill="#ffffff"
              stroke="#1e293b"
              strokeWidth="3"
            />
            <line x1="50" y1="57" x2="50" y2="67" stroke="#1e293b" strokeWidth="2" />
          </g>
        )}

        {mouth === 3 && (
          // Surprised O
          <circle
            cx="50"
            cy="62"
            r="5"
            fill="#1e293b"
          />
        )}

        {mouth === 4 && (
          // Tongue sticking out :P
          <g>
            <path d="M 41 59 Q 50 62 59 59" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 48 60 Q 48 70 52 70 Q 56 70 56 60 Z" fill="#f43f5e" stroke="#1e293b" strokeWidth="2" />
            <line x1="52" y1="60" x2="52" y2="66" stroke="#be123c" strokeWidth="1.5" />
          </g>
        )}

        {mouth === 5 && (
          // Cute cat smirk :3
          <path
            d="M 42 60 Q 46 64 50 61 Q 54 64 58 60"
            stroke="#1e293b"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Hats / Accessories */}
        {hat === 1 && (
          // Party cone hat
          <g>
            <polygon points="50,2 35,28 65,28" fill="#eab308" stroke="#1e293b" strokeWidth="3" />
            <line x1="38" y1="22" x2="62" y2="22" stroke="#ef4444" strokeWidth="3" />
            <line x1="42" y1="14" x2="58" y2="14" stroke="#3b82f6" strokeWidth="3" />
            <circle cx="50" cy="2" r="4" fill="#ef4444" />
          </g>
        )}

        {hat === 2 && (
          // Crown
          <g>
            <polygon
              points="30,28 32,12 42,22 50,8 58,22 68,12 70,28"
              fill="#fbbf24"
              stroke="#1e293b"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <circle cx="50" cy="14" r="2.5" fill="#ef4444" />
            <circle cx="37" cy="19" r="2" fill="#3b82f6" />
            <circle cx="63" cy="19" r="2" fill="#10b981" />
          </g>
        )}

        {hat === 3 && (
          // Cute bow
          <g>
            <polygon points="50,20 36,12 36,28" fill="#f43f5e" stroke="#1e293b" strokeWidth="2.5" />
            <polygon points="50,20 64,12 64,28" fill="#f43f5e" stroke="#1e293b" strokeWidth="2.5" />
            <circle cx="50" cy="20" r="4" fill="#fb7185" stroke="#1e293b" strokeWidth="2" />
          </g>
        )}

        {hat === 4 && (
          // Top hat
          <g>
            <rect x="36" y="8" width="28" height="20" rx="2" fill="#1e293b" stroke="#1e293b" strokeWidth="2" />
            <rect x="28" y="24" width="44" height="6" rx="3" fill="#1e293b" stroke="#1e293b" strokeWidth="2" />
            <rect x="36" y="21" width="28" height="4" fill="#ef4444" />
          </g>
        )}
      </svg>
    </div>
  );
}
