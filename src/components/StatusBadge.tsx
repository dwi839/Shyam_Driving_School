import type { EnrollmentStatus } from "../types/enrollment";

type StatusBadgeProps = {
  status: EnrollmentStatus;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const map: Record<EnrollmentStatus, [string, string]> = {
    pending: ["#f59e0b", "#fef3c7"],
    confirmed: ["#10b981", "#d1fae5"],
    completed: ["#6366f1", "#e0e7ff"],
    cancelled: ["#ef4444", "#fee2e2"],
  };

  const [color, bg] = map[status];

  return (
    <span
      style={{
        background: bg,
        color,
        border: `1px solid ${color}`,
        borderRadius: 20,
        padding: "3px 12px",
        fontSize: 12,
        fontWeight: 700,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
}
