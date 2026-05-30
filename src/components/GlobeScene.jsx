import React from 'react';

export default function GlobeScene({ onLanding }) {
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <video
        autoPlay
        muted
        playsInline
        onEnded={onLanding}
        className="absolute inset-0 w-full h-full object-cover"
      >
        {/* Desktop + Tablet */}
        <source
          src="/video/Animate.mp4"
          type="video/mp4"
          media="(min-width: 768px)"
        />

        {/* Mobile */}
        <source
          src="/video/mobile.mp4"
          type="video/mp4"
          media="(max-width: 767px)"
        />

        Your browser does not support the video tag.
      </video>

      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
}