import { Link } from "react-router-dom";
import { Lumi } from "../components/Lumi";

export function NotFoundPage() {
  return (
    <section className="page-state">
      <Lumi message="Parece que este camino no estaba en el mapa." />
      <h1>Página no encontrada</h1>
      <Link className="button button--primary" to="/inicio">
        Volver al inicio
      </Link>
    </section>
  );
}

