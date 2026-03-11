'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfDay, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { getActiveServices, getAvailableSlots, createReservation } from '@/app/actions/booking';
import type { Modality } from '@/app/actions/booking';
import type { TimeSlot } from '@/lib/availability/slots';
import type { Service, RecipeCategory } from '@/lib/db/schema';
import type { RecipeWithRelations } from '@/lib/db/recipes';
import { isValidRut } from '@/lib/validation/rut';
import { isValidChilePhone } from '@/lib/validation/phone';
import { PublicFooter } from '@/components/PublicFooter';
import { PublicHeader } from '@/components/PublicHeader';

// Iconos SVG personalizados
const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white"><path d="m7 4 12 8-12 8V4z"/></svg>
);


const FloatingBubble = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <motion.div
    className={`absolute rounded-full mix-blend-multiply filter blur-xl opacity-20 ${className}`}
    animate={{
      y: [0, -30, 0],
      scale: [1, 1.1, 1],
    }}
    transition={{
      duration: 7,
      repeat: Infinity,
      delay: delay,
      ease: 'easeInOut',
    }}
  />
);

const HERO_IMG = '/mica-2.jpeg';
const CONTACT_IMG = '/mica-2.jpeg';

interface HomePageProps {
  initialRecipes: RecipeWithRelations[];
  initialRecipeCategories: RecipeCategory[];
  siteSettings: {
    whatsappPhone: string | null;
    contactEmail: string | null;
    instagramHandle: string | null;
  } | null;
}

export default function HomePage({ initialRecipes, initialRecipeCategories, siteSettings }: HomePageProps) {
  const [bookingStep, setBookingStep] = useState(1);
  const [activeCategory, setActiveCategory] = useState('Todas');

  // Reserva: paso 1 — modalidad y servicio
  const [bookingModality, setBookingModality] = useState<Modality | null>(null);
  const [bookingService, setBookingService] = useState<Service | null>(null);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  // Reserva: paso 2 — fecha
  const [bookingMonth, setBookingMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [calendarSlideDirection, setCalendarSlideDirection] = useState<'left' | 'right'>('left');

  // Reserva: paso 3 — horario
  const [bookingSlots, setBookingSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Reserva: paso 4 — datos cliente
  const [patientRut, setPatientRut] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientNotes, setPatientNotes] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const daysInBookingMonth = new Date(bookingMonth.getFullYear(), bookingMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = (new Date(bookingMonth.getFullYear(), bookingMonth.getMonth(), 1).getDay() + 6) % 7; // 0 = Lunes

  useEffect(() => {
    getActiveServices().then((list) => {
      setServicesList(list);
      setServicesLoading(false);
    });
  }, []);

  const bookingDateStr = selectedDate
    ? format(new Date(bookingMonth.getFullYear(), bookingMonth.getMonth(), selectedDate), 'yyyy-MM-dd')
    : null;

  useEffect(() => {
    if (bookingStep !== 3 || !bookingDateStr || !bookingService || !bookingModality) return;
    setLoadingSlots(true);
    getAvailableSlots(bookingDateStr, bookingModality, bookingService.id)
      .then((slots) => {
        const now = new Date();
        const today = format(now, 'yyyy-MM-dd');
        const availableOnly = slots.filter((s) => s.available);
        const filtered = bookingDateStr === today
          ? availableOnly.filter((s) => {
              const [h, m] = s.startTime.split(':').map(Number);
              const slotMins = h * 60 + m;
              const nowMins = now.getHours() * 60 + now.getMinutes();
              return slotMins > nowMins;
            })
          : availableOnly;
        setBookingSlots(filtered);
      })
      .finally(() => setLoadingSlots(false));
  }, [bookingStep, bookingDateStr, bookingService?.id, bookingModality]);

  const goToPrevMonth = () => {
    setCalendarSlideDirection('right');
    setBookingMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setSelectedDate(null);
  };
  const goToNextMonth = () => {
    setCalendarSlideDirection('left');
    setBookingMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    if (currentMonth.getTime() < bookingMonth.getTime()) setCalendarSlideDirection('right');
    else if (currentMonth.getTime() > bookingMonth.getTime()) setCalendarSlideDirection('left');
    setBookingMonth(currentMonth);
    setSelectedDate(null);
  };

  const isDateDisabled = (day: number) => {
    const d = new Date(bookingMonth.getFullYear(), bookingMonth.getMonth(), day);
    return isBefore(startOfDay(d), startOfDay(new Date()));
  };

  const resetBooking = () => {
    setBookingStep(1);
    setBookingModality(null);
    setBookingService(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setPatientRut('');
    setPatientName('');
    setPatientEmail('');
    setPatientPhone('');
    setPatientNotes('');
    setSubmitStatus('idle');
    setSubmitError(null);
  };

  const handleConfirmReservation = async () => {
    if (!bookingService || !bookingDateStr || !selectedSlot) return;
    if (!patientRut.trim()) {
      setSubmitError('El RUT es obligatorio.');
      return;
    }
    if (!isValidRut(patientRut)) {
      setSubmitError('RUT inválido (verifique formato y dígito verificador).');
      return;
    }
    if (!patientName.trim() || !patientEmail.trim()) {
      setSubmitError('Nombre y correo son obligatorios.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail)) {
      setSubmitError('Ingresa un correo electrónico válido.');
      return;
    }
    if (!patientPhone.trim()) {
      setSubmitError('El teléfono es obligatorio.');
      return;
    }
    if (!isValidChilePhone(patientPhone)) {
      setSubmitError('El teléfono debe tener 9 dígitos numéricos (ej: 987654321).');
      return;
    }
    setSubmitStatus('loading');
    setSubmitError(null);
    const result = await createReservation({
      serviceId: bookingService.id,
      modality: bookingModality!,
      date: bookingDateStr,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      patientRut: patientRut.trim(),
      patientName: patientName.trim(),
      patientEmail: patientEmail.trim(),
      patientPhone: patientPhone.trim(),
      notes: patientNotes.trim() || undefined,
    });
    if (result.success) {
      setSubmitStatus('success');
    } else {
      setSubmitStatus('error');
      setSubmitError(result.error ?? 'Error al crear la reserva.');
    }
  };

  const calendarSlideVariants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'left' ? 60 : -60,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'left' ? -60 : 60,
      opacity: 0,
    }),
  };

  const cardVariants = {
    offscreen: { y: 30, opacity: 0 },
    onscreen: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', bounce: 0.3, duration: 0.8 },
    },
  };

  const recipes = initialRecipes;
  const recipeCategories = initialRecipeCategories;
  const categoryFilterOptions = ['Todas', ...recipeCategories.map((c) => c.name)];

  const filteredRecipes =
    activeCategory === 'Todas'
      ? recipes
      : recipes.filter((r) => r.category?.name === activeCategory);

  const whatsappNumber = siteSettings?.whatsappPhone?.replace(/\D/g, "") || "";
  const hasWhatsapp = whatsappNumber.length > 0;
  const whatsappHref = hasWhatsapp ? `https://wa.me/${whatsappNumber}` : "#";

  const instagramHandle = siteSettings?.instagramHandle || "nta.micabrera";
  const instagramUrl = `https://www.instagram.com/${instagramHandle.replace(/^@/, "")}/`;

  return (
    <div className="min-h-screen bg-[#faf8ff] font-sans text-slate-800 overflow-x-hidden selection:bg-purple-200">
      <PublicHeader />

      {/* --- Hero Section --- */}
      <header id="inicio" className="relative pt-44 pb-24 px-6 overflow-hidden">
        <FloatingBubble className="bg-purple-300 w-80 h-80 -top-20 -right-20" />
        <FloatingBubble className="bg-orange-200 w-96 h-96 -bottom-20 -left-20" delay={2} />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-serif text-purple-950 leading-[1.1] mb-8">
              Nutricionista deportiva <br />
              <span className="italic text-purple-600 font-normal">y salud femenina</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-lg">
              Ayudo a mujeres a mejorar su salud, energía y rendimiento deportivo a través de una alimentación consciente y hábitos sostenibles.
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
              <button
                onClick={() => document.getElementById('reserva')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-purple-600 text-white px-10 py-5 rounded-2xl font-bold shadow-xl shadow-purple-200 hover:bg-purple-700 transition-all flex items-center justify-center gap-3 group"
              >
                Agendar consulta
                <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </motion.div>
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative flex justify-center"
          >
            <div className="relative w-full max-w-md aspect-[3/4] bg-orange-50 rounded-[80px] overflow-hidden shadow-2xl border-[12px] border-white ring-1 ring-purple-100">
              <Image src={HERO_IMG} alt="Nutricionista" fill className="object-cover opacity-90" sizes="(max-width: 768px) 100vw, 448px" />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 via-transparent to-transparent" />
            </div>

            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-8 -right-4 md:-right-8 bg-white p-6 rounded-[32px] shadow-2xl border border-purple-50 max-w-[240px]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                  <HeartIcon />
                </div>
                <span className="text-sm font-bold text-purple-950 leading-tight">Hábitos sostenibles</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal font-medium">Fomentamos una relación sana con el cuerpo y la alimentación.</p>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* --- Sobre mí --- */}
      <section id="sobre-mí" className="py-24 md:py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-serif text-purple-950 mb-8 tracking-tight italic"
          >
            Sobre mí
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-slate-600 leading-relaxed mb-12"
          >
            Soy nutricionista titulada y desde hace más de dos años acompaño a mujeres en Concepción en su proceso de mejorar su salud a través de la alimentación. Mi enfoque combina nutrición basada en evidencia, salud natural y rendimiento deportivo, buscando crear hábitos sostenibles que se adapten al estilo de vida de cada persona.
          </motion.p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {[
              { label: 'Nutrición femenina', icon: 'mdi:heart' },
              { label: 'Nutrición deportiva', icon: 'mdi:dumbbell' },
              { label: 'Hábitos y salud natural', icon: 'mdi:leaf' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-4 p-5 rounded-2xl bg-purple-50 border border-purple-100 text-purple-900 font-semibold hover:bg-purple-100/80 hover:border-purple-200 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                  <Icon icon={item.icon} width={24} height={24} />
                </div>
                <span className="text-base">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Dirigido a --- */}
      <section id="dirigido-a" className="py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="h-40 bg-purple-50 rounded-3xl overflow-hidden relative">
                    <Image src="https://images.unsplash.com/photo-1765572144519-1dc1e6e07bc9?auto=format&fit=crop&w=400&q=80" alt="Mujeres adolescentes" fill className="object-cover opacity-50" sizes="200px" />
                  </div>
                  <div className="h-64 bg-orange-50 rounded-3xl overflow-hidden relative">
                    <Image src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=80" alt="Alimentación saludable" fill className="object-cover opacity-50" sizes="200px" />
                  </div>
                </div>
                <div className="space-y-4 pt-12">
                  <div className="h-64 bg-purple-900 rounded-3xl overflow-hidden relative">
                    <Image src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80" alt="Bienestar y estilo de vida" fill className="object-cover opacity-40" sizes="200px" />
                  </div>
                  <div className="h-40 bg-purple-100 rounded-3xl overflow-hidden relative">
                    <Image src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=400&q=80" alt="Vegetarianos y veganos" fill className="object-cover opacity-50" sizes="200px" />
                  </div>
                </div>
              </div>
            </div>

            <motion.div initial="offscreen" whileInView="onscreen" viewport={{ once: true }} variants={cardVariants}>
              <h2 className="text-4xl font-serif text-purple-950 mb-8 tracking-tight italic">Servicios dirigidos a:</h2>
              <div className="space-y-5">
                {[
                  'Mujeres adolescentes (10-19 años)',
                  'Mujeres en etapa adulta',
                  'Etapa de perimenopausia o menopausia',
                  'Vegetarianos y Veganos',
                  'Condiciones metabólicas o cardiovasculares',
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ x: 10 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-purple-900 font-medium group transition-colors hover:bg-purple-50 hover:border-purple-200"
                  >
                    <div className="text-purple-600 group-hover:scale-125 transition-transform"><CheckIcon /></div>
                    {item}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- Modalidades de Consulta --- */}
      <section id="servicios" className="py-32 px-6 bg-[#f7f2ff]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-serif text-purple-950 mb-4 tracking-tight italic">Modalidades de Consulta</h2>
            <p className="text-slate-500 font-medium">Todo el apoyo que necesitas, estés donde estés.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            <motion.div whileHover={{ y: -10 }} className="bg-white p-10 md:p-14 rounded-[50px] shadow-xl border border-purple-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="relative z-10">
                <span className="inline-block px-4 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">Distancia no es barrera</span>
                <h3 className="text-3xl font-serif text-purple-950 mb-6">Consulta Online</h3>
                <ul className="space-y-4 mb-10">
                  {['Consulta 1 hora o más', 'Evaluación psicosocial y hábitos', 'Plan nutricional personalizado', 'Material educativo digital', 'Seguimiento vía online'].map((li, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-600 text-sm italic">
                      <div className="mt-1 text-purple-400"><CheckIcon /></div>
                      {li}
                    </li>
                  ))}
                </ul>
                <button
                onClick={() => document.getElementById('reserva')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full py-4 rounded-2xl bg-purple-50 text-purple-900 font-bold hover:bg-purple-100 transition-all"
              >
                Ver disponibilidad
              </button>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -10 }} className="bg-purple-900 p-10 md:p-14 rounded-[50px] shadow-xl text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-800 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="relative z-10">
                <span className="inline-block px-4 py-1 bg-purple-800 text-purple-200 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">Atención Local</span>
                <h3 className="text-3xl font-serif text-white mb-6">Consulta Presencial</h3>
                <ul className="space-y-4 mb-10">
                  {['Consulta 1 hora o más', 'Evaluación de estilo de vida', 'Medición antropométrica (Opcional)', 'Informe antropométrico detallado', 'Material físico y digital'].map((li, i) => (
                    <li key={i} className="flex items-start gap-3 text-purple-100 text-sm italic">
                      <div className="mt-1 text-orange-400"><CheckIcon /></div>
                      {li}
                    </li>
                  ))}
                </ul>
                <button
                onClick={() => document.getElementById('reserva')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full py-4 rounded-2xl bg-white/10 text-white font-bold hover:bg-white/20 border border-white/20 transition-all"
              >
                Ver disponibilidad
              </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- Recetario --- */}
      <section id="recetas" className="py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <h2 className="text-4xl font-serif text-purple-950 mb-4 tracking-tight">Recetario <span className="italic text-purple-600">Saludable</span></h2>
              <p className="text-slate-500 font-medium">Ideas ricas, fáciles y nutritivas para tu día a día.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-2 p-1.5 bg-purple-50 rounded-2xl md:overflow-x-auto no-scrollbar">
              {categoryFilterOptions.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full md:w-auto px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap text-left md:text-center ${activeCategory === cat ? 'bg-purple-600 text-white shadow-lg' : 'text-purple-400 hover:text-purple-600'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredRecipes.map((recipe) => (
                <motion.div
                  key={recipe.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -10 }}
                  className="group relative aspect-[9/16] rounded-[40px] overflow-hidden shadow-xl cursor-pointer"
                >
                  <Link href={`/recetas/${recipe.slug}`} className="block w-full h-full relative">
                    <Image
                      src={recipe.imageUrl || '/mica-2.jpeg'}
                      alt={recipe.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-950/90 via-purple-900/20 to-transparent" />

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                        <PlayIcon />
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 p-8 w-full">
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md text-[10px] font-bold text-white rounded-lg mb-3 uppercase tracking-widest">
                        {recipe.category?.name ?? 'Sin categoría'}
                      </span>
                      <h4 className="text-xl font-bold text-white leading-tight mb-2">
                        {recipe.title}
                      </h4>
                      <p className="text-white/60 text-xs font-medium flex items-center gap-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {recipe.prepTimeMinutes ? `${recipe.prepTimeMinutes} min` : 'Tiempo variable'}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-16 flex flex-col items-center gap-4 md:flex-row md:justify-center md:gap-6">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-slate-50 text-purple-900 font-bold border border-slate-200 hover:bg-purple-50 transition-all group"
            >
              Ver más recetas en Instagram
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
            <Link
              href="/recetas"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-purple-50 text-purple-900 font-bold border border-purple-100 hover:bg-purple-100 transition-all group"
            >
              Ver todas las recetas
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* --- Contacto / Consulta Rápida --- */}
      <section id="contacto" className="py-24 px-6 bg-gradient-to-br from-purple-50 to-orange-50 overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-200/20 blur-[120px] rounded-full" />

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-[50px] p-10 md:p-16 shadow-2xl border border-white flex flex-col md:flex-row items-center gap-12"
          >
            <div className="flex-1 text-center md:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-100 text-orange-700 rounded-full text-[11px] font-black uppercase tracking-[2px] mb-6">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                Atención Directa
              </span>
              <h2 className="text-4xl font-serif text-purple-950 mb-6 leading-tight">
                ¿Aún tienes dudas? <br />
                <span className="italic text-purple-600">Hablemos hoy</span>
              </h2>
              <p className="text-slate-600 mb-8 leading-relaxed italic">
                Es normal sentirse inseguro al empezar algo nuevo. Cuéntame brevemente qué buscas y te orientaré sobre cuál es la mejor modalidad para ti.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <a
                  href={whatsappHref}
                  className="inline-flex items-center justify-center gap-3 bg-[#25D366] text-white px-10 py-5 rounded-2xl font-bold shadow-xl shadow-green-100 hover:scale-105 transition-all"
                >
                  <Icon icon="simple-icons:whatsapp" width={24} height={24} />
                  Consultar por WhatsApp
                </a>
              </div>
            </div>

            <div className="w-48 h-48 md:w-64 md:h-64 relative shrink-0">
              <div className="absolute inset-0 bg-purple-100 rounded-[40px] rotate-6 group-hover:rotate-12 transition-transform" />
              <div className="absolute inset-0 bg-white border-4 border-white shadow-xl rounded-[40px] overflow-hidden -rotate-3 group-hover:-rotate-6 transition-transform">
                <Image src={CONTACT_IMG} alt="Mica Cabrera Nutricionista" fill className="object-cover" sizes="256px" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-2xl shadow-lg border border-purple-50 animate-bounce">
                <div className="text-purple-600 font-bold text-xs uppercase tracking-widest leading-none">Respuesta rápida</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Sección de Reserva --- */}
      <section id="reserva" className="py-32 px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-[60px] shadow-2xl overflow-hidden border border-purple-50">
          <div className="p-8 md:p-16 text-center">
            <h2 className="text-4xl font-serif text-purple-950 mb-6 tracking-tight italic">Reserva tu primera sesión</h2>
            <p className="text-slate-500 mb-12 max-w-lg mx-auto leading-relaxed">Da el primer paso hacia una salud digestiva y hormonal equilibrada con mi acompañamiento profesional.</p>

            {submitStatus === 'success' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-lg font-semibold text-purple-900 mb-4">Reserva solicitada correctamente.</p>
                <p className="text-slate-600 mb-8">Te hemos registrado para la fecha y horario elegidos. Si necesitas cambios, contáctanos.</p>
                <button
                  type="button"
                  onClick={resetBooking}
                  className="bg-purple-600 text-white px-10 py-5 rounded-2xl font-bold shadow-xl hover:bg-purple-700 transition-colors"
                >
                  Hacer otra reserva
                </button>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                {bookingStep === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-left max-w-md mx-auto">
                    <p className="text-sm font-bold text-purple-900 mb-2">Modalidad</p>
                    <div className="flex gap-3 mb-6">
                      <button
                        type="button"
                        onClick={() => setBookingModality('presencial')}
                        className={`flex-1 py-4 rounded-2xl font-bold transition-all border-2 ${bookingModality === 'presencial' ? 'bg-purple-900 text-white border-purple-900' : 'border-purple-100 text-purple-900 hover:border-purple-300'}`}
                      >
                        Presencial
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingModality('online')}
                        className={`flex-1 py-4 rounded-2xl font-bold transition-all border-2 ${bookingModality === 'online' ? 'bg-purple-900 text-white border-purple-900' : 'border-purple-100 text-purple-900 hover:border-purple-300'}`}
                      >
                        Online
                      </button>
                    </div>
                    <p className="text-sm font-bold text-purple-900 mb-2">Servicio</p>
                    {servicesLoading ? (
                      <p className="text-slate-500 text-sm mb-6">Cargando servicios…</p>
                    ) : servicesList.length === 0 ? (
                      <p className="text-slate-500 text-sm mb-6">No hay servicios disponibles en este momento. Vuelve a intentar más tarde.</p>
                    ) : (
                      <div className="flex flex-col gap-2 mb-8">
                        {servicesList.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setBookingService(s)}
                            className={`py-3 px-4 rounded-2xl text-left font-medium transition-all border-2 ${bookingService?.id === s.id ? 'bg-purple-100 border-purple-600 text-purple-900' : 'border-purple-50 text-slate-600 hover:border-purple-200'}`}
                          >
                            {s.name} ({s.durationMinutes} min)
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      disabled={!bookingModality || !bookingService}
                      onClick={() => setBookingStep(2)}
                      className="w-full bg-purple-900 text-white px-12 py-5 rounded-2xl font-bold disabled:opacity-30 shadow-xl"
                    >
                      Siguiente: Elegir fecha
                    </button>
                  </motion.div>
                )}

                {bookingStep === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <button type="button" onClick={goToPrevMonth} className="w-10 h-10 rounded-xl flex items-center justify-center text-purple-600 hover:bg-purple-100 transition-colors" aria-label="Mes anterior">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                      </button>
                      <button type="button" onClick={goToToday} className="px-5 py-2.5 rounded-xl text-sm font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 transition-colors">Hoy</button>
                      <button type="button" onClick={goToNextMonth} className="w-10 h-10 rounded-xl flex items-center justify-center text-purple-600 hover:bg-purple-100 transition-colors" aria-label="Mes siguiente">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    </div>
                    <div className="min-w-[180px] overflow-hidden mb-12">
                      <AnimatePresence mode="wait" custom={calendarSlideDirection}>
                        <motion.div
                          key={`${bookingMonth.getFullYear()}-${bookingMonth.getMonth()}`}
                          custom={calendarSlideDirection}
                          variants={calendarSlideVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="flex flex-col items-center"
                        >
                          <h3 className="text-xl font-serif font-bold text-purple-950 mb-6">{monthNames[bookingMonth.getMonth()]} {bookingMonth.getFullYear()}</h3>
                          <div className="grid grid-cols-7 gap-2 max-w-sm w-full">
                            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                              <div key={d} className="aspect-square rounded-2xl flex items-center justify-center font-bold text-xs text-slate-400">{d}</div>
                            ))}
                            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                              <div key={`empty-${i}`} className="aspect-square" />
                            ))}
                            {Array.from({ length: daysInBookingMonth }).map((_, i) => {
                              const day = i + 1;
                              const disabled = isDateDisabled(day);
                              return (
                                <button
                                  key={day}
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => setSelectedDate(day)}
                                  className={`aspect-square rounded-2xl flex items-center justify-center font-bold text-sm transition-all ${selectedDate === day ? 'bg-purple-600 text-white shadow-xl scale-110' : disabled ? 'text-slate-200 cursor-not-allowed' : 'hover:bg-purple-50 text-slate-400'}`}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    <div className="flex gap-4 justify-center">
                      <button type="button" onClick={() => setBookingStep(1)} className="px-8 py-5 text-purple-900 font-bold">Volver</button>
                      <button
                        disabled={!selectedDate}
                        onClick={() => setBookingStep(3)}
                        className="bg-purple-900 text-white px-12 py-5 rounded-2xl font-bold disabled:opacity-30 shadow-xl"
                      >
                        Siguiente: Elegir horario
                      </button>
                    </div>
                  </motion.div>
                )}

                {bookingStep === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                    {loadingSlots ? (
                      <p className="text-slate-500 py-8">Cargando horarios…</p>
                    ) : bookingSlots.length === 0 ? (
                      <p className="text-slate-500 py-8">No hay horarios disponibles para esta fecha. Elige otra.</p>
                    ) : (
                      <div className="flex justify-center flex-wrap gap-3 mb-8">
                        {bookingSlots.map((slot) => (
                          <button
                            key={`${slot.startTime}-${slot.endTime}`}
                            type="button"
                            onClick={() => { setSelectedSlot(slot); setBookingStep(4); }}
                            className="px-6 py-4 border-2 border-purple-50 rounded-2xl font-bold text-purple-900 hover:border-purple-600 transition-all"
                          >
                            {slot.startTime}
                          </button>
                        ))}
                      </div>
                    )}
                    <button type="button" onClick={() => { setSelectedSlot(null); setBookingStep(2); }} className="px-8 py-5 text-purple-900 font-bold">Volver</button>
                  </motion.div>
                )}

                {bookingStep === 4 && selectedSlot && bookingDateStr && bookingService && (
                  <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-left max-w-md mx-auto">
                    <div className="bg-purple-50 rounded-2xl p-4 mb-6 text-sm text-purple-900">
                      <p><strong>Fecha:</strong> {format(new Date(bookingDateStr + 'T12:00:00'), "EEEE d 'de' MMMM yyyy", { locale: es })}</p>
                      <p><strong>Horario:</strong> {selectedSlot.startTime} – {selectedSlot.endTime}</p>
                      <p><strong>Servicio:</strong> {bookingService.name}</p>
                      <p><strong>Modalidad:</strong> {bookingModality === 'presencial' ? 'Presencial' : 'Online'}</p>
                    </div>
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-bold text-purple-900 mb-1">RUT *</label>
                        <input
                          type="text"
                          value={patientRut}
                          onChange={(e) => setPatientRut(e.target.value)}
                          placeholder="12.345.678-9"
                          className="w-full px-4 py-3 rounded-xl border-2 border-purple-100 focus:border-purple-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-purple-900 mb-1">Nombre completo *</label>
                        <input
                          type="text"
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          placeholder="Tu nombre"
                          className="w-full px-4 py-3 rounded-xl border-2 border-purple-100 focus:border-purple-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-purple-900 mb-1">Correo electrónico *</label>
                        <input
                          type="email"
                          value={patientEmail}
                          onChange={(e) => setPatientEmail(e.target.value)}
                          placeholder="tu@email.com"
                          className="w-full px-4 py-3 rounded-xl border-2 border-purple-100 focus:border-purple-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-purple-900 mb-1">Teléfono *</label>
                        <input
                          type="tel"
                          value={patientPhone}
                          onChange={(e) => setPatientPhone(e.target.value)}
                          placeholder="987654321"
                          className="w-full px-4 py-3 rounded-xl border-2 border-purple-100 focus:border-purple-500 outline-none"
                        />
                        <p className="text-xs text-purple-700/70 mt-1">9 dígitos, sin espacios (ej: 987654321)</p>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-purple-900 mb-1">Notas (opcional)</label>
                        <input
                          type="text"
                          value={patientNotes}
                          onChange={(e) => setPatientNotes(e.target.value)}
                          placeholder="Comentarios o consultas"
                          className="w-full px-4 py-3 rounded-xl border-2 border-purple-100 focus:border-purple-500 outline-none"
                        />
                      </div>
                    </div>
                    {submitError && <p className="text-red-600 text-sm mb-4">{submitError}</p>}
                    <div className="flex gap-4 justify-center">
                      <button type="button" onClick={() => setBookingStep(3)} className="px-8 py-5 text-purple-900 font-bold">Volver</button>
                      <button
                        type="button"
                        disabled={submitStatus === 'loading'}
                        onClick={handleConfirmReservation}
                        className="bg-purple-600 text-white px-10 py-5 rounded-2xl font-bold shadow-xl disabled:opacity-70"
                      >
                        {submitStatus === 'loading' ? 'Enviando…' : 'Confirmar reserva'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </section>

      <PublicFooter
        whatsappPhone={siteSettings?.whatsappPhone}
        contactEmail={siteSettings?.contactEmail}
        instagramHandle={siteSettings?.instagramHandle}
      />
    </div>
  );
}
