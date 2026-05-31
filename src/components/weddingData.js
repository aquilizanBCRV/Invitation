// // weddingData.js
// // Edit this file to update all wedding content — no need to touch WeddingPortal.jsx

// export const coupleInfo = {
//   groomFirst: "Nielle",
//   brideFirst: "Camille",
//   tagline: "Finally, together under the trees.",
//   subtitle: "We Survived The Distance",
//   imagePrimary: "/image/wed.jpg",
//   imageSecondary: "/image/proposal.jpg",
//   music: "/music/theme.mp3",
//   invitationTitle: "A Garden Ceremony Celebrating Union",
//   invitationBody:
//     "After seasons apart, we request the honor of your presence as we pledge our vows under the open sky of Tagaytay. Your love has been our compass through every distance.",
// };

// export const eventDetails = {
//   date: "Tuesday, Dec 15, 2026",
//   time: "Ceremony starts exactly at 4:00 PM",
//   programStart: "3:30 PM",
//   attire: "Formal Minimalist Black",
//   attireNote: "Solid black suits, gowns, and cocktails.",
//   venue: "Vera Santuario Tagaytay",
//   venueAddress: "Kabangaan Road Iruhin West, Tagaytay City 4120",
//   mapsUrl:
//     "https://www.google.com/maps/dir/?api=1&destination=Vera+Santuario+Tagaytay&destination_place_id=ChIJeWTszKV7vTMRN3YUu5meYDA",
//   facebookPage: "https://www.facebook.com/verasantuariotagaytay",
//   mapEmbed:
//     "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3866.50567472097!2d120.8710344751069!3d14.281145186178052!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bd77c98030248f%3A0x676e273030c6a81e!2sVera+Santuario+Tagaytay!5e0!3m2!1sen!2sph!4v1716800000000!5m2!1sen!2sph",
//   globalMapsUrl:
//     "https://www.google.com/maps/dir/?api=1&destination=Alfonso%2C+Cavite",
// };

// export const contactInfo = {
//   phone: "09099272851",
//   facebookName: "Camilla Bacarrisas",
//   email: "carmella.bacarrisas@gmail.com",
//   rsvpDeadline: "November 15, 2026",
// };

// export const loveStory = [
//   `I (Camille) and Nielle met on July 4, 2017, right after we graduated. I'm from Cavite and he's from Zambales, and we were both working students at Jollibee in our respective provinces. After graduation, we were promoted as manager trainees and became batchmates for training in Ortigas.`,
//   `Before the training, I reached out to one of the trainees from Zambales because I was nervous about not knowing anyone. She kindly let me stay with their group in their dorm. When I arrived, Danielle picked me up at the bus stop since I didn't know the place yet—that was the first time we met.`,
//   `From there, we naturally got close. He helped me with my documents and made sure I was okay during the training. After we finished, we went on our first date at Megamall—and that's where it all started.`,
// ];

// export const entourage = [
//   {
//     title: "Parents of the Groom",
//     people: ["Richard Ferrer", "Erlina Belhida"],
//   },
//   {
//     title: "Parents of the Bride",
//     people: ["Emeterio Bacarrisas", "Lina Bacarrisas"],
//   },
//   {
//     title: "Principal Sponsors",
//     people: [
//       "Rowena Shabazz",
//       "Norman Cabiles",
//       "Livelyn Castillo",
//       "Alfred Castillo",
//     ],
//   },
//   {
//     title: "Groomsmen",
//     people: [
//       "John Carlo Ferrer",
//       "Christoper Tangan",
//       "Luigi Mayo",
//       "Francis Estares",
//     ],
//   },
//   {
//     title: "Bridesmaids",
//     people: [
//       "Maybelyn Capacite",
//       "Shaira Era",
//       "Franchette Anne Palomo",
//       "Fae Diane Vidad",
//     ],
//   },
//   { title: "Flower Girl", people: ["Vela Eve Bacarrisas"] },
//   { title: "Ring Bearer", people: ["Matthias Dane Cleofe"] },
// ];

// export const secondarySponsors = [
//   { role: "Veil", names: "Christoper & Franchette" },
//   { role: "Cord", names: "Maybelyn & Francis" },
//   { role: "Candle", names: "Shaira & Luigi" },
// ];

// export const specialRoles = [
//   { role: "Best Man", name: "Charles Erin Ferrer" },
//   { role: "Matron of Honor", name: "Cyrish Mae Bacarrisas" },
//   { role: "Master of Ceremony", name: "Theresa Tagum" },
// ];

// export const fundamentals = [
//   {
//     title: "Attendance Request",
//     text: "Since this is an intimate celebration, we've chosen to share this special day with only the most important people in our lives. Having you with us means so much as we celebrate this milestone.",
//   },
//   {
//     title: "RSVP Request",
//     text: "As this is an intimate wedding, we are keeping our guest list limited to the people we have personally invited. We kindly ask for your understanding that we are unable to accommodate plus ones. Please confirm your attendance by November 15, 2026.",
//   },
//   {
//     title: "Dress Code",
//     text: "We encourage guests to wear formal attire. Ladies may wear comfortable long dresses, and gentlemen may wear formal suits. Please note that Tagaytay is cold, so bringing a jacket is advised—just keep it within the color palette. Our motif is black with touches of white. We recommend black shoes, with minimal white accents allowed in accessories. This is a minimalist-themed wedding, so please keep your look simple and elegant.",
//   },
//   {
//     title: "Arrival Time",
//     text: "We kindly ask guests to arrive 30 minutes before the program starts. Program will start promptly at 3:30 PM.",
//   },
//   {
//     title: "Unplugged Ceremony",
//     text: "We kindly request an unplugged ceremony — please refrain from using phones during key moments.",
//   },
//   {
//     title: "Gifts",
//     text: "We would love to receive anything from you, but please know that your presence is already enough gift for us. As we are still in a long-distance setup and do not have a home yet, we would truly appreciate monetary gifts instead. Kindly refrain from giving appliances.",
//   },
// ];

// weddingData.js
// All data is now fetched from Supabase instead of hardcoded

import { supabase } from './supabaseClient';

export async function getCoupleInfo() {
  const { data, error } = await supabase
    .from('couple_info')
    .select('*')
    .single();
  if (error) console.error('couple_info error:', error);
  return data;
}
 
// Helper: build full name from parts
// usage: fullName(data, 'groom') → "Nielle A. Ferrer"
export function fullName(data, person) {
  const first  = data?.[`${person}_first_name`]  || '';
  const middle = data?.[`${person}_middle_name`] || '';
  const last   = data?.[`${person}_last_name`]   || '';
  const mid    = middle ? ` ${middle.charAt(0)}.` : '';
  return `${first}${mid} ${last}`.trim();
}
 
// Helper: acronym from last names → "F & B"
export function coupleAcronym(data) {
  const g = data?.groom_last_name?.charAt(0)?.toUpperCase() || '';
  const b = data?.bride_last_name?.charAt(0)?.toUpperCase() || '';
  return g && b ? `${g} & ${b}` : 'N & C';
}
 

export async function getEventDetails() {
  const { data, error } = await supabase
    .from('event_details')
    .select('*')
    .single();
  if (error) console.error('event_details error:', error);
  return data;
}

export async function getContactInfo() {
  const { data, error } = await supabase
    .from('contact_info')
    .select('*')
    .single();
  if (error) console.error('contact_info error:', error);
  return data;
}

export async function getLoveStory() {
  const { data, error } = await supabase
    .from('love_story')
    .select('content')
    .single();
  if (error) console.error('love_story error:', error);
  // Split on double newlines to render as paragraphs in WeddingPortal
  return data?.content?.split('\n\n').filter(Boolean) ?? [];
}

export async function getEntourage() {
  const { data: groups, error: groupError } = await supabase
    .from('entourage_groups')
    .select('id, title, display_order')
    .order('display_order', { ascending: true });

  const { data: members, error: memberError } = await supabase
    .from('entourage_members')
    .select('group_id, full_name, member_order')
    .order('member_order', { ascending: true });

  if (groupError) console.error('entourage_groups error:', groupError);
  if (memberError) console.error('entourage_members error:', memberError);

  return groups?.map((group) => ({
    title: group.title,
    people: members
      ?.filter((m) => m.group_id === group.id)
      .map((m) => m.full_name) ?? [],
  })) ?? [];
}

export async function getSecondarySponsors() {
  const { data, error } = await supabase
    .from('secondary_sponsors')
    .select('role, names')
    .order('display_order', { ascending: true });
  if (error) console.error('secondary_sponsors error:', error);
  return data ?? [];
}

export async function getSpecialRoles() {
  const { data, error } = await supabase
    .from('special_roles')
    .select('role, full_name')
    .order('display_order', { ascending: true });
  if (error) console.error('special_roles error:', error);
  return data ?? [];
}

export async function getFundamentals() {
  const { data, error } = await supabase
    .from('fundamentals')
    .select('title, content')
    .order('display_order', { ascending: true });
  if (error) console.error('fundamentals error:', error);
  // map content → text to match your existing WeddingPortal.jsx usage
  return data?.map((row) => ({ title: row.title, text: row.content })) ?? [];
}