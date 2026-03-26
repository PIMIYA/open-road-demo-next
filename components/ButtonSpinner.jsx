/**
 * Inline spinning loader for buttons.
 * Drop inside any <Button> next to the label text.
 *
 * Usage: <Button disabled={busy}>{busy && <ButtonSpinner />} Label</Button>
 */
export default function ButtonSpinner({ size = 16, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        animation: "btn-spin 0.8s linear infinite",
        flexShrink: 0,
        marginRight: 6,
        verticalAlign: "middle",
      }}
    >
      <style>{`@keyframes btn-spin { to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="50 20"
        opacity="0.9"
      />
    </svg>
  );
}
