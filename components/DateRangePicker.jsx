import { useState, useRef, useEffect } from "react";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DAYS_ZH = ["日", "一", "二", "三", "四", "五", "六"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_ZH = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

function isSameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function inRange(d, start, end) {
  if (!start || !end) return false;
  const t = d.getTime();
  return t >= start.getTime() && t <= end.getTime();
}
function fmt(d) {
  if (!d) return "";
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * Compact date range picker for map filter.
 * Click once for start, click again for end. Styled with brand colors.
 *
 * @param {{ startDate, endDate, onChange, locale, placeholder, forceOpenUpward }} props
 */
export default function DateRangePicker({
  startDate = null,
  endDate = null,
  onChange,
  locale = "zh",
  placeholder = "Date",
  forceOpenUpward = false,
}) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => startDate || new Date());
  const [picking, setPicking] = useState("start"); // "start" | "end"
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const ref = useRef(null);

  const isZh = locale === "zh";
  const dayLabels = isZh ? DAYS_ZH : DAYS;
  const monthLabels = isZh ? MONTHS_ZH : MONTHS_EN;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);

  // Sync with external props
  useEffect(() => { setTempStart(startDate); setTempEnd(endDate); }, [startDate, endDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();


  const handleDayClick = (day) => {
    const clicked = new Date(year, month, day);
    if (picking === "start") {
      setTempStart(clicked);
      setTempEnd(null);
      setPicking("end");
    } else {
      if (clicked < tempStart) {
        setTempStart(clicked);
        setTempEnd(tempStart);
      } else {
        setTempEnd(clicked);
      }
      setPicking("start");
      onChange?.({ start: clicked < tempStart ? clicked : tempStart, end: clicked < tempStart ? tempStart : clicked });
      setOpen(false);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setTempStart(null);
    setTempEnd(null);
    setPicking("start");
    onChange?.({ start: null, end: null });
    setOpen(false);
  };

  const displayText = tempStart
    ? tempEnd
      ? `${fmt(tempStart)} – ${fmt(tempEnd)}`
      : `${fmt(tempStart)} – ?`
    : placeholder;

  const cells = [];
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to 42 cells (6 rows) for consistent height
  while (cells.length < 42) cells.push(null);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block", width: "100%" }}>
      {/* Trigger */}
      <div
        tabIndex={0}
        role="button"
        onClick={() => setOpen(!open)}
        style={{
          background: "transparent",
          padding: "4px 36px 4px 4px",
          fontSize: 14,
          color: "var(--brand-primary)",
          borderTop: "none", borderRight: "none", borderLeft: "none",
          borderBottom: "1px solid var(--brand-primary)",
          borderRadius: 0,
          position: "relative",
          width: "100%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          userSelect: "none",
          outline: "none",
          fontWeight: "bold",
          fontFamily: '"Manrope", ui-sans-serif, system-ui, sans-serif',
          transition: "border-color 0.2s",
        }}
      >
        <span style={{ paddingRight: 20, wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.4 }}>
          {displayText}
        </span>
        {/* Clear button */}
        {tempStart && (
          <span
            onClick={handleClear}
            style={{
              position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)",
              cursor: "pointer", fontSize: 12, color: "var(--brand-secondary)", lineHeight: 1,
            }}
          >
            ×
          </span>
        )}
        <span
          aria-hidden="true"
          style={{
            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
            pointerEvents: "none", color: "var(--brand-secondary)", fontSize: 14, lineHeight: 1,
          }}
        >
          ▾
        </span>
      </div>

      {/* Calendar popup */}
      {open && (
        <div
          style={{
            position: "absolute",
            [forceOpenUpward ? "bottom" : "top"]: "100%",
            left: 0,
            marginTop: forceOpenUpward ? 0 : 6,
            marginBottom: forceOpenUpward ? 6 : 0,
            zIndex: 9999,
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(8px)",
            border: "1px solid var(--brand-secondary)",
            borderRadius: 8,
            padding: 12,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            width: 270,
            height: 355,
            overflow: "hidden",
            fontFamily: '"Manrope", ui-sans-serif, system-ui, sans-serif',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Header — year + month dropdowns */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <select
              value={year}
              onChange={(e) => setViewDate(new Date(parseInt(e.target.value), month, 1))}
              style={selectStyle}
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 3 + i).map((y) => (
                <option key={y} value={y}>{y}{isZh ? "年" : ""}</option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => setViewDate(new Date(year, parseInt(e.target.value), 1))}
              style={selectStyle}
            >
              {monthLabels.map((label, i) => (
                <option key={i} value={i}>{label}</option>
              ))}
            </select>
          </div>

          {/* Hint */}
          <div style={{ fontSize: 10, color: "var(--brand-secondary)", textAlign: "center", marginBottom: 6, fontStyle: "italic" }}>
            {picking === "start"
              ? (isZh ? "選擇起始日期" : "Select start date")
              : (isZh ? "選擇結束日期" : "Select end date")}
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, textAlign: "center", marginBottom: 4 }}>
            {dayLabels.map((d) => (
              <div key={d} style={{ fontSize: 10, color: "var(--brand-primary)", opacity: 0.5, padding: "2px 0" }}>{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
            {cells.map((day, i) => {
              if (day === null) return <div key={`e${i}`} />;
              const d = new Date(year, month, day);
              const isStart = isSameDay(d, tempStart);
              const isEnd = isSameDay(d, tempEnd);
              const isInRange = inRange(d, tempStart, tempEnd);
              const isToday = isSameDay(d, new Date());

              let bg = "transparent";
              let color = "var(--brand-primary)";
              let fontWeight = 300;
              let border = "none";

              if (isStart || isEnd) {
                bg = "var(--brand-secondary)";
                color = "#fff";
                fontWeight = 600;
              } else if (isInRange) {
                bg = "rgba(237, 80, 36, 0.1)";
              }
              if (isToday && !isStart && !isEnd) {
                border = "1px solid var(--brand-primary)";
              }

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  style={{
                    background: bg,
                    color,
                    fontWeight,
                    border,
                    borderRadius: 4,
                    width: "100%",
                    aspectRatio: "1",
                    fontSize: 12,
                    cursor: "pointer",
                    padding: 0,
                    fontFamily: "inherit",
                    transition: "background 0.15s",
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Reset + Close */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
            <button
              onClick={(e) => { e.stopPropagation(); handleClear(e); }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 11, color: "var(--brand-secondary)", fontFamily: "inherit",
                textDecoration: "underline", padding: "2px 0",
              }}
            >
              {isZh ? "重置" : "Reset"}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 11, color: "var(--brand-primary)", fontFamily: "inherit",
                padding: "2px 0",
              }}
            >
              {isZh ? "關閉" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const selectStyle = {
  background: "transparent",
  border: "none",
  borderBottom: "1px solid var(--brand-primary)",
  borderRadius: 0,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--brand-primary)",
  padding: "2px 4px",
  fontFamily: "inherit",
  outline: "none",
  appearance: "auto",
};
