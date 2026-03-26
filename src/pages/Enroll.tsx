import { useState } from "react";
import { S } from "../styles/styles";
import type { EnrollmentFormData } from "../types/enrollment";

type EnrollProps = {
  onSubmit: (form: EnrollmentFormData) => string | null;
  successId: string | null;
  onClearSuccess: () => void;
};

const EMPTY_FORM: EnrollmentFormData = {
  name: "",
  email: "",
  phone: "",
  age: "",
  licenseType: "Car (4W)",
  pickupAddress: "",
  preferredTime: "Morning (8–11 AM)",
  experience: "beginner",
};

export default function Enroll({ onSubmit, successId, onClearSuccess }: EnrollProps) {
  const [form, setForm] = useState<EnrollmentFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<EnrollmentFormData>>({});

  const validate = () => {
    const e: Partial<EnrollmentFormData> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (!/^\d{5,15}$/.test(form.phone.replace(/\s/g, ""))) e.phone = "Valid phone required";
    if (!form.age || +form.age < 16 || +form.age > 70) e.age = "Age must be 16–70";
    if (!form.pickupAddress.trim()) e.pickupAddress = "Pickup location is required";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    const id = onSubmit(form);
    if (id) {
      setForm(EMPTY_FORM);
      setErrors({});
    }
  };

  return (
    <div style={S.formWrap}>
      <div style={S.pageTitle}>Enrollment Form</div>
      <div style={S.pageSubtitle}>Fill in your details and we'll get back to you within 24 hours.</div>

      {successId && (
        <div style={S.successBox}>
          <div style={{ fontSize: 36 }}>✅</div>
          <div style={{ fontWeight: 800, fontSize: 20, marginTop: 8 }}>You're registered!</div>
          <div style={{ color: "#10b981", marginTop: 4 }}>
            Your enrollment ID: <strong>{successId}</strong>
          </div>
          <div style={{ color: "#666", fontSize: 13, marginTop: 8 }}>
            We'll call you within 24 hours to confirm your slot.
          </div>
          <button style={{ ...S.filterBtn(false), marginTop: 16 }} onClick={onClearSuccess}>
            Close
          </button>
        </div>
      )}

      <div style={S.card}>
        <div style={S.fieldRow}>
          <div style={S.fieldGroup}>
            <label style={S.label}>Full Name *</label>
            <input
              style={{ ...S.input, ...(errors.name ? S.inputErr : {}) }}
              placeholder="Rahul Kumar"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            {errors.name && <span style={S.errMsg}>{errors.name}</span>}
          </div>
          <div style={S.fieldGroup}>
            <label style={S.label}>Age *</label>
            <input
              style={{ ...S.input, ...(errors.age ? S.inputErr : {}) }}
              placeholder="22"
              type="number"
              value={form.age}
              onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
            />
            {errors.age && <span style={S.errMsg}>{errors.age}</span>}
          </div>
        </div>

        <div style={S.fieldRow}>
          <div style={S.fieldGroup}>
            <label style={S.label}>Email *</label>
            <input
              style={{ ...S.input, ...(errors.email ? S.inputErr : {}) }}
              placeholder="you@email.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            {errors.email && <span style={S.errMsg}>{errors.email}</span>}
          </div>
          <div style={S.fieldGroup}>
            <label style={S.label}>Phone *</label>
            <input
              style={{ ...S.input, ...(errors.phone ? S.inputErr : {}) }}
              placeholder="98765 43210"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            {errors.phone && <span style={S.errMsg}>{errors.phone}</span>}
          </div>
        </div>

        <div style={S.fieldRow}>
          <div style={S.fieldGroup}>
            <label style={S.label}>License Type</label>
            <select
              style={S.select}
              value={form.licenseType}
              onChange={(e) => setForm((f) => ({ ...f, licenseType: e.target.value }))}
            >
              <option>Car (4W)</option>
              <option>Bike (2W)</option>
              <option>Commercial Vehicle</option>
            </select>
          </div>
          <div style={S.fieldGroup}>
            <label style={S.label}>Experience Level</label>
            <select
              style={S.select}
              value={form.experience}
              onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
            >
              <option value="beginner">Beginner – Never Driven</option>
              <option value="some">Some Experience</option>
              <option value="refresher">Refresher Needed</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={S.fieldGroup}>
            <label style={S.label}>Pickup Address *</label>
            <input
              style={{ ...S.input, ...(errors.pickupAddress ? S.inputErr : {}) }}
              placeholder="House No., Street, Sector, City"
              value={form.pickupAddress}
              onChange={(e) => setForm((f) => ({ ...f, pickupAddress: e.target.value }))}
            />
            {errors.pickupAddress && <span style={S.errMsg}>{errors.pickupAddress}</span>}
          </div>
        </div>

        <div style={S.fieldGroup}>
          <label style={S.label}>Preferred Time Slot</label>
          <select
            style={S.select}
            value={form.preferredTime}
            onChange={(e) => setForm((f) => ({ ...f, preferredTime: e.target.value }))}
          >
            <option>Morning (8–11 AM)</option>
            <option>Afternoon (12–3 PM)</option>
            <option>Evening (4–7 PM)</option>
          </select>
        </div>

        <button style={S.submitBtn} onClick={handleSubmit}>
          Submit Enrollment →
        </button>
      </div>
    </div>
  );
}
