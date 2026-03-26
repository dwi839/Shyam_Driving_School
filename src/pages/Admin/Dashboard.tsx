import Modal from "../../components/Modal";
import StatusBadge from "../../components/StatusBadge";
import { S } from "../../styles/styles";
import type { Enrollment, EnrollmentStatus } from "../../types/enrollment";

type DashboardProps = {
  enrollments: Enrollment[];
  selectedEnrollment: Enrollment | null;
  setSelectedEnrollment: (enrollment: Enrollment | null) => void;
  onUpdateStatus: (id: string, status: EnrollmentStatus) => void;
  search: string;
  setSearch: (value: string) => void;
  filterStatus: "all" | EnrollmentStatus;
  setFilterStatus: (value: "all" | EnrollmentStatus) => void;
  onLogout: () => void;
};

export default function Dashboard({
  enrollments,
  selectedEnrollment,
  setSelectedEnrollment,
  onUpdateStatus,
  search,
  setSearch,
  filterStatus,
  setFilterStatus,
  onLogout,
}: DashboardProps) {
  const filtered = enrollments.filter((e) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q);
    const matchS = filterStatus === "all" || e.status === filterStatus;
    return matchQ && matchS;
  });

  const stats = {
    total: enrollments.length,
    pending: enrollments.filter((e) => e.status === "pending").length,
    confirmed: enrollments.filter((e) => e.status === "confirmed").length,
    completed: enrollments.filter((e) => e.status === "completed").length,
  };

  return (
    <div style={S.adminWrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <div style={S.pageTitle}>Admin Dashboard</div>
          <div style={{ color: "#555", fontSize: 14 }}>All student enrollments at a glance</div>
        </div>
        <button onClick={onLogout} style={{ ...S.filterBtn(false), fontSize: 13 }}>
          Logout
        </button>
      </div>

      <div style={S.statsRow}>
        {[
          ["Total", stats.total, "#f97316"],
          ["Pending", stats.pending, "#f59e0b"],
          ["Confirmed", stats.confirmed, "#10b981"],
          ["Completed", stats.completed, "#6366f1"],
        ].map(([label, num, color]) => (
          <div key={label as string} style={S.statCard(color as string)}>
            <div style={{ ...S.statNum, color: color as string }}>{num}</div>
            <div style={S.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      <div style={S.toolbar}>
        <input
          style={S.searchInput}
          placeholder="Search by name, email, ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {(["all", "pending", "confirmed", "completed", "cancelled"] as const).map((s) => (
          <button key={s} style={S.filterBtn(filterStatus === s)} onClick={() => setFilterStatus(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ background: "#12121c", border: "1px solid #1e1e2e", borderRadius: 16, overflow: "hidden" }}>
        <table style={S.table}>
          <thead>
            <tr>
              {["ID", "Name", "Phone", "License", "Pickup Location", "Slot", "Status", "Actions"].map((h) => (
                <th key={h} style={S.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ ...S.td, textAlign: "center", color: "#555", padding: 40 }}>
                  No enrollments found
                </td>
              </tr>
            )}
            {filtered.map((e) => (
              <tr key={e.id} style={{ cursor: "pointer" }} onClick={() => setSelectedEnrollment(e)}>
                <td style={{ ...S.td, color: "#f97316", fontWeight: 700 }}>{e.id}</td>
                <td style={{ ...S.td, fontWeight: 600 }}>
                  {e.name}
                  <div style={{ color: "#555", fontSize: 12 }}>{e.email}</div>
                </td>
                <td style={S.td}>{e.phone}</td>
                <td style={S.td}>{e.licenseType}</td>
                <td style={{ ...S.td, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {e.pickupAddress}
                </td>
                <td style={S.td}>{e.preferredTime}</td>
                <td style={S.td}>
                  <StatusBadge status={e.status} />
                </td>
                <td style={S.td} onClick={(ev) => ev.stopPropagation()}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {e.status !== "confirmed" && (
                      <button style={S.actionBtn("#10b981")} onClick={() => onUpdateStatus(e.id, "confirmed")}>
                        Confirm
                      </button>
                    )}
                    {e.status !== "completed" && (
                      <button style={S.actionBtn("#6366f1")} onClick={() => onUpdateStatus(e.id, "completed")}>
                        Done
                      </button>
                    )}
                    {e.status !== "cancelled" && (
                      <button style={S.actionBtn("#ef4444")} onClick={() => onUpdateStatus(e.id, "cancelled")}>
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ color: "#444", fontSize: 13, marginTop: 12 }}>
        Showing {filtered.length} of {enrollments.length} enrollments
      </div>

      <Modal isOpen={!!selectedEnrollment} onClose={() => setSelectedEnrollment(null)}>
        {selectedEnrollment && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 20 }}>{selectedEnrollment.name}</div>
                <div style={{ color: "#f97316", fontSize: 13, fontWeight: 700 }}>{selectedEnrollment.id}</div>
              </div>
              <button
                onClick={() => setSelectedEnrollment(null)}
                style={{ background: "none", border: "none", color: "#666", fontSize: 22, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <StatusBadge status={selectedEnrollment.status} />
            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                ["Email", selectedEnrollment.email],
                ["Phone", selectedEnrollment.phone],
                ["Age", selectedEnrollment.age],
                ["License", selectedEnrollment.licenseType],
                ["Slot", selectedEnrollment.preferredTime],
                ["Experience", selectedEnrollment.experience],
                ["Pickup", selectedEnrollment.pickupAddress],
                [
                  "Submitted",
                  new Date(selectedEnrollment.submittedAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }),
                ],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <div style={{ color: "#555", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
              <button
                style={{ ...S.actionBtn("#10b981"), padding: "8px 16px", fontSize: 13 }}
                onClick={() => onUpdateStatus(selectedEnrollment.id, "confirmed")}
              >
                Confirm
              </button>
              <button
                style={{ ...S.actionBtn("#6366f1"), padding: "8px 16px", fontSize: 13 }}
                onClick={() => onUpdateStatus(selectedEnrollment.id, "completed")}
              >
                Complete
              </button>
              <button
                style={{ ...S.actionBtn("#ef4444"), padding: "8px 16px", fontSize: 13 }}
                onClick={() => onUpdateStatus(selectedEnrollment.id, "cancelled")}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
