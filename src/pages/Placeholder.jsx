import "./Placeholder.css";

export default function Placeholder({ title, tagline }) {
  return (
    <section className="placeholder">
      <div className="placeholder__badge">✦</div>
      <h1 className="placeholder__title">{title}</h1>
      <p className="placeholder__tagline">{tagline}</p>
      <div className="placeholder__note">Bientôt disponible ✦</div>
    </section>
  );
}
