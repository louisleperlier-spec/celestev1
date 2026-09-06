import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 py-14">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-6 lg:flex-row lg:items-start lg:justify-between lg:px-10">
        <div className="text-center lg:text-left">
          <Link to="/" className="flex items-center justify-center gap-2 font-display text-xl lg:justify-start">
            <span className="text-gold-400">✦</span>
            <span>Céleste</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-mist-500">
            La carte de vos émotions, pour mieux naviguer chaque jour.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
          <div>
            <p className="mb-3 font-semibold text-mist-200">Produit</p>
            <ul className="space-y-2 text-mist-500">
              <li><a href="#carte" className="hover:text-mist-200">Carte des émotions</a></li>
              <li><a href="#fonctionnalites" className="hover:text-mist-200">Fonctionnalités</a></li>
              <li><a href="#tarifs" className="hover:text-mist-200">Tarifs</a></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-semibold text-mist-200">Ressources</p>
            <ul className="space-y-2 text-mist-500">
              <li><a href="#ressources" className="hover:text-mist-200">Bibliothèque</a></li>
              <li><a href="#ressources" className="hover:text-mist-200">Méditations</a></li>
              <li><a href="#ressources" className="hover:text-mist-200">Articles</a></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-semibold text-mist-200">Céleste</p>
            <ul className="space-y-2 text-mist-500">
              <li><Link to="/login" className="hover:text-mist-200">Connexion</Link></li>
              <li><Link to="/signup" className="hover:text-mist-200">Créer un compte</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-7xl border-t border-white/5 px-6 pt-6 text-center text-xs text-mist-600 lg:px-10">
        © {new Date().getFullYear()} Céleste. Fabriqué avec douceur, sous les étoiles.
      </div>
    </footer>
  );
}
