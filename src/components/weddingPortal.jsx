import React, { useState, useEffect, useRef } from 'react';
import { motion } from "framer-motion";
import {
  Calendar,
  Shirt,
  Music,
  Music2,
  Leaf,
  Menu,
  X
} from 'lucide-react';
import {
  getCoupleInfo,
  getEventDetails,
  getContactInfo,
  getLoveStory,
  getEntourage,
  getSecondarySponsors,
  getSpecialRoles,
  getFundamentals,
  fullName,
  coupleAcronym,
} from './weddingData';

export default function WeddingPortal() {

  // UI states
  const [isOpen, setIsOpen]                     = useState(false);
  const [isReady, setIsReady]                   = useState(false);
  const [isPlaying, setIsPlaying]               = useState(false);
  const [confetti, setConfetti]                 = useState([]);
  const [storyOpen, setStoryOpen]               = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen]     = useState(false);
  const [fundamentalsOpen, setFundamentalsOpen] = useState(false);

  // Supabase data states
  const [coupleInfo, setCoupleInfo]               = useState(null);
  const [eventDetails, setEventDetails]           = useState(null);
  const [contactInfo, setContactInfo]             = useState(null);
  const [loveStory, setLoveStory]                 = useState([]);
  const [entourage, setEntourage]                 = useState([]);
  const [secondarySponsors, setSecondarySponsors] = useState([]);
  const [specialRoles, setSpecialRoles]           = useState([]);
  const [fundamentals, setFundamentals]           = useState([]);

  const audioRef = useRef(null);

  // Fetch all data from Supabase on mount
  useEffect(() => {
    async function fetchAll() {
      const [couple, event, contact, story, ent, sponsors, roles, funds] =
        await Promise.all([
          getCoupleInfo(),
          getEventDetails(),
          getContactInfo(),
          getLoveStory(),
          getEntourage(),
          getSecondarySponsors(),
          getSpecialRoles(),
          getFundamentals(),
        ]);
      setCoupleInfo(couple);
      setEventDetails(event);
      setContactInfo(contact);
      setLoveStory(story);
      setEntourage(ent);
      setSecondarySponsors(sponsors);
      setSpecialRoles(roles);
      setFundamentals(funds);
    }
    fetchAll();
  }, []);

  // Open animation after data loads
  useEffect(() => {
    if (!coupleInfo) return;
    const timer = setTimeout(() => {
      setIsOpen(true);
      setTimeout(() => setIsReady(true), 50);
    }, 1200);
    return () => clearTimeout(timer);
  }, [coupleInfo]);

  useEffect(() => {
    if (!isOpen) return;
    const colors = ['#c29f53', '#1a422a', '#8ca89a', '#ede9dc'];
    const pieces = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      color: colors[i % colors.length],
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 6}s`,
      duration: `${6 + Math.random() * 6}s`,
      size: `${5 + Math.random() * 7}px`,
      isRound: Math.random() > 0.5,
    }));
    setConfetti(pieces);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && audioRef.current) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [isOpen]);

  const toggleMusic = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Loading screen while Supabase data is fetching
  if (!coupleInfo || !eventDetails || !contactInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f2eb]">
        <p className="font-cinzel text-[#2c3e34] tracking-widest text-sm animate-pulse">
          Loading...
        </p>
      </div>
    );
  }

  // NOTE: Supabase returns snake_case — so we use:
  //   coupleInfo.groom_first, coupleInfo.bride_first, coupleInfo.music_path
  //   coupleInfo.image_primary, coupleInfo.image_secondary
  //   coupleInfo.invitation_title, coupleInfo.invitation_body
  //   eventDetails.event_date, eventDetails.event_time
  //   eventDetails.maps_url, eventDetails.global_maps_url
  //   eventDetails.map_embed, eventDetails.facebook_page
  //   eventDetails.attire_note, eventDetails.venue_address
  //   contactInfo.rsvp_deadline, contactInfo.facebook_name
  //   specialRoles[].full_name

  return (
    <div className="min-h-screen bg-[#f4f2eb] font-montserrat text-[#2c3e34] selection:bg-[#c29f53] selection:text-white overflow-x-hidden flex flex-col relative">

      <style>{`
        @keyframes fallAndSway {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.7; }
          100% { transform: translateY(105vh) rotate(360deg); opacity: 0; }
        }
      `}</style>

      <audio ref={audioRef} src={coupleInfo.music_path} loop />

      {/* Confetti */}
      {isOpen && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {confetti.map((piece) => (
            <div
              key={piece.id}
              style={{
                position: 'absolute',
                top: '-20px',
                left: piece.left,
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                borderRadius: piece.isRound ? '50%' : '0% 100% 0% 100%',
                animationName: 'fallAndSway',
                animationDuration: piece.duration,
                animationDelay: piece.delay,
                animationIterationCount: 'infinite',
                animationTimingFunction: 'linear',
              }}
            />
          ))}
        </div>
      )}

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#2c3e34]/5 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-[#c29f53]/5 via-transparent to-transparent"></div>
      </div>

      {/* NAVBAR */}
      <nav className={`relative z-30 max-w-7xl mx-auto w-full flex justify-between items-center py-4 px-4 md:px-6 transition-all duration-1000 ease-out ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6'}`}>
        <h1 className="font-cinzel text-xl md:text-2xl tracking-[0.2em]">
          {coupleAcronym(coupleInfo)}
        </h1>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-[0.2em]">
          <a href="#home" className="hover:text-[#c29f53] transition">Invitation</a>
          <a href="#entourage" className="hover:text-[#c29f53] transition">Entourage</a>
          <div className="group cursor-pointer" onClick={() => setStoryOpen(true)}>
            <span className="text-[10px] group-hover:text-[#c29f53]">Love Story</span>
          </div>
          <button onClick={() => setFundamentalsOpen(true)} className="hover:text-[#c29f53] transition">
            FUNDAMENTALS
          </button>
          <button onClick={toggleMusic} className="hover:text-[#c29f53] transition outline-none">
            {isPlaying ? (
              <Music className="w-5 h-5 animate-pulse text-[#c29f53]" />
            ) : (
              <Music2 className="w-5 h-5 opacity-50 hover:opacity-100" />
            )}
          </button>
          <a
            href={eventDetails.global_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#2c3e34] text-white px-5 py-2 hover:bg-[#c29f53] transition shadow-lg"
          >
            View Map
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden z-50">
          {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-20 left-4 right-4 bg-white shadow-xl rounded-xl p-6 flex flex-col gap-6 md:hidden border border-[#c29f53]/10">
            <a href="#home" onClick={() => setMobileMenuOpen(false)}>Invitation</a>
            <a href="#entourage" onClick={() => setMobileMenuOpen(false)}>Entourage</a>
            <button onClick={() => { setStoryOpen(true); setMobileMenuOpen(false); }} className="text-left">
              Love Story
            </button>
            <button onClick={() => { setFundamentalsOpen(true); setMobileMenuOpen(false); }} className="text-left">
              FUNDAMENTALS
            </button>
            <button onClick={toggleMusic} className="flex items-center gap-2">
              {isPlaying ? (
                <><Music className="w-5 h-5 text-[#c29f53]" /> Pause Music</>
              ) : (
                <><Music2 className="w-5 h-5" /> Play Music</>
              )}
            </button>
            <a
              href={eventDetails.global_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#2c3e34] text-white px-4 py-3 text-center rounded-lg"
            >
              View Map
            </a>
          </div>
        )}
      </nav>

      {/* MAIN */}
      {isOpen && (
        <main id="home" className="relative z-10 max-w-6xl mx-auto w-full px-4 md:px-6 flex-grow pb-32 md:pb-24">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">

            {/* IMAGE CARD */}
            <div className={`md:col-span-5 min-h-[420px] md:h-[550px] rounded-lg shadow-xl flex flex-col justify-between text-white relative overflow-hidden transition-all duration-1000 delay-150 ease-out border border-white/10 group cursor-pointer hover:shadow-2xl ${isReady ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-[0.98]'}`}>
              <div
                className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-700 ease-out group-hover:scale-100"
                style={{ backgroundImage: `url('${coupleInfo.image_secondary}')` }}
              />
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out group-hover:opacity-0 group-hover:scale-110"
                style={{ backgroundImage: `url('${coupleInfo.image_primary}')` }}
              />
              <div className="absolute inset-0 bg-[#2c3e34]/20 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-40 pointer-events-none" />
              <div className="absolute inset-0 bg-black/20 transition-colors duration-500 group-hover:bg-black/40 pointer-events-none" />

              <div className="relative z-10 p-4 md:p-6">
                <span className="bg-white/10 backdrop-blur-md px-3 py-1 text-[9px] md:text-[10px] uppercase tracking-widest inline-flex items-center gap-2 rounded-full border border-white/20">
                  <Leaf className="w-3 h-3 text-white" />
                  Our Union Journey
                </span>
              </div>

              <div className="relative z-10 p-4 md:p-6 bg-gradient-to-t from-black/60 via-black/10 to-transparent pt-20">
                <p className="text-[10px] uppercase tracking-widest mb-1 opacity-80">
                  {coupleInfo.subtitle}
                </p>
                <h3 className="font-cinzel text-2xl md:text-4xl mb-2 drop-shadow-md">
                  {fullName(coupleInfo, 'groom')} & {fullName(coupleInfo, 'bride')}
                </h3>
                <p className="italic opacity-80 drop-shadow-md text-sm">
                  "{coupleInfo.tagline}"
                </p>
              </div>
            </div>

            {/* RIGHT CONTENT */}
            <div className="md:col-span-7 flex flex-col gap-4">

              {/* Invitation */}
              <div className={`relative bg-white/60 backdrop-blur-sm p-6 rounded-lg border border-[#2c3e34]/10 flex-grow flex flex-col justify-center overflow-hidden transition-all duration-1000 delay-300 ease-out shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-[#c29f53]/30 cursor-pointer group ${isReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                <Leaf className="absolute -top-4 -left-4 w-16 h-16 text-[#2c3e34] opacity-5 -rotate-45 pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-0" />
                <Leaf className="absolute -bottom-4 -right-4 w-16 h-16 text-[#c29f53] opacity-10 rotate-[135deg] pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-[180deg]" />
                <div className="relative z-10">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#c29f53] mb-2 flex items-center gap-2">
                    <span className="w-6 h-[1px] bg-[#c29f53]/50 inline-block transition-all duration-500 group-hover:w-12"></span>
                    Our Invitation
                    <span className="w-6 h-[1px] bg-[#c29f53]/50 inline-block transition-all duration-500 group-hover:w-12"></span>
                  </p>
                  <h1 className="font-cinzel text-2xl lg:text-3xl mb-3 text-[#2c3e34] transition-colors duration-300 group-hover:text-[#1a422a]">
                    {coupleInfo.invitation_title}
                  </h1>
                  <p className="text-sm leading-relaxed opacity-80">
                    {coupleInfo.invitation_body}
                  </p>
                </div>
              </div>

              {/* Date & Attire */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-1000 delay-500 ease-out ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-[#2c3e34]/10 flex items-center gap-4">
                  <div className="bg-[#f4f2eb] p-2 rounded-full">
                    <Calendar className="text-[#c29f53] w-5 h-5 shrink-0" />
                  </div>
                  <div>
                    <h4 className="font-cinzel text-xs uppercase tracking-widest">Date & Time</h4>
                    <p className="text-xs">{eventDetails.event_date}</p>
                    <p className="text-[10px] opacity-60">{eventDetails.event_time}</p>
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-[#2c3e34]/10 flex items-center gap-4">
                  <div className="bg-[#f4f2eb] p-2 rounded-full">
                    <Shirt className="text-[#c29f53] w-5 h-5 shrink-0" />
                  </div>
                  <div>
                    <h4 className="font-cinzel text-xs uppercase tracking-widest">The Attire</h4>
                    <p className="text-xs">{eventDetails.attire}</p>
                    <p className="text-[10px] opacity-60">{eventDetails.attire_note}</p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className={`bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-[#2c3e34]/10 shrink-0 shadow-sm transition-all duration-1000 delay-700 ease-out hover:-translate-y-1 hover:shadow-md hover:border-[#c29f53]/30 cursor-pointer ${isReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                <h4 className="font-cinzel text-xs uppercase tracking-widest text-[#c29f53] mb-2">The Location</h4>
                <div className="flex justify-between gap-6 items-center">
                  <div className="flex-grow">
                    <p className="font-bold text-sm text-[#2c3e34]">{eventDetails.venue}</p>
                    <p className="text-xs opacity-70 mb-3">{eventDetails.venue_address}</p>
                    <div className="flex gap-3 text-[10px] uppercase tracking-widest font-bold text-[#2c3e34]/80 relative z-20">
                      <a href={eventDetails.maps_url} target="_blank" rel="noopener noreferrer" className="hover:text-[#c29f53] transition underline">
                        Maps
                      </a>
                      <span>|</span>
                      <span className="hover:text-[#c29f53] transition cursor-pointer underline">RSVP</span>
                      <span>|</span>
                      <a href={eventDetails.facebook_page} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[#c29f53] transition">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                        </svg>
                        FB Page
                      </a>
                    </div>
                  </div>
                  <div className="w-[45%] h-24 shrink-0 rounded overflow-hidden shadow-inner border border-[#2c3e34]/10 relative z-20">
                    <iframe
                      src={eventDetails.map_embed}
                      className="w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-500"
                      allowFullScreen=""
                      loading="lazy"
                      title="Venue Location Map"
                    ></iframe>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ENTOURAGE SECTION */}
      <motion.section
        id="entourage"
        className="relative z-10 max-w-7xl mx-auto w-full px-4 md:px-6 py-24 overflow-hidden"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 3, ease: "easeOut" }}
      >
        <div className="absolute top-0 left-0 w-72 h-72 bg-[#c29f53]/10 blur-3xl rounded-full -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#2c3e34]/10 blur-3xl rounded-full -z-10 animate-pulse"></div>

        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="w-12 h-[1px] bg-[#c29f53]/40"></span>
            <p className="text-[10px] uppercase tracking-[0.45em] text-[#c29f53]">Wedding Entourage</p>
            <span className="w-12 h-[1px] bg-[#c29f53]/40"></span>
          </div>
          <h2 className="font-cinzel text-4xl md:text-6xl text-[#2c3e34] mb-5">Meet Our Entourage</h2>
          <p className="max-w-2xl mx-auto text-sm md:text-base leading-relaxed text-[#2c3e34]/70">
            A celebration becomes even more meaningful when shared with the people who walked beside us through every chapter of our story.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">

          {/* Entourage Cards */}
          {entourage.map((card, index) => (
            <div key={index} className="group relative overflow-hidden rounded-[28px] border border-white/30 bg-white/60 backdrop-blur-xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] hover:border-[#c29f53]/30">
              <div className="absolute inset-0 bg-gradient-to-br from-[#c29f53]/0 via-[#c29f53]/0 to-[#2c3e34]/0 group-hover:from-[#c29f53]/5 group-hover:to-[#2c3e34]/5 transition-all duration-700"></div>
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#c29f53]/10 blur-2xl group-hover:scale-125 transition-all duration-700"></div>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-700 pointer-events-none">
                <div className="absolute inset-0 rounded-[28px] border border-[#c29f53]/20"></div>
              </div>
              <div className="relative z-10">
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#c29f53] mb-3">Wedding Role</p>
                <h3 className="font-cinzel text-2xl text-[#2c3e34] mb-6 group-hover:text-[#1a422a] transition-colors duration-300">
                  {card.title}
                </h3>
                <div className="space-y-3">
                  {card.people.map((person, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm text-[#2c3e34]/80 group/item transition-all duration-300">
                      <div className="w-2 h-2 rounded-full bg-[#c29f53] group-hover/item:scale-150 transition-transform duration-300"></div>
                      <p className="group-hover/item:translate-x-1 transition-transform duration-300">{person}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Secondary Sponsors */}
          <div className="group relative overflow-hidden rounded-[28px] border border-white/30 bg-white/60 backdrop-blur-xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] hover:border-[#c29f53]/30">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#c29f53]/10 blur-2xl group-hover:scale-125 transition-all duration-700"></div>
            <div className="relative z-10">
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#c29f53] mb-3">Wedding Role</p>
              <h3 className="font-cinzel text-2xl text-[#2c3e34] mb-6">Secondary Sponsors</h3>
              <div className="space-y-5 text-sm">
                {secondarySponsors.map((item, idx) => (
                  <div key={idx} className={idx < secondarySponsors.length - 1 ? "border-b border-[#2c3e34]/10 pb-4" : ""}>
                    <p className="uppercase tracking-[0.25em] text-[10px] text-[#c29f53] mb-2">{item.role}</p>
                    <p>{item.names}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Special Roles */}
          <div className="group relative overflow-hidden rounded-[28px] border border-white/30 bg-white/60 backdrop-blur-xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] hover:border-[#c29f53]/30">
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-[#2c3e34]/10 blur-2xl group-hover:scale-125 transition-all duration-700"></div>
            <div className="relative z-10">
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#c29f53] mb-3">Wedding Role</p>
              <h3 className="font-cinzel text-2xl text-[#2c3e34] mb-6">Special Roles</h3>
              <div className="space-y-5 text-sm">
                {specialRoles.map((item, idx) => (
                  <div key={idx} className={idx < specialRoles.length - 1 ? "border-b border-[#2c3e34]/10 pb-4" : ""}>
                    <p className="uppercase tracking-[0.25em] text-[10px] text-[#c29f53] mb-2">{item.role}</p>
                    <p>{item.full_name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </motion.section>

      {/* FOOTER */}
      <footer className={`fixed bottom-0 w-full bg-[#f4f2eb]/90 backdrop-blur-md border-t border-[#2c3e34]/10 py-3 px-4 md:px-12 z-20 transition-all duration-1000 delay-[900ms] ease-out ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="text-[9px] md:text-[10px] uppercase tracking-widest opacity-60 text-center">
            Kindly RSVP by {contactInfo.rsvp_deadline}
          </span>
          <div className="flex items-center gap-2 md:gap-4">
            <button className="px-4 md:px-8 py-2 bg-[#2c3e34] text-white text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-[#c29f53] transition rounded">
              Accept
            </button>
            <button className="px-4 md:px-8 py-2 border border-[#2c3e34]/20 text-[#2c3e34] text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-[#2c3e34]/5 transition rounded">
              Decline
            </button>
          </div>
        </div>
      </footer>

      {/* STORY MODAL */}
      {storyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2c3e34]/60 backdrop-blur-md" onClick={() => setStoryOpen(false)}>
          <div
            className="relative w-full max-w-2xl bg-[#fdfbf7] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-[1px] border-[#c29f53]/30 rounded-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border border-[#c29f53]/20 h-full w-full p-8 md:p-10 flex flex-col items-center justify-center relative">
              <button
                onClick={() => setStoryOpen(false)}
                className="absolute top-5 right-5 w-10 h-10 rounded-full bg-[#2c3e34]/5 hover:bg-[#c29f53] hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm"
              >
                ✕
              </button>
              <div className="w-full z-10">
                <h3 className="font-cinzel text-3xl text-[#2c3e34] mb-8 tracking-widest uppercase text-center">Our Story</h3>
                <div className="text-sm leading-loose text-[#2c3e34] font-light text-justify hyphens-auto">
                  {loveStory.map((paragraph, idx) => (
                    <p key={idx} className={idx < loveStory.length - 1 ? "mb-4" : ""}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
              <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-[#c29f53]/30" />
              <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-[#c29f53]/30" />
            </div>
          </div>
        </div>
      )}

      {/* FUNDAMENTALS MODAL */}
      {fundamentalsOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setFundamentalsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-[30px] bg-[#fdfbf7] border border-white/20 shadow-[0_20px_80px_rgba(0,0,0,0.25)] p-6 md:p-10"
          >
            <button
              onClick={() => setFundamentalsOpen(false)}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-[#2c3e34]/5 hover:bg-[#c29f53] hover:text-white transition-all duration-300 flex items-center justify-center"
            >
              ✕
            </button>

            <div className="text-center mb-12">
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#c29f53] mb-3">Wedding Information</p>
              <h2 className="font-cinzel text-4xl md:text-5xl text-[#2c3e34] mb-4">Other Fundamentals</h2>
              <p className="max-w-2xl mx-auto text-sm leading-relaxed text-[#2c3e34]/70">
                Important reminders and requests for our special day.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fundamentals.map((item, index) => (
                <div key={index} className="group relative overflow-hidden rounded-[28px] border border-[#2c3e34]/10 bg-white/70 backdrop-blur-xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] hover:border-[#c29f53]/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#c29f53]/0 via-transparent to-[#2c3e34]/0 group-hover:from-[#c29f53]/5 group-hover:to-[#2c3e34]/5 transition-all duration-700"></div>
                  <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#c29f53]/10 blur-3xl group-hover:scale-125 transition-all duration-700"></div>
                  <div className="absolute inset-0 rounded-[28px] border border-[#c29f53]/30 group-hover:border-[#c29f53]/60 transition-all duration-300"></div>
                  <div className="relative z-10">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-[#c29f53] mb-3">Wedding Reminder</p>
                    <h3 className="font-cinzel text-2xl text-[#2c3e34] mb-5 group-hover:text-[#1d4b34] transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-loose text-[#2c3e34]/75">{item.text}</p>
                  </div>
                </div>
              ))}

              {/* RSVP Contact Card */}
              <div className="md:col-span-2 relative overflow-hidden rounded-[32px] bg-[#2c3e34] text-white p-8 md:p-10 shadow-[0_15px_50px_rgba(0,0,0,0.18)]">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#c29f53]/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-[#c29f53] mb-3">RSVP Information</p>
                  <h3 className="font-cinzel text-3xl md:text-4xl mb-8">Contact Information</h3>
                  <div className="grid md:grid-cols-3 gap-8">
                    <div className="group">
                      <p className="uppercase tracking-[0.3em] text-[10px] text-[#c29f53] mb-2">Contact Number</p>
                      <p className="text-lg group-hover:text-[#c29f53] transition-colors duration-300">{contactInfo.phone}</p>
                    </div>
                    <div className="group">
                      <p className="uppercase tracking-[0.3em] text-[10px] text-[#c29f53] mb-2">Bride Facebook</p>
                      <p className="text-lg group-hover:text-[#c29f53] transition-colors duration-300">{contactInfo.facebook_name}</p>
                    </div>
                    <div className="group">
                      <p className="uppercase tracking-[0.3em] text-[10px] text-[#c29f53] mb-2">Email Address</p>
                      <p className="text-lg break-all group-hover:text-[#c29f53] transition-colors duration-300">{contactInfo.email}</p>
                    </div>
                  </div>
                  <div className="mt-10 pt-6 border-t border-white/10">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-[#c29f53] mb-2">RSVP Deadline</p>
                    <p className="text-xl font-light tracking-wide">{contactInfo.rsvp_deadline}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}