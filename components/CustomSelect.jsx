import { useState, useEffect, useRef, useMemo } from "react";

/**
 * CustomSelect
 * Brand-consistent dropdown with underline trigger, triangle indicator,
 * keyboard navigation, and directional open (up/down).
 *
 * Props:
 *   style          – inline styles for the trigger element
 *   value          – controlled value
 *   onChange       – ({ target: { value } }) => void
 *   children       – <option value="…">label</option> elements
 *   arrowRight     – right offset for ▾ indicator (default 8)
 *   dropdownMaxHeight – max height of dropdown menu (default 200)
 *   menuZIndex     – z-index of dropdown menu (default 1000)
 *   forceOpenUpward – always open upward (default false)
 */
export default function CustomSelect({
  style,
  children,
  value,
  onChange,
  arrowRight = 8,
  dropdownMaxHeight = 200,
  menuZIndex = 9999,
  forceOpenUpward = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [openUpward, setOpenUpward] = useState(false);

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const wasOpenRef = useRef(false);

  // Block wheel/gesture events at the native level so they never reach
  // parent native handlers (e.g. map zoom via addEventListener).
  // React onWheel stopPropagation only affects the synthetic layer.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const stopWheel = (e) => e.stopPropagation();
    const stopGesture = (e) => { e.stopPropagation(); e.preventDefault(); };

    el.addEventListener("wheel", stopWheel, { passive: false });
    el.addEventListener("gesturestart", stopGesture, { passive: false });
    el.addEventListener("gesturechange", stopGesture, { passive: false });

    return () => {
      el.removeEventListener("wheel", stopWheel);
      el.removeEventListener("gesturestart", stopGesture);
      el.removeEventListener("gesturechange", stopGesture);
    };
  }, []);

  const options = useMemo(() => {
    const arr = [];
    const ReactPkg = require("react");
    ReactPkg.Children.forEach(children, (child) => {
      if (!child) return;
      if (child.type === "option") {
        arr.push({
          value: child.props.value ?? "",
          label: child.props.children ?? "",
          disabled: !!child.props.disabled,
        });
      }
    });
    return arr;
  }, [children]);

  const selectedOption =
    options.find((opt) => opt.value === value) ||
    options.find((opt) => !opt.disabled) ||
    options[0] ||
    { value: "", label: "" };

  const hasWidth = style?.width || style?.minWidth;

  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setHoveredIndex(-1);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }

    // Only initialize hoveredIndex when transitioning from closed → open
    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      const idx = options.findIndex((o) => o.value === value && !o.disabled);
      if (idx >= 0) setHoveredIndex(idx);
      else setHoveredIndex(options.findIndex((o) => !o.disabled));
    }

    if (forceOpenUpward) {
      setOpenUpward(true);
      return;
    }

    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const estimatedMenuHeight = Math.min(dropdownMaxHeight, options.length * 40);

    if (spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow) setOpenUpward(true);
    else setOpenUpward(false);
  }, [isOpen, options, value, dropdownMaxHeight, forceOpenUpward]);

  const emitChange = (nextValue) => onChange?.({ target: { value: nextValue } });

  const close = () => {
    setIsOpen(false);
    setHoveredIndex(-1);
  };

  const pick = (opt) => {
    if (!opt || opt.disabled) return;
    emitChange(opt.value);
    close();
    requestAnimationFrame(() => triggerRef.current?.focus?.());
  };

  const moveHover = (dir) => {
    if (!options.length) return;
    let i = hoveredIndex;
    for (let step = 0; step < options.length + 1; step++) {
      i = i + dir;
      if (i < 0) i = options.length - 1;
      if (i >= options.length) i = 0;
      if (!options[i].disabled) {
        setHoveredIndex(i);
        return;
      }
    }
  };

  const handleKeyDown = (e) => {
    e.stopPropagation();

    if (!isOpen) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveHover(1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      moveHover(-1);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      pick(options[hoveredIndex]);
      return;
    }
  };

  const isFocused = isOpen;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "inline-block",
        width: hasWidth ? style.width : undefined,
        minWidth: style?.minWidth,
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        ref={triggerRef}
        tabIndex={0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onKeyDown={handleKeyDown}
        onClick={() => setIsOpen((v) => !v)}
        style={{
          ...style,
          border: "none",
          borderBottom: `1px solid ${isFocused ? "var(--brand-secondary)" : "var(--brand-primary)"}`,
          borderRadius: 0,
          background: "transparent",
          position: "relative",
          paddingRight: 56,
          width: hasWidth ? "100%" : style?.width,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          userSelect: "none",
          outline: "none",
          color: isFocused ? "var(--brand-secondary)" : style?.color || "var(--brand-primary)",
          transition: "border-color 0.2s, color 0.2s",
        }}
      >
        <span style={{ paddingRight: 20 }}>{selectedOption?.label ?? ""}</span>

        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: arrowRight,
            top: "50%",
            transform: isOpen
              ? openUpward
                ? "translateY(-50%)"
                : "translateY(-50%) rotate(180deg)"
              : "translateY(-50%)",
            pointerEvents: "none",
            color: "var(--brand-secondary)",
            fontSize: 14,
            lineHeight: 1,
            transition: "transform 0.2s",
          }}
        >
          &#x25BE;
        </span>
      </div>

      {isOpen && (
        <ul
          role="listbox"
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className="custom-select-menu"
          style={{
            position: "absolute",
            ...(openUpward
              ? { bottom: "100%", marginBottom: 6, marginTop: 0 }
              : { top: "100%", marginTop: 6, marginBottom: 0 }),
            left: 0,
            right: 0,
            padding: 0,
            listStyle: "none",
            background: "rgba(255, 255, 255, 0.3)",
            backdropFilter: "blur(2px)",
            border: "1px solid var(--brand-secondary)",
            borderRadius: 6,
            maxHeight: `${dropdownMaxHeight}px`,
            overflowY: "auto",
            zIndex: menuZIndex,
            boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
          }}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHovered = index === hoveredIndex;

            return (
              <li
                key={`${option.value}-${index}`}
                role="option"
                aria-selected={isSelected}
                style={{
                  padding: "4px 8px",
                  cursor: option.disabled ? "not-allowed" : "pointer",
                  backgroundColor: isSelected
                    ? "rgba(36, 131, 255, 0.9)"
                    : isHovered
                    ? "rgba(237, 80, 36, 0.9)"
                    : "transparent",
                  color: isSelected || isHovered ? "white" : "var(--brand-primary)",
                  transition: "background-color 0.12s, color 0.12s",
                  opacity: option.disabled ? 0.5 : 1,
                  fontSize: style?.fontSize || 14,
                }}
                onMouseEnter={() => !option.disabled && setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(-1)}
                onClick={() => pick(option)}
              >
                {option.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
