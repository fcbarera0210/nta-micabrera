'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { label: 'Inicio', id: 'inicio' },
  { label: 'Sobre mí', id: 'sobre-mí' },
  { label: 'Dirigido a', id: 'dirigido-a' },
  { label: 'Servicios', id: 'servicios' },
  { label: 'Recetas', id: 'recetas' },
  { label: 'Contacto', id: 'contacto' },
  { label: 'Reserva', id: 'reserva' },
];

export function PublicHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function handleNavClick(sectionId: string) {
    if (pathname === '/') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      router.push(`/#${sectionId}`);
    }
  }

  function handlePrimaryCta() {
    handleNavClick('reserva');
  }

  return (
    <>
      <nav className="fixed w-full z-50 bg-white/70 backdrop-blur-lg border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg flex items-center justify-center">
              <Image src="/svg/isotipo-1.svg" alt="Mica Cabrera" width={32} height={32} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-serif font-bold text-purple-950 leading-none">
                Mica Cabrera
              </span>
              <span className="text-[10px] uppercase tracking-widest text-purple-600 font-bold">
                Nutricionista
              </span>
            </div>
          </div>

          <div className="hidden md:flex gap-8 text-sm font-semibold text-purple-950/70">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="hover:text-purple-600 transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-400 transition-all group-hover:w-full" />
              </button>
            ))}
          </div>

          <button
            onClick={handlePrimaryCta}
            className="hidden md:block bg-purple-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-purple-800 transition-all shadow-lg"
          >
            Agendar Hora
          </button>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-purple-900"
            aria-label="Abrir menú"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-purple-950 text-white p-10 flex flex-col justify-center gap-8 text-center"
          >
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-8 right-8 p-2"
              aria-label="Cerrar menú"
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {NAV_ITEMS.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => {
                  setIsMenuOpen(false);
                  handleNavClick(id);
                }}
                className="text-4xl font-serif"
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

