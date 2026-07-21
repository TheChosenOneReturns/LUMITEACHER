import { Link } from "react-router-dom";
import { Lumi } from "../components/Lumi";

export function LandingPage() {
  return (
    <section className="landing page-width">
      <div className="landing__copy">
        <span className="pill">Lectura + imaginación + IA</span>
        <h1>¡Cada historia es una nueva aventura!</h1>
        <p>
          Elegí lo que más te gusta, creá un cuento con Lumi y descubrí todo
          lo que aprendiste al leer.
        </p>
        <div className="button-row">
          <Link className="button button--yellow" to="/crear">
            <span aria-hidden="true">✨</span> Crear mi historia
          </Link>
          <Link className="button button--outline" to="/inicio">
            <span aria-hidden="true">📚</span> Explorar historias
          </Link>
        </div>
        <div className="landing__note">
          <Lumi message="¡Vos elegís la idea y yo te acompaño!" />
        </div>
      </div>

      <div className="hero-book" aria-label="Un libro mágico lleno de aventuras">
        <div className="hero-book__stars" aria-hidden="true">
          <span>★</span>
          <span>✦</span>
          <span>★</span>
        </div>
        <div className="hero-book__world" aria-hidden="true">
          <span>🚀</span>
          <span>🐉</span>
          <span>🏰</span>
          <span>🧜🏽‍♀️</span>
        </div>
        <div className="hero-book__cover">
          <strong>STORY</strong>
          <strong>TEACHER</strong>
          <small>AVENTURAS</small>
        </div>
      </div>
    </section>
  );
}

