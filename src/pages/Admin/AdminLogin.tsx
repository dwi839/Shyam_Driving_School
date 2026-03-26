import { S } from "../../styles/styles";

type AdminLoginProps = {
  adminPw: string;
  pwError: boolean;
  setAdminPw: (value: string) => void;
  setPwError: (value: boolean) => void;
  onLogin: () => void;
};

export default function AdminLogin({
  adminPw,
  pwError,
  setAdminPw,
  setPwError,
  onLogin,
}: AdminLoginProps) {
  return (
    <div style={S.loginWrap}>
      <div style={S.loginCard}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
        <div style={{ fontWeight: 900, fontSize: 24, marginBottom: 6 }}>Admin Login</div>
        <div style={{ color: "#666", fontSize: 14, marginBottom: 28 }}>
          Enter password to access the dashboard. (hint: <strong>admin123</strong>)
        </div>
        <div style={S.fieldGroup}>
          <label style={S.label}>Password</label>
          <input
            type="password"
            style={{ ...S.input, ...(pwError ? S.inputErr : {}) }}
            placeholder="••••••••"
            value={adminPw}
            onChange={(e) => {
              setAdminPw(e.target.value);
              setPwError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onLogin();
            }}
          />
          {pwError && <span style={S.errMsg}>Incorrect password</span>}
        </div>
        <button style={{ ...S.submitBtn, marginTop: 20 }} onClick={onLogin}>
          Login →
        </button>
      </div>
    </div>
  );
}
