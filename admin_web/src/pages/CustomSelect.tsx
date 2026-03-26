// ─── CustomSelect.tsx ─────────────────────────────────────────────────────────
// Drop-in replacement — same props API, fully redesigned visuals.
// Uses a portal-less absolute dropdown with search for long lists.

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder: string;
  disabled?: boolean;
  searchable?: boolean; // show search box when list > 10 items (default true)
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  searchable = true,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;
  const showSearch = searchable && options.length > 10;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery("");
  };

  return (
    <div
      ref={ref}
      style={{ flex: 1, position: "relative", opacity: disabled ? 0.45 : 1 }}
    >
      {/* ── Trigger ── */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((p) => !p);
        }}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "11px 14px",
          borderRadius: "9px",
          cursor: disabled ? "not-allowed" : "pointer",
          background: "rgba(255,255,255,0.03)",
          border: open
            ? "1px solid rgba(16,185,129,0.45)"
            : "1px solid rgba(255,255,255,0.07)",
          color: selected ? "#e2e8f0" : "#475569",
          fontSize: "14px",
          fontWeight: selected ? 500 : 400,
          transition: "border-color 0.2s",
          boxShadow: open ? "0 0 0 3px rgba(16,185,129,0.06)" : "none",
          outline: "none",
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            textAlign: "left",
          }}
        >
          {selected?.label || placeholder}
        </span>
        <ChevronDown
          size={14}
          style={{
            flexShrink: 0,
            marginLeft: "8px",
            color: open ? "#10b981" : "#475569",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s, color 0.2s",
          }}
        />
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 100,
            background: "#0d1525",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: "12px",
            boxShadow:
              "0 24px 48px -8px rgba(0,0,0,0.7), 0 0 0 1px rgba(16,185,129,0.08)",
            overflow: "hidden",
          }}
        >
          {/* Accent top bar */}
          <div
            style={{
              height: "2px",
              background: "linear-gradient(90deg,#10b981,transparent)",
            }}
          />

          {/* Search box */}
          {showSearch && (
            <div
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "7px 10px",
                  borderRadius: "7px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <Search size={12} style={{ color: "#475569", flexShrink: 0 }} />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…"
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: "12px",
                    color: "#e2e8f0",
                  }}
                />
              </div>
            </div>
          )}

          {/* Options list */}
          <div style={{ maxHeight: "220px", overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: "16px",
                  textAlign: "center",
                  fontSize: "12px",
                  color: "#475569",
                }}
              >
                No results found
              </div>
            ) : (
              filtered.map((opt) => {
                const isSel = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "9px 14px",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: isSel ? "#34d399" : "#94a3b8",
                      background: isSel
                        ? "rgba(16,185,129,0.07)"
                        : "transparent",
                      transition: "background 0.12s, color 0.12s",
                      fontWeight: isSel ? 600 : 400,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSel) {
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.04)";
                        e.currentTarget.style.color = "#e2e8f0";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSel) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#94a3b8";
                      }
                    }}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {opt.label}
                    </span>
                    {isSel && (
                      <Check
                        size={13}
                        style={{
                          color: "#10b981",
                          flexShrink: 0,
                          marginLeft: "8px",
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
