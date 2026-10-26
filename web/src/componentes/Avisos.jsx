export default function Avisos({ avisos }) {
  return (
    <div className="avisos" aria-live="polite">
      {avisos.map((a) => (
        <div key={a.id} className={`aviso ${a.tipo}`}>{a.texto}</div>
      ))}
    </div>
  );
}
