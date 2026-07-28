"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const disciplines = [
  ["01", "Frontend"],
  ["02", "Backend"],
  ["03", "AI systems"],
  ["04", "Product development"],
];

export default function Home() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const scope = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set("[data-reveal]", { opacity: 1, y: 0 });
        return;
      }

      gsap
        .timeline({
          scrollTrigger: {
            trigger: "[data-hero]",
            start: "top top",
            end: "bottom top",
            scrub: 0.7,
          },
        })
        .to("[data-hero-media]", { yPercent: -13, scale: 0.9, opacity: 0.28 }, 0)
        .to("[data-scroll-cue]", { opacity: 0, y: -28 }, 0);

      gsap.fromTo(
        "[data-reveal]",
        { y: 110, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.09,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "[data-statement]",
            start: "top 80%",
            end: "top 34%",
            scrub: 0.75,
          },
        },
      );
    }, root);

    return () => scope.revert();
  }, []);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const context = element.getContext("2d");
    if (!context) return;

    let frame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let pointerX = 0.52;
    let pointerY = 0.48;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      element.width = width * dpr;
      element.height = height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX / width;
      pointerY = event.clientY / height;
    };

    const render = (time: number) => {
      context.clearRect(0, 0, width, height);
      const x = width * (0.5 + (pointerX - 0.5) * 0.1);
      const y = height * (0.48 + (pointerY - 0.5) * 0.08);
      const radius = Math.max(width, height) * 0.48;

      const glow = context.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, "rgba(26, 75, 255, 0.16)");
      glow.addColorStop(0.28, "rgba(8, 32, 104, 0.08)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      context.save();
      context.translate(x, y);
      context.rotate(time * 0.000025);
      for (let index = 0; index < 5; index += 1) {
        const size = Math.min(width, height) * (0.11 + index * 0.052);
        context.beginPath();
        context.ellipse(
          0,
          0,
          size * 1.9,
          size * 0.34,
          index * 0.61,
          0,
          Math.PI * 2,
        );
        context.strokeStyle = `rgba(90, 118, 255, ${0.1 - index * 0.012})`;
        context.lineWidth = 0.7;
        context.stroke();
      }
      context.restore();

      frame = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <main ref={root} className="site-shell">
      <section data-hero className="hero" aria-label="Intro">
        <div data-hero-media className="hero-media" aria-hidden="true">
          <canvas ref={canvas} className="ambient-canvas" />
          <div className="hero-vignette" />
          <div className="hero-grain" />
        </div>

        <div data-scroll-cue className="scroll-cue">
          <span>Scroll to explore</span>
          <span className="scroll-line" aria-hidden="true" />
        </div>
      </section>

      <section data-statement className="statement" aria-labelledby="statement-title">
        <div className="statement-grid">
          <h1 id="statement-title" className="statement-title">
            <span className="line-mask">
              <span data-reveal>I build digital</span>
            </span>
            <span className="line-mask">
              <span data-reveal>products that</span>
            </span>
            <span className="line-mask">
              <span data-reveal>think, move</span>
            </span>
            <span className="line-mask">
              <span data-reveal>and work.</span>
            </span>
          </h1>

          <div data-reveal className="statement-details">
            <p>
              Full-stack development, AI integrations and product-focused
              digital experiences — from idea to working product.
            </p>
            <ol className="discipline-list">
              {disciplines.map(([number, label]) => (
                <li key={number}>
                  <span>{number}</span>
                  <span>{label}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}
