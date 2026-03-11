'use client';

import Image from 'next/image';

interface PublicFooterProps {
  whatsappPhone?: string | null;
  contactEmail?: string | null;
  instagramHandle?: string | null;
}

export function PublicFooter({
  whatsappPhone,
  contactEmail,
  instagramHandle,
}: PublicFooterProps) {
  const phoneNumber = whatsappPhone?.replace(/\D/g, '') || '';
  const hasWhatsapp = phoneNumber.length > 0;
  const whatsappHref = hasWhatsapp ? `https://wa.me/${phoneNumber}` : '#';

  const handle = instagramHandle || 'nta.micabrera';
  const instagramUrl = `https://www.instagram.com/${handle.replace(/^@/, '')}/`;

  const emailHref = contactEmail ? `mailto:${contactEmail}` : '#';

  return (
    <footer className="bg-white pt-24 pb-12 px-6 border-t border-purple-50">
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex flex-col items-center gap-6 mb-12">
          <div className="p-3 rounded-2xl flex items-center justify-center">
            <Image src="/svg/isotipo-1.svg" alt="Mica Cabrera" width={48} height={48} />
          </div>
          <h4 className="text-3xl font-serif text-purple-950">Nutrición Mica Cabrera</h4>
          <div className="flex gap-10 text-sm font-bold text-purple-600/60 uppercase tracking-widest">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-900 transition-colors"
            >
              Instagram
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-900 transition-colors"
            >
              WhatsApp
            </a>
            <a
              href={emailHref}
              className="hover:text-purple-900 transition-colors"
            >
              Email
            </a>
          </div>
        </div>
        <p className="text-xs text-slate-300 font-medium tracking-wide italic">
          &quot;Por una nutrición más humana, inclusiva y libre de juicios&quot;
        </p>
        <div className="w-16 h-px bg-slate-100 mx-auto my-8" />
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          © 2026 Mica Cabrera • Hecho con 💜 por{' '}
          <a
            href="https://charlideas.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-500 hover:text-purple-700 transition-colors normal-case"
          >
            charl!deas
          </a>
        </p>
      </div>
    </footer>
  );
}

