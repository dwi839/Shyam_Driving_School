import type { View } from "../types/enrollment";
import { S } from "../styles/styles";

type NavbarProps = {
  view: View;
  onChangeView: (view: View) => void;
};

export default function Navbar({ view, onChangeView }: NavbarProps) {
  return (
    <nav style={S.nav}>
      <div style={S.logo}>⚡ DriveRight</div>
      <div style={S.navLinks}>
        <button style={S.navBtn(view === "home")} onClick={() => onChangeView("home")}>
          Home
        </button>
        <button style={S.navBtn(view === "enroll")} onClick={() => onChangeView("enroll")}>
          Enroll Now
        </button>
        <button style={S.navBtn(view === "admin")} onClick={() => onChangeView("admin")}>
          Admin
        </button>
      </div>
    </nav>
  );
}
