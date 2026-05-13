import { Plane } from 'lucide-react';
import logo from '../../imports/Mavi-Ye_il__afak_U_u_u__1_.png';

interface IntroAnimationProps {
  message?: string;
}

export default function IntroAnimation({ message }: IntroAnimationProps) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-sky-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(34,211,238,0.35),transparent_34%)]"></div>
      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent"></div>
      <div className="intro-plane-trail absolute"></div>
      <Plane className="intro-plane absolute size-16 md:size-24 text-white drop-shadow-[0_0_34px_rgba(103,232,249,0.95)]" />
      <div className="relative mt-56 flex flex-col items-center text-center">
        <img
          src={logo}
          alt="Seferio Air Logo"
          className="mb-4 h-20 w-20 md:h-28 md:w-28 drop-shadow-[0_0_24px_rgba(103,232,249,0.75)]"
        />
        <div className="text-3xl md:text-5xl font-semibold tracking-wide">Seferio Air</div>
        {message && (
          <div className="mt-3 text-lg md:text-2xl text-cyan-100/90">{message}</div>
        )}
      </div>
    </div>
  );
}
