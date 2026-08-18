import { Link } from "react-router-dom";

export function NotFoundPage() {
  return <main className="not-found"><span>404</span><h1>This street hasn’t been built yet.</h1><Link to="/">Return to the plaza</Link></main>;
}
