import { S } from "../styles/styles";

type HomeProps = {
  onStartEnrollment: () => void;
};

export default function Home({ onStartEnrollment }: HomeProps) {
  return (
    <>
      <div style={S.hero}>
        <h1 style={S.h1}>
          Learn to Drive
          <br />
          <span style={S.accent}>the Right Way.</span>
        </h1>
        <p style={S.sub}>
          Professional instructors, flexible pickup, and structured lessons designed
          to get you road-ready fast.
        </p>
        <button style={S.ctaBtn} onClick={onStartEnrollment}>
          Start Your Journey →
        </button>
      </div>

      <div style={S.featureGrid}>
        {[
          ["🚗", "Expert Instructors", "Certified trainers with 10+ years of experience teaching defensive driving."],
          ["📍", "Pickup From Home", "We come to your location — no hassle, just get in and learn."],
          ["📅", "Flexible Timing", "Morning, afternoon, or evening slots to fit your schedule."],
          ["🏆", "High Pass Rate", "95% of our students clear the license test on their first attempt."],
          ["📱", "Track Progress", "Real-time updates on your training sessions and performance."],
          ["💳", "Easy Enrollment", "Simple online form — sign up in under 2 minutes."],
        ].map(([icon, title, desc]) => (
          <div key={title} style={S.featureCard}>
            <div style={S.featureIcon}>{icon}</div>
            <div style={S.featureTitle}>{title}</div>
            <div style={S.featureDesc}>{desc}</div>
          </div>
        ))}
      </div>
    </>
  );
}
