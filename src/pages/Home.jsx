import lumi from "../assets/lumi.png";
import "./Home.css";

export default function Home() {
  return (
    <>
      <header className="home-header">
        <img src={lumi} alt="Lumi médite" className="home-header__lumi" />
        <div className="home-header__bubble">
          <div className="home-header__greeting">Bonsoir Léa ✦</div>
          <div className="home-header__quote">
            « Respire… la lune gibbeuse veille sur toi ce soir. »
          </div>
        </div>
        <div className="home-header__spacer" />
        <div className="points-badge">
          <span>✦</span>
          12 pts
        </div>
      </header>

      <div className="home-row home-row--top">
        <section className="card card--mirror">
          <div className="card--mirror__icon">✦</div>
          <div className="card--mirror__body">
            <div className="card-label">PROCHAINE HEURE MIROIR</div>
            <div className="card--mirror__time">21:21</div>
            <div className="card--mirror__sub">
              dans 22 min — prépare ton vœu ✦
            </div>
          </div>
          <div className="home-row__spacer" />
          <button type="button" className="cta cta--gradient">
            Attraper ✦
          </button>
        </section>

        <section className="card card--daily">
          <div className="card--daily__star card--daily__star--1">✦</div>
          <div className="card--daily__star card--daily__star--2">✦</div>
          <div className="card--daily__star card--daily__star--3">✦</div>
          <div className="card-label card-label--night">TA CARTE DU JOUR</div>
          <div className="card--daily__title">Touche pour révéler ✦</div>
          <div className="card--daily__sub">
            Lumi a tiré une intention pour toi
          </div>
        </section>
      </div>

      <div className="home-row home-row--bottom">
        <section className="card card--meditation">
          <div className="card-label card-label--meditation">
            MÉDITATION DU SOIR
          </div>
          <div className="card--meditation__title">Respiration 4-7-8</div>
          <div className="card--meditation__sub">5 min · voix douce</div>
          <div className="card--meditation__action">
            <div className="card--meditation__play">▶</div>
            <span>Commencer</span>
          </div>
        </section>

        <section className="card card--journal">
          <div className="card-label card-label--journal">
            JOURNAL DU SOIR
          </div>
          <div className="card--journal__title">
            Quelle petite joie as-tu attrapée aujourd'hui ?
          </div>
          <button type="button" className="cta cta--journal">
            Écrire ✎
          </button>
        </section>

        <section className="card card--moon">
          <div className="card-label card-label--moon">LUNE CE SOIR</div>
          <div className="card--moon__row">
            <div className="card--moon__disc" />
            <div>
              <div className="card--moon__title">Gibbeuse croissante</div>
              <div className="card--moon__sub">
                Rituel de gratitude dès 21h ☾
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="points-bar">
        <div className="points-bar__icon">✦</div>
        <div className="points-bar__label">Mes points</div>
        <div className="points-bar__track">
          <div className="points-bar__fill" style={{ width: "12%" }} />
        </div>
        <div className="points-bar__text">
          12/100 · chaque heure miroir = 1 point ✦
        </div>
      </section>
    </>
  );
}
