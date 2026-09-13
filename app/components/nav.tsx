import Link from "next/link";
import type { Area } from "@/lib/os";

export function Nav({ name, areas, setUp }: { name: string; areas: Area[]; setUp: boolean }) {
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand">{name}</Link>
        {setUp && (
          <nav className="links">
            {areas.map((a) => (
              <Link key={a.key} href={`/area/${a.key}`}>{a.label}</Link>
            ))}
            <span className="sep" />
            <Link href="/history">History</Link>
            <Link href="/control">Control</Link>
            <Link href="/help">Help</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
