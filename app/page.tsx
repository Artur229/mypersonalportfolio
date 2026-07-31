"use client";

import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

type ExperienceMode = "full" | "balanced" | "light";

type PerformanceNavigator = Navigator & {
  connection?: {
    effectiveType?: string;
    saveData?: boolean;
  };
  deviceMemory?: number;
};

const CONTACT_COOLDOWN_KEY = "portfolio-contact-submitted-at";
const CONTACT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const disciplines = [
  ["01", "Frontend"],
  ["02", "Backend"],
  ["03", "AI systems"],
  ["04", "Product development"],
];

const projects = [
  {
    number: "01",
    title: "Luxury Eats",
    category: "E-commerce experience",
    description:
      "A full-stack food delivery website built around a clear catalog, ordering flow and responsive experience.",
    image: "/projects/luxury-eats.jpg",
    video: "/media/hero-showcase.mp4",
    balancedVideo: "/media/luxury-eats-balanced.mp4",
    poster: "/media/hero-showcase-poster.webp",
    color: "#030303",
  },
  {
    number: "02",
    title: "AI Study Planner",
    category: "AI-powered web application",
    description:
      "An AI-integrated study planner that helps learners organize goals, build schedules and track progress.",
    image: "/projects/ai-study-planner.jpg",
    video: "/media/ai-study-planner-showcase.mp4",
    balancedVideo: "/media/ai-study-planner-balanced.mp4",
    poster: "/media/ai-study-planner-showcase-poster.webp",
    color: "#030303",
  },
  {
    number: "03",
    title: "Jojo Shop",
    category: "Fashion e-commerce",
    description:
      "A CMS-powered online shop with flexible catalog management, content updates and a clean shopping experience.",
    image: "/projects/jojo-shop.jpg",
    video: "/media/jojo-shop-showcase.mp4",
    balancedVideo: "/media/jojo-shop-balanced.mp4",
    poster: "/media/jojo-shop-showcase-poster.webp",
    color: "#030303",
  },
];

function detectExperienceMode(): ExperienceMode {
  const performanceNavigator = navigator as PerformanceNavigator;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const connection = performanceNavigator.connection;
  const slowConnection = ["slow-2g", "2g"].includes(
    connection?.effectiveType ?? "",
  );

  if (reducedMotion || connection?.saveData || slowConnection) return "light";

  const lowMemory =
    typeof performanceNavigator.deviceMemory === "number" &&
    performanceNavigator.deviceMemory <= 4;
  const lowCoreCount =
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 4;
  const limitedConnection = connection?.effectiveType === "3g";
  const compactViewport = window.innerWidth <= 1024;

  if (
    (coarsePointer || compactViewport) &&
    ((lowMemory && lowCoreCount) ||
      (limitedConnection && (lowMemory || lowCoreCount)))
  ) {
    return "light";
  }
  if (
    coarsePointer ||
    compactViewport ||
    lowMemory ||
    lowCoreCount ||
    limitedConnection
  ) {
    return "balanced";
  }
  return "full";
}

function CharacterText({
  text,
  group,
}: {
  text: string;
  group:
    | "project"
    | "project-description"
    | "footer"
    | "footer-button"
    | "footer-bottom";
}) {
  const dataAttribute =
    group === "project"
      ? { "data-project-char": "" }
      : group === "project-description"
        ? { "data-project-description-char": "" }
        : group === "footer"
          ? { "data-footer-char": "" }
          : group === "footer-button"
            ? { "data-footer-button-char": "" }
            : { "data-footer-bottom-char": "" };

  return (
    <span className="character-copy" aria-label={text}>
      {text.split(" ").map((word, wordIndex, words) => (
        <span className="character-word" aria-hidden="true" key={`${word}-${wordIndex}`}>
          {Array.from(word).map((character, characterIndex) => (
            <span
              className="character"
              {...dataAttribute}
              key={`${character}-${characterIndex}`}
            >
              {character}
            </span>
          ))}
          {wordIndex < words.length - 1 ? "\u00A0" : null}
        </span>
      ))}
    </span>
  );
}

export default function Home() {
  const root = useRef<HTMLElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const projectVideos = useRef<Array<HTMLVideoElement | null>>([]);
  const experienceMode = useRef<ExperienceMode>("balanced");
  const navigation = useRef<HTMLElement>(null);
  const navigationToggle = useRef<HTMLButtonElement>(null);
  const contactDrawer = useRef<HTMLElement>(null);
  const contactReturnFocus = useRef<HTMLElement | null>(null);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactStatus, setContactStatus] = useState<
    "idle" | "sending" | "success" | "error" | "limited"
  >("idle");

  useEffect(() => {
    if (!navigationOpen) return;

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!navigation.current?.contains(event.target as Node)) {
        setNavigationOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setNavigationOpen(false);
      requestAnimationFrame(() => navigationToggle.current?.focus());
    };
    const closeOnScroll = () => setNavigationOpen(false);

    window.addEventListener("pointerdown", closeOnOutsidePress);
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("scroll", closeOnScroll, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", closeOnOutsidePress);
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("scroll", closeOnScroll);
    };
  }, [navigationOpen]);

  useEffect(() => {
    if (!contactOpen) return;

    document.documentElement.classList.add("contact-drawer-open");
    const drawer = contactDrawer.current;
    const focusable = drawer?.querySelectorAll<HTMLElement>(
      'button, input:not([type="hidden"]):not([tabindex="-1"]), textarea, select, [href], [tabindex]:not([tabindex="-1"])',
    );
    requestAnimationFrame(() => focusable?.[0]?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContactOpen(false);
        requestAnimationFrame(() => contactReturnFocus.current?.focus());
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.documentElement.classList.remove("contact-drawer-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [contactOpen]);

  const hasRecentContactSubmission = () => {
    try {
      const submittedAt = Number.parseInt(
        window.localStorage.getItem(CONTACT_COOLDOWN_KEY) ?? "0",
        10,
      );
      return submittedAt > 0 && Date.now() - submittedAt < CONTACT_COOLDOWN_MS;
    } catch {
      return false;
    }
  };

  const openContact = (trigger: HTMLButtonElement) => {
    contactReturnFocus.current = trigger;
    setContactStatus(hasRecentContactSubmission() ? "limited" : "idle");
    setNavigationOpen(false);
    setContactOpen(true);
  };

  const closeContact = () => {
    setContactOpen(false);
    requestAnimationFrame(() => contactReturnFocus.current?.focus());
  };

  const scrollToSection = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;

    setNavigationOpen(false);
    window.history.pushState(null, "", `#${id}`);
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, {
        duration: 1.35,
        offset: -16,
      });
      return;
    }

    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  };

  const submitContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (contactStatus === "sending") return;
    if (hasRecentContactSubmission()) {
      setContactStatus("limited");
      return;
    }

    const formElement = event.currentTarget;
    setContactStatus("sending");

    try {
      const formData = new FormData(formElement);
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });

      if (response.status === 429) {
        setContactStatus("limited");
        return;
      }
      if (!response.ok) throw new Error("Contact request was rejected");

      formElement.reset();
      try {
        window.localStorage.setItem(CONTACT_COOLDOWN_KEY, String(Date.now()));
      } catch {
        // Formspree still received the enquiry if storage is unavailable.
      }
      setContactStatus("success");
    } catch {
      setContactStatus("error");
    }
  };

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    const applyExperienceMode = (mode: ExperienceMode) => {
      experienceMode.current = mode;
      document.documentElement.dataset.experience = mode;
      root.current?.setAttribute("data-experience", mode);

      if (mode !== "light") return;
      projectVideos.current.forEach((video) => {
        if (!video) return;
        video.pause();
        video.removeAttribute("src");
        delete video.dataset.loadedSource;
        video.load();
      });
    };
    applyExperienceMode(detectExperienceMode());

    const ensureVideoSource = (video: HTMLVideoElement, index: number) => {
      const mode = experienceMode.current;
      if (mode === "light" || video.dataset.failed === "true") return false;

      const source =
        mode === "full" ? projects[index].video : projects[index].balancedVideo;
      if (video.dataset.loadedSource !== source) {
        video.src = source;
        video.dataset.loadedSource = source;
        video.load();
      }
      return true;
    };

    let lenis: Lenis | undefined;
    let updateLenis: ((time: number) => void) | undefined;
    let projectMedia: ReturnType<typeof gsap.matchMedia> | undefined;

    if (!prefersReducedMotion && experienceMode.current === "full" && !isTouchDevice) {
      lenis = new Lenis({
        duration: 1.75,
        easing: (time) => 1 - Math.pow(1 - time, 6),
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: 0.68,
      });
      lenisRef.current = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      updateLenis = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(updateLenis);
    }

    const scope = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set("[data-reveal]", { opacity: 1, y: 0 });
        gsap.set(
          "[data-hero-kicker], [data-hero-line], [data-hero-meta], [data-scroll-cue]",
          { opacity: 1, y: 0, yPercent: 0 },
        );
        gsap.set("[data-floating-nav]", {
          autoAlpha: 0,
          xPercent: -50,
          y: -18,
          scale: 0.94,
        });
        ScrollTrigger.create({
          trigger: "[data-hero]",
          start: "48% top",
          onEnter: () =>
            gsap.set("[data-floating-nav]", {
              autoAlpha: 1,
              y: 0,
              scale: 1,
            }),
          onLeaveBack: () => {
            setNavigationOpen(false);
            gsap.set("[data-floating-nav]", {
              autoAlpha: 0,
              y: -18,
              scale: 0.94,
            });
          },
        });
        return;
      }

      gsap.set("[data-hero-kicker]", { y: 16, autoAlpha: 0 });
      gsap.set("[data-hero-line]", { yPercent: 115, autoAlpha: 0 });
      gsap.set("[data-hero-meta]", { y: 18, autoAlpha: 0 });
      gsap.set("[data-scroll-cue]", { y: 14, autoAlpha: 0 });

      gsap
        .timeline({ delay: 0.12 })
        .to("[data-hero-kicker]", {
          y: 0,
          autoAlpha: 1,
          duration: 0.65,
          ease: "power3.out",
        })
        .to(
          "[data-hero-line]",
          {
            yPercent: 0,
            autoAlpha: 1,
            duration: 1.05,
            stagger: 0.11,
            ease: "power4.out",
          },
          0.12,
        )
        .to(
          "[data-hero-meta]",
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.7,
            ease: "power3.out",
          },
          0.72,
        )
        .to(
          "[data-scroll-cue]",
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.65,
            ease: "power3.out",
          },
          0.92,
        );

      gsap
        .timeline({
          scrollTrigger: {
            trigger: "[data-hero]",
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        })
        .to("[data-hero-copy]", {
          yPercent: -13,
          scale: 0.93,
          opacity: 0.08,
          ease: "none",
        }, 0)
        .to('[data-hero-line="lead"]', { xPercent: -11, ease: "none" }, 0)
        .to('[data-hero-line="finish"]', { xPercent: 11, ease: "none" }, 0)
        .to("[data-hero-backdrop]", {
          scale: 1.08,
          opacity: 0.28,
          ease: "none",
        }, 0)
        .to("[data-scroll-cue]", { opacity: 0, y: -28 }, 0);

      gsap.set("[data-floating-nav]", {
        autoAlpha: 0,
        xPercent: -50,
        y: -18,
        scale: 0.94,
      });

      ScrollTrigger.create({
        trigger: "[data-hero]",
        start: "48% top",
        onEnter: () => {
          gsap.to("[data-floating-nav]", {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.55,
            ease: "power3.out",
            overwrite: true,
          });
        },
        onLeaveBack: () => {
          setNavigationOpen(false);
          gsap.to("[data-floating-nav]", {
            autoAlpha: 0,
            y: -18,
            scale: 0.94,
            duration: 0.35,
            ease: "power2.in",
            overwrite: true,
          });
        },
      });

      gsap.fromTo(
        "[data-reveal]",
        { y: 110, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.05,
          stagger: 0.09,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "[data-statement]",
            start: "top 76%",
            once: true,
          },
        },
      );

      gsap
        .timeline({
          scrollTrigger: {
            trigger: "[data-footer]",
            start: "top bottom",
            end: "bottom bottom",
            scrub: 1.5,
            refreshPriority: -1,
            invalidateOnRefresh: true,
          },
        })
        .fromTo(
          "[data-footer]",
          {
            y: () => {
              const footer = document.querySelector<HTMLElement>("[data-footer]");
              return footer
                ? Math.abs(Number.parseFloat(getComputedStyle(footer).marginTop))
                : 0;
            },
          },
          {
            y: 0,
            duration: 1.25,
            ease: "none",
          },
          0,
        )
        .to(
          "[data-projects] .projects-stage",
          {
            yPercent: -4,
            scale: 1.015,
            duration: 1.25,
            ease: "none",
          },
          0,
        );

      gsap
        .timeline({
          scrollTrigger: {
            trigger: "[data-footer]",
            start: "top 64%",
            once: true,
            refreshPriority: -2,
          },
        })
        .fromTo(
          "[data-footer-content]",
          { y: 55 },
          { y: 0, duration: 0.9, ease: "power2.out" },
          0,
        )
        .fromTo(
          "[data-footer-char]",
          { y: 14, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.62,
            stagger: 0.018,
            ease: "power3.out",
          },
          0.1,
        )
        .fromTo(
          "[data-footer-action]",
          { y: 32, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" },
          1.1,
        )
        .fromTo(
          "[data-footer-button-fill]",
          { scaleX: 0 },
          { scaleX: 1, duration: 0.7, ease: "power3.inOut" },
          1.22,
        )
        .fromTo(
          "[data-footer-button-char]",
          { y: 10, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.45,
            stagger: 0.04,
            ease: "power2.out",
          },
          1.92,
        )
        .fromTo(
          "[data-footer-bottom]",
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, ease: "power2.out" },
          1.15,
        )
        .fromTo(
          "[data-footer-bottom-char]",
          { y: 8, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.45,
            stagger: 0.012,
            ease: "power2.out",
          },
          1.25,
        );

      projectMedia = gsap.matchMedia();
      projectMedia.add("(min-width: 761px) and (pointer: fine)", () => {
        if (experienceMode.current === "light") return;
        const slides = gsap.utils.toArray<HTMLElement>("[data-project-slide]");
        let projectMagnetPoints: number[] = [];
        let lastProjectMagnet = -1;
        let projectMagnetLocked = false;
        let projectVideoRanges: Array<{
          index: number;
          start: number;
          end: number;
        }> = [];
        let activeProjectVideo: number | null = null;

        const syncProjectVideo = (nextVideo: number | null) => {
          if (activeProjectVideo === nextVideo) return;

          projectVideos.current.forEach((video, index) => {
            if (video && index !== nextVideo) video.pause();
          });
          activeProjectVideo = nextVideo;
          if (nextVideo === null) return;

          const video = projectVideos.current[nextVideo];
          if (!video) return;
          if (!ensureVideoSource(video, nextVideo)) return;
          video.currentTime = 0;
          void video.play().catch(() => {
            if (activeProjectVideo === nextVideo) activeProjectVideo = null;
          });
        };

        gsap.set(slides, { autoAlpha: 0 });
        gsap.set(
          slides.map((slide) =>
            slide.querySelector("[data-project-content]"),
          ),
          { autoAlpha: 1, y: 0 },
        );
        gsap.set("[data-project-char]", { opacity: 0, y: 14 });
        gsap.set("[data-project-description-char]", { opacity: 0, y: 10 });
        gsap.set(
          slides.map((slide) =>
            slide.querySelector("[data-project-image]"),
          ),
          {
            autoAlpha: 0,
            xPercent: 8,
            scale: 1.08,
            clipPath: "inset(0% 0% 0% 18%)",
          },
        );
        gsap.set(
          "[data-project-slide] .project-video-background",
          {
            xPercent: 0,
            scale: 1.025,
            clipPath: "inset(0% 0% 0% 0%)",
          },
        );

        const projectsTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: "[data-projects]",
            start: "top top",
            end: "+=750%",
            pin: true,
            scrub: 1.25,
            anticipatePin: 1,
            refreshPriority: 1,
            onUpdate: (trigger) => {
              const activeVideo = trigger.isActive
                ? projectVideoRanges.find(
                    ({ start, end }) =>
                      trigger.progress >= start && trigger.progress < end,
                  )?.index ?? null
                : null;
              syncProjectVideo(activeVideo);

              if (!lenis || projectMagnetLocked) return;

              if (trigger.direction < 0) {
                lastProjectMagnet =
                  projectMagnetPoints.filter(
                    (point) => trigger.progress >= point - 0.015,
                  ).length - 1;
                return;
              }

              const nextMagnet = projectMagnetPoints.findIndex(
                (point, index) =>
                  index > lastProjectMagnet && trigger.progress >= point,
              );
              if (nextMagnet === -1) return;

              projectMagnetLocked = true;
              lastProjectMagnet = nextMagnet;
              const targetScroll =
                trigger.start +
                projectMagnetPoints[nextMagnet] *
                  (trigger.end - trigger.start);

              lenis.scrollTo(targetScroll, {
                duration: 0.32,
                force: false,
                lock: false,
                onComplete: () => {
                  projectMagnetLocked = false;
                },
              });
            },
          },
        });

        projectsTimeline
          .to(
            "[data-projects]",
            {
              backgroundColor: projects[0].color,
              duration: 0.9,
              ease: "none",
            },
            0,
          )
          .to(
            slides[0],
            { autoAlpha: 1, duration: 0.01 },
            0.12,
          )
          .to(
            slides[0].querySelector("[data-project-image]"),
            {
              autoAlpha: 1,
              xPercent: 0,
              scale: 1,
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 0.9,
              ease: "power2.out",
            },
            0.12,
          )
          .to(
            slides[0].querySelectorAll("[data-project-char]"),
            {
              y: 0,
              opacity: 1,
              duration: 0.72,
              stagger: 0.018,
              ease: "power3.out",
            },
            1.12,
          )
          .to(
            slides[0].querySelectorAll("[data-project-description-char]"),
            {
              y: 0,
              opacity: 1,
              duration: 0.58,
              stagger: 0.007,
              ease: "power2.out",
            },
            1.72,
          )
          .addLabel("project-01", 2.7)
          .to({}, { duration: 0.45 });

        projects.slice(1).forEach((project, index) => {
          const previousSlide = slides[index];
          const nextSlide = slides[index + 1];
          const position = 3.2 + index * 3.2;

          projectsTimeline
            .to(
              previousSlide,
              { autoAlpha: 0, duration: 0.52, ease: "power2.inOut" },
              position,
            )
            .to(
              previousSlide.querySelector("[data-project-content]"),
              { y: -45, duration: 0.5, ease: "power2.inOut" },
              position,
            )
            .to(
              "[data-projects]",
              { backgroundColor: project.color, duration: 0.9, ease: "none" },
              position,
            )
            .to(
              nextSlide,
              { autoAlpha: 1, duration: 0.01 },
              position + 0.3,
            )
            .to(
              nextSlide.querySelector("[data-project-image]"),
              {
                autoAlpha: 1,
                xPercent: 0,
                scale: 1,
                clipPath: "inset(0% 0% 0% 0%)",
                duration: 0.85,
                ease: "power2.out",
              },
              position + 0.3,
            )
            .to(
              nextSlide.querySelectorAll("[data-project-char]"),
              {
                y: 0,
                opacity: 1,
                duration: 0.72,
                stagger: 0.018,
                ease: "power3.out",
              },
              position + 1.3,
            )
            .to(
              nextSlide.querySelectorAll("[data-project-description-char]"),
              {
                y: 0,
                opacity: 1,
                duration: 0.58,
                stagger: 0.007,
                ease: "power2.out",
              },
              position + 1.9,
            )
            .addLabel(`project-0${index + 2}`, position + 2.9);
        });

        projectsTimeline.to({}, { duration: 1.45 });
        projectMagnetPoints = [
          projectsTimeline.labels["project-01"],
          projectsTimeline.labels["project-02"],
          projectsTimeline.labels["project-03"],
        ].map((time) => time / projectsTimeline.duration());
        projectVideoRanges = [
          { index: 0, start: 0.008, end: 3.2 / projectsTimeline.duration() },
          {
            index: 1,
            start: 3.5 / projectsTimeline.duration(),
            end: 6.4 / projectsTimeline.duration(),
          },
          {
            index: 2,
            start: 6.7 / projectsTimeline.duration(),
            end: 1,
          },
        ];

        return () => syncProjectVideo(null);
      });

      projectMedia.add(
        "(max-width: 760px), (pointer: coarse) and (max-width: 1024px)",
        () => {
          if (experienceMode.current === "light") return;
          const slides = gsap.utils.toArray<HTMLElement>("[data-project-slide]");
          const videos = projectVideos.current.filter(
            (video): video is HTMLVideoElement => Boolean(video),
          );

          const revealTimelines = slides.map((slide) => {
          const primaryCharacters = slide.querySelectorAll(
            "[data-project-char]",
          );
          const descriptionCharacters = slide.querySelectorAll(
            "[data-project-description-char]",
          );

          gsap.set(primaryCharacters, { opacity: 0, y: 12 });
          gsap.set(descriptionCharacters, { opacity: 0, y: 8 });

          return gsap
            .timeline({
              scrollTrigger: {
                trigger: slide,
                start: "top 72%",
                once: true,
              },
            })
            .to(primaryCharacters, {
              opacity: 1,
              y: 0,
              duration: 0.55,
              stagger: 0.012,
              ease: "power3.out",
            })
            .to(
              descriptionCharacters,
              {
                opacity: 1,
                y: 0,
                duration: 0.48,
                stagger: 0.006,
                ease: "power2.out",
              },
              "-=0.1",
            );
          });

          const preloadObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const video = entry.target as HTMLVideoElement;
              const index = Number(video.dataset.projectIndex);
              if (Number.isInteger(index)) ensureVideoSource(video, index);
              preloadObserver.unobserve(video);
            });
          },
          { rootMargin: "70% 0px", threshold: 0 },
          );

          const playbackObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const video = entry.target as HTMLVideoElement;
              if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
                const index = Number(video.dataset.projectIndex);
                if (
                  Number.isInteger(index) &&
                  ensureVideoSource(video, index)
                ) {
                  void video.play().catch(() => undefined);
                }
              } else {
                video.pause();
              }
            });
          },
          { threshold: [0, 0.35] },
          );

          videos.forEach((video) => {
            preloadObserver.observe(video);
            playbackObserver.observe(video);
          });
          return () => {
            preloadObserver.disconnect();
            playbackObserver.disconnect();
            videos.forEach((video) => video.pause());
            revealTimelines.forEach((timeline) => {
              timeline.scrollTrigger?.kill();
              timeline.kill();
            });
          };
        },
      );
    }, root);

    const videoErrorHandlers = projectVideos.current.map((video) => {
      if (!video) return undefined;
      const handleError = () => {
        video.pause();
        video.removeAttribute("src");
        video.dataset.failed = "true";
        delete video.dataset.loadedSource;
        video.load();
      };
      video.addEventListener("error", handleError);
      return { video, handleError };
    });

    const pauseVideosWhenHidden = () => {
      if (document.visibilityState !== "hidden") return;
      projectVideos.current.forEach((video) => video?.pause());
    };
    document.addEventListener("visibilitychange", pauseVideosWhenHidden);

    return () => {
      document.removeEventListener("visibilitychange", pauseVideosWhenHidden);
      videoErrorHandlers.forEach((entry) => {
        if (entry) entry.video.removeEventListener("error", entry.handleError);
      });
      scope.revert();
      projectMedia?.revert();
      if (updateLenis) gsap.ticker.remove(updateLenis);
      lenis?.destroy();
      lenisRef.current = null;
      delete document.documentElement.dataset.experience;
    };
  }, []);

  return (
    <main ref={root} className="site-shell">
      <nav
        ref={navigation}
        data-floating-nav
        className={`floating-nav${navigationOpen ? " is-menu-open" : ""}`}
        aria-label="Primary navigation"
      >
        <div className="floating-nav-bar">
          <a
            className="nav-mark"
            href="#top"
            aria-label="Back to intro"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection("top");
            }}
          >
            <span />
            <span />
            <span />
          </a>
          <p>Products that think, move &amp; work</p>
          <div className="nav-menu-wrap">
            <button
              ref={navigationToggle}
              className="nav-link nav-menu-trigger"
              type="button"
              aria-label={navigationOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={navigationOpen}
              aria-controls="primary-nav-menu"
              onClick={() => setNavigationOpen((open) => !open)}
            >
              <span className="nav-menu-icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>

        <div
          id="primary-nav-menu"
          className="nav-dropdown"
          aria-hidden={!navigationOpen}
        >
          <div className="nav-dropdown-inner">
            <div className="nav-menu-primary">
              <a
                className="nav-menu-item"
                href="#about"
                tabIndex={navigationOpen ? 0 : -1}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection("about");
                }}
              >
                <span>01</span>
                <span>About us</span>
                <span aria-hidden="true">↘</span>
              </a>
              <a
                className="nav-menu-item"
                href="#work"
                tabIndex={navigationOpen ? 0 : -1}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection("work");
                }}
              >
                <span>02</span>
                <span>Work</span>
                <span aria-hidden="true">↘</span>
              </a>
              <button
                className="nav-menu-item"
                type="button"
                tabIndex={navigationOpen ? 0 : -1}
                aria-haspopup="dialog"
                aria-expanded={contactOpen}
                onClick={(event) => openContact(event.currentTarget)}
              >
                <span>03</span>
                <span>Contact</span>
                <span aria-hidden="true">↗</span>
              </button>
            </div>

            <div className="nav-menu-socials" aria-label="Social links">
              <a
                href="https://www.linkedin.com/in/artur-tymoshenko-9ab9b1420/"
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={navigationOpen ? 0 : -1}
                onClick={() => setNavigationOpen(false)}
              >
                LinkedIn <span aria-hidden="true">↗</span>
              </a>
              <a
                href="https://github.com/Artur229?tab=repositories"
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={navigationOpen ? 0 : -1}
                onClick={() => setNavigationOpen(false)}
              >
                GitHub <span aria-hidden="true">↗</span>
              </a>
              <span className="nav-menu-coming-soon" aria-label="CV, coming soon">
                <span>CV</span>
                <small>Coming soon</small>
              </span>
            </div>
          </div>
        </div>
      </nav>

      <section id="top" data-hero className="hero" aria-label="Intro">
        <div data-hero-backdrop className="hero-backdrop" aria-hidden="true">
          <div className="hero-aura" />
          <div className="hero-grid" />
          <div className="hero-grain" />
        </div>

        <div data-hero-copy className="hero-copy">
          <p data-hero-kicker className="hero-kicker">
            Full-stack product developer
          </p>
          <h1 className="hero-title">
            <span className="hero-title-line">
              <span data-hero-line="lead">I turn ideas into</span>
            </span>
            <span className="hero-title-line">
              <span data-hero-line="finish">working websites.</span>
            </span>
          </h1>
          <div data-hero-meta className="hero-meta">
            <span>Design · Development · AI integrations</span>
            <span>From first wireframe to launch</span>
          </div>
        </div>

        <div data-scroll-cue className="scroll-cue">
          <span>Scroll to explore</span>
          <span className="scroll-line" aria-hidden="true" />
        </div>
      </section>

      <section
        id="about"
        data-statement
        className="statement"
        aria-labelledby="statement-title"
      >
        <div className="statement-grid">
          <h2 id="statement-title" className="statement-title">
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
          </h2>

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

      <section
        id="work"
        data-projects
        className="projects-showcase"
        aria-label="Selected projects"
        style={{ backgroundColor: "#070707" }}
      >
        <div className="projects-stage">
          {projects.map((project, index) => (
            <article
              data-project-slide
              className="project-slide"
              key={project.number}
            >
              <div data-project-content className="project-content">
                <span className="project-number">
                  <CharacterText text={project.number} group="project" />
                </span>
                <p className="project-category">
                  <CharacterText text={project.category} group="project" />
                </p>
                <h2>
                  <CharacterText text={project.title} group="project" />
                </h2>
                <p className="project-description">
                  <CharacterText
                    text={project.description}
                    group="project-description"
                  />
                </p>
              </div>

              <div
                data-project-image
                className={`project-image${project.video ? " project-video-background" : ""}`}
              >
                {project.video ? (
                  <video
                    ref={(node) => {
                      projectVideos.current[index] = node;
                    }}
                    muted
                    loop
                    playsInline
                    preload="none"
                    poster={project.poster}
                    data-project-index={index}
                    data-full-source={project.video}
                    data-balanced-source={project.balancedVideo}
                    aria-hidden="true"
                  />
                ) : (
                  <Image
                    src={project.image}
                    alt={`${project.title} project interface`}
                    fill
                    sizes="(max-width: 760px) 100vw, 60vw"
                    quality={80}
                  />
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer id="contact" data-footer className="contact-footer">
        <div data-footer-content className="footer-content">
          <div className="footer-intro">
            <h2>
              <span className="footer-line-mask">
                <CharacterText text="Let's talk." group="footer" />
              </span>
              <span className="footer-line-mask">
                <CharacterText text="We'd love to hear" group="footer" />
              </span>
              <span className="footer-line-mask">
                <CharacterText text="from you." group="footer" />
              </span>
            </h2>
            <button
              data-footer-action
              className="contact-button"
              type="button"
              onClick={(event) => openContact(event.currentTarget)}
              aria-haspopup="dialog"
              aria-expanded={contactOpen}
            >
              <span
                data-footer-button-fill
                className="contact-button-fill"
                aria-hidden="true"
              />
              <span
                data-footer-button-copy
                className="contact-button-copy"
              >
                <CharacterText text="Contact" group="footer-button" />
                <span data-footer-button-char aria-hidden="true">↗</span>
              </span>
            </button>
          </div>

          <div data-footer-bottom className="footer-bottom">
            <nav className="footer-links" aria-label="Social links">
              <a
                href="https://www.linkedin.com/in/artur-tymoshenko-9ab9b1420/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <CharacterText text="LinkedIn" group="footer-bottom" />
              </a>
              <a
                href="https://github.com/Artur229?tab=repositories"
                target="_blank"
                rel="noopener noreferrer"
              >
                <CharacterText text="GitHub" group="footer-bottom" />
              </a>
              <span
                className="footer-link-coming-soon"
                aria-label="CV, coming soon"
              >
                <CharacterText text="CV" group="footer-bottom" />
                <em>
                  <CharacterText text="Coming soon" group="footer-bottom" />
                </em>
              </span>
            </nav>
            <p>
              <CharacterText
                text="© 2026 Arthur Timoshenko. All rights reserved."
                group="footer-bottom"
              />
            </p>
          </div>
        </div>
      </footer>

      <div
        className={`contact-drawer-layer${contactOpen ? " is-open" : ""}`}
        aria-hidden={!contactOpen}
      >
        <button
          className="contact-drawer-backdrop"
          type="button"
          tabIndex={-1}
          aria-label="Close contact panel"
          onClick={closeContact}
        />
        <aside
          ref={contactDrawer}
          className="contact-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-drawer-title"
          data-lenis-prevent
        >
          <header className="contact-drawer-header">
            <div>
              <span>New project / collaboration</span>
              <h2 id="contact-drawer-title">Let&apos;s make something work.</h2>
            </div>
            <button
              className="contact-drawer-close"
              type="button"
              onClick={closeContact}
              aria-label="Close contact panel"
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
          </header>

          <form
            className="contact-form"
            action="/api/contact"
            method="POST"
            onSubmit={submitContact}
          >
            <input
              name="_subject"
              type="hidden"
              value="New portfolio enquiry"
            />
            <label className="contact-honeypot" aria-hidden="true">
              Leave this field empty
              <input
                name="_gotcha"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </label>
            <label className="contact-field">
              <span>Your name</span>
              <input
                name="name"
                type="text"
                autoComplete="name"
                minLength={2}
                maxLength={80}
                required
              />
            </label>
            <label className="contact-field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
              />
            </label>
            <label className="contact-field">
              <span>Company / brand</span>
              <input
                name="company"
                type="text"
                autoComplete="organization"
                maxLength={100}
              />
            </label>
            <label className="contact-field contact-field-message">
              <span>Tell me about the project</span>
              <textarea
                name="message"
                rows={4}
                minLength={10}
                maxLength={3000}
                required
              />
            </label>

            <div className="contact-form-footer">
              <label className="contact-consent">
                <input name="consent" type="checkbox" value="agreed" required />
                <span>I agree to share these details for this enquiry.</span>
              </label>
              <button
                className="contact-submit"
                type="submit"
                disabled={
                  contactStatus === "sending" ||
                  contactStatus === "success" ||
                  contactStatus === "limited"
                }
                aria-busy={contactStatus === "sending"}
              >
                <span>
                  {contactStatus === "sending"
                    ? "Sending..."
                    : contactStatus === "success"
                      ? "Sent"
                      : contactStatus === "limited"
                        ? "Try later"
                        : "Send enquiry"}
                </span>
                <span aria-hidden="true">↗</span>
              </button>
            </div>

            <div className="contact-form-status" aria-live="polite">
              {contactStatus === "success" ? (
                <p className="is-success">
                  Thank you — your enquiry has been sent. I&apos;ll get back to you soon.
                </p>
              ) : null}
              {contactStatus === "error" ? (
                <p className="is-error" role="alert">
                  Something went wrong. Please check the fields and try again.
                </p>
              ) : null}
              {contactStatus === "limited" ? (
                <p className="is-limited" role="status">
                  One enquiry has already been sent from this browser. Please try again tomorrow.
                </p>
              ) : null}
            </div>
          </form>
        </aside>
      </div>
    </main>
  );
}
