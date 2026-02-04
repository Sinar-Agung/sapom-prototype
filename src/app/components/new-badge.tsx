export function NewBadge({ className = "" }: { className?: string }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Red ribbon/badge background */}
      <path
        d="M2 4C2 2.89543 2.89543 2 4 2H28C29.1046 2 30 2.89543 30 4V16C30 17.1046 29.1046 18 28 18H4C2.89543 18 2 17.1046 2 16V4Z"
        fill="#DC2626"
      />
      {/* Slight gradient overlay for depth */}
      <path
        d="M2 4C2 2.89543 2.89543 2 4 2H28C29.1046 2 30 2.89543 30 4V16C30 17.1046 29.1046 18 28 18H4C2.89543 18 2 17.1046 2 16V4Z"
        fill="url(#gradient)"
        fillOpacity="0.3"
      />
      {/* Text: NEW */}
      <text
        x="16"
        y="13"
        fontFamily="Arial, sans-serif"
        fontSize="9"
        fontWeight="bold"
        fill="white"
        textAnchor="middle"
      >
        NEW
      </text>
      {/* Shadow for text */}
      <defs>
        <linearGradient id="gradient" x1="16" y1="2" x2="16" y2="18">
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </linearGradient>
      </defs>
    </svg>
  );
}
