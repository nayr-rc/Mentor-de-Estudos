import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <AlertCircle size={48} className="mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
          Página não encontrada
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          A página que você está procurando não existe.
        </p>
        <Link href="/">
          <span
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-white inline-block cursor-pointer"
            style={{ background: "#7c6af5" }}
          >
            Voltar ao Dashboard
          </span>
        </Link>
      </div>
    </div>
  );
}
