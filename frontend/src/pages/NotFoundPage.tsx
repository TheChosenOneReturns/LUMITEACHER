import { ArrowLeftIcon } from "../components/icons";
import { Link } from "react-router-dom";
import { Lumi } from "../components/Lumi";

export function NotFoundPage() {
  return (
    <section className="page-state">
      <Lumi mood="encouraging" message="¡Ups! Parece que este camino no estaba en el mapa." />
      <h1>Esta página no existe</h1>
      <p>Pero no te preocupes, podés volver al inicio y seguir explorando.</p>
      <Link className="button button--primary" to="/inicio">
        <ArrowLeftIcon size={21} weight="bold" /> Volver al inicio
      </Link>
    </section>
  );
}
