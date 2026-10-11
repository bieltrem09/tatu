"use strict";

/* ==========================================================================
   Gabriel — Portfólio
   GSAP + ScrollTrigger + SplitText para as animações, Lenis para a rolagem.
   Tudo funciona sem JS (conteúdo visível) e respeita "movimento reduzido".
   ========================================================================== */

(() => {
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
    const animate = hasGsap && !reduceMotion;

    /* ----------------------------------------------------------------------
       Dados dos estudos de caso
       ---------------------------------------------------------------------- */
    const CASES = {
        tatu: {
            kicker: "Estudo de caso · 01",
            title: "Tatu Pré-Moldados",
            facts: [["Cliente", "Tatu Pré-Moldados"], ["Segmento", "Indústria · Limeira/SP"], ["Entrega", "Site institucional"], ["Ano", "2026"]],
            hero: ["img/work/tatu-capa.webp", "Página inicial do site da Tatu Pré-Moldados"],
            challenge: "Uma indústria com quase 50 anos de história precisava de um site à altura: mostrar a linha completa de pré-moldados, a capacidade da fábrica e facilitar o pedido de orçamento para construtoras e clientes da região.",
            solution: "Um site editorial com animações guiadas pelo scroll que contam a história da fábrica, catálogo organizado por linha de produto e HTML pré-renderizado para carregar rápido e ser bem indexado pelo Google.",
            list: ["Catálogo de blocos, lajes, pisos, telhas e guias", "Linha do tempo da empresa", "Pedido de orçamento e WhatsApp em destaque", "Barra de contato fixa no celular", "SEO técnico e dados estruturados"],
            gallery: [["img/work/tatu-detalhe-1.webp", "Seção de capacidade produtiva da fábrica"], ["img/work/tatu-detalhe-2.webp", "Catálogo com a linha completa de produtos"], ["img/work/tatu-mobile.webp", "Versão do site no celular"]],
            link: "https://tatu-premoldados.vercel.app",
        },
        vetor: {
            kicker: "Estudo de caso · 02",
            title: "Vetor Logística",
            facts: [["Projeto", "Vetor Logística"], ["Segmento", "Logística e transporte"], ["Entrega", "Site institucional"], ["Ano", "2026"]],
            hero: ["img/work/vetor-capa.webp", "Página inicial da Vetor Logística"],
            challenge: "Explicar uma operação rodoviária, marítima e aérea de um jeito simples, transmitir robustez logo de cara e levar o visitante direto para a cotação de frete.",
            solution: "Direção de arte em brutalismo editorial, um contêiner 3D que reage à rolagem e uma jornada animada mar, terra e ar que apresenta os modais sem depender de texto longo.",
            list: ["Topo 3D interativo com Three.js", "Jornada animada dos modais", "Rastreamento de carga", "Cotação de frete pelo WhatsApp", "Contadores e depoimentos"],
            gallery: [["img/work/vetor-detalhe-1.webp", "Seção de modais: mar, terra e ar"], ["img/work/vetor-detalhe-2.webp", "Seção de chamada com tipografia de impacto"], ["img/work/vetor-mobile.webp", "Versão do site no celular"]],
            link: "https://vetor-logistica.vercel.app",
        },
        sushi: {
            kicker: "Estudo de caso · 03",
            title: "Sushi Japanese Restaurant",
            facts: [["Projeto", "Sushi Japanese Restaurant"], ["Segmento", "Restaurante japonês"], ["Entrega", "Landing page"], ["Ano", "2026"]],
            hero: ["img/work/sushi-capa.webp", "Página inicial do restaurante Sushi"],
            challenge: "Transmitir a experiência de um omakase premium antes mesmo do cliente chegar ao restaurante e transformar a visita ao site em reserva de mesa.",
            solution: "Visual escuro com luz dramática, vermelho e dourado, tipografia clássica e animações suaves. O cardápio completo fica a um clique e a reserva aparece em destaque em todas as telas.",
            list: ["Cardápio digital com PDF para download", "Seções de chef, ambiente e omakase", "Reserva de mesa em destaque", "Dados estruturados de restaurante", "Imagens em AVIF e WebP"],
            gallery: [["img/work/sushi-detalhe-1.webp", "Seção apresentando o chef"], ["img/work/sushi-detalhe-2.webp", "Seção do cardápio"], ["img/work/sushi-mobile.webp", "Versão do site no celular"]],
            link: "https://project-6c9bl.vercel.app",
        },
        aurora: {
            kicker: "Estudo de caso · 04",
            title: "Aurora Estúdio Criativo",
            facts: [["Projeto", "Aurora"], ["Segmento", "Estúdio de direção de arte"], ["Entrega", "Site institucional"], ["Ano", "2026"]],
            hero: ["img/work/auroria-capa.webp", "Página inicial do estúdio Aurora"],
            challenge: "Um estúdio de direção de arte vende sensibilidade estética. O site precisava provar isso nos primeiros segundos, sem parecer mais um portfólio genérico.",
            solution: "Estética editorial e minimalista, tipografia de alto contraste, preloader, cursor personalizado e transições suaves entre manifesto, trabalhos e serviços.",
            list: ["Preloader e cursor personalizados", "Vitrine de trabalhos", "Manifesto animado", "Barra de progresso de leitura", "Componentes em React e TypeScript"],
            gallery: [["img/work/auroria-detalhe-1.webp", "Vitrine de projetos selecionados"], ["img/work/auroria-detalhe-2.webp", "Seção de trabalho com fotografia editorial"], ["img/work/auroria-mobile.webp", "Versão do site no celular"]],
            link: "https://auroria-ten.vercel.app",
        },
    };

    /* ----------------------------------------------------------------------
       Utilidades que funcionam com ou sem animação
       ---------------------------------------------------------------------- */
    function initClock() {
        const clocks = $$(".js-clock");
        if (!clocks.length) return;
        const fmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
        const tick = () => clocks.forEach((el) => { el.textContent = fmt.format(new Date()); });
        tick();
        setInterval(tick, 30000);
        $$(".js-year").forEach((el) => { el.textContent = new Date().getFullYear(); });
    }

    function initCopy() {
        $$(".js-copy").forEach((btn) => {
            const hint = $(".copy__hint", btn);
            btn.addEventListener("click", async () => {
                const value = btn.dataset.copy;
                try {
                    await navigator.clipboard.writeText(value);
                    hint.textContent = "Copiado!";
                } catch {
                    window.location.href = `mailto:${value}`;
                    return;
                }
                setTimeout(() => { hint.textContent = "Copiar"; }, 2200);
            });
        });
    }

    /* Acordeão do FAQ (altura animada quando há GSAP) */
    function initAccordion() {
        $$(".acc__btn").forEach((btn) => {
            const panel = document.getElementById(btn.getAttribute("aria-controls"));
            btn.addEventListener("click", () => {
                const open = btn.getAttribute("aria-expanded") === "true";
                btn.setAttribute("aria-expanded", String(!open));
                if (!animate) { panel.hidden = open; return; }
                if (open) {
                    gsap.to(panel, { height: 0, duration: 0.45, ease: "power3.inOut", onComplete: () => { panel.hidden = true; panel.style.height = ""; } });
                } else {
                    panel.hidden = false;
                    gsap.fromTo(panel, { height: 0 }, { height: "auto", duration: 0.55, ease: "power3.out", onComplete: () => ScrollTrigger.refresh() });
                }
            });
        });
    }

    /* ----------------------------------------------------------------------
       Rolagem suave (Lenis) — ligada ao ScrollTrigger
       ---------------------------------------------------------------------- */
    let lenis = null;
    function initLenis() {
        if (!animate || typeof window.Lenis === "undefined") return;
        lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
    }
    const stopScroll = () => { if (lenis) lenis.stop(); };
    const startScroll = () => { if (lenis) lenis.start(); };

    /* Âncoras internas: rolam suave e fecham o menu */
    function initAnchors() {
        document.addEventListener("click", (e) => {
            const a = e.target.closest('a[href^="#"]');
            if (!a) return;
            const id = a.getAttribute("href");
            const target = id === "#inicio" || id === "#" ? document.body : document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            closeMenu();
            const behavior = reduceMotion ? "auto" : "smooth";
            if (lenis) lenis.scrollTo(target === document.body ? 0 : target, { duration: 1.4 });
            else if (target === document.body) window.scrollTo({ top: 0, behavior });
            else target.scrollIntoView({ behavior });
            if (id !== "#inicio") history.replaceState(null, "", id);
        });
    }

    /* ----------------------------------------------------------------------
       Header: esconde ao descer, troca de cor conforme o fundo da seção
       ---------------------------------------------------------------------- */
    const header = $(".header");
    function initHeader() {
        let lastY = window.scrollY;
        const fab = $(".fab");
        const onScroll = () => {
            const y = window.scrollY;
            header.classList.toggle("is-scrolled", y > 30);
            const goingDown = y > lastY && y > 300;
            if (!header.classList.contains("menu-open")) header.classList.toggle("is-hidden", goingDown);
            fab.classList.toggle("is-visible", y > window.innerHeight * 0.85);
            lastY = y;
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();

        // Tema do header de acordo com a seção que está atrás dele
        const sections = $$("[data-theme]");
        const setTheme = (theme) => {
            header.classList.toggle("on-paper", theme === "paper");
            header.classList.toggle("on-lime", theme === "lime");
        };
        const probe = () => {
            const y = (header.offsetHeight || 80) / 2;
            const current = sections.find((s) => {
                const r = s.getBoundingClientRect();
                return r.top <= y && r.bottom >= y;
            });
            setTheme(current ? current.dataset.theme : "ink");
        };
        window.addEventListener("scroll", probe, { passive: true });
        window.addEventListener("resize", probe);
        probe();
    }

    /* Menu mobile */
    const menu = $("#menu");
    const menuBtn = $(".menu-btn");
    function openMenu() {
        menu.hidden = false;
        menuBtn.setAttribute("aria-expanded", "true");
        menuBtn.setAttribute("aria-label", "Fechar menu");
        header.classList.add("menu-open");
        header.classList.remove("is-hidden");
        stopScroll();
        if (animate) {
            gsap.fromTo(menu, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: "expo.inOut" });
            gsap.fromTo($$(".menu__nav a, .menu__foot > *", menu), { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.05, ease: "expo.out", delay: 0.25 });
        }
    }
    function closeMenu() {
        if (!menu || menu.hidden) return;
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.setAttribute("aria-label", "Abrir menu");
        header.classList.remove("menu-open");
        startScroll();
        if (animate) {
            gsap.to(menu, { clipPath: "inset(0 0 100% 0)", duration: 0.55, ease: "expo.inOut", onComplete: () => { menu.hidden = true; } });
        } else {
            menu.hidden = true;
        }
    }
    function initMenu() {
        menuBtn.addEventListener("click", () => (menu.hidden ? openMenu() : closeMenu()));
        document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
        window.matchMedia("(min-width: 1081px)").addEventListener("change", (e) => { if (e.matches) closeMenu(); });
    }

    /* ----------------------------------------------------------------------
       Estudo de caso (dialog)
       ---------------------------------------------------------------------- */
    const study = $("#study");
    function fillStudy(key) {
        const c = CASES[key];
        if (!c) return false;
        $(".study__kicker", study).textContent = c.kicker;
        $(".study__title", study).textContent = c.title;
        $(".study__facts", study).replaceChildren(...c.facts.map(([k, v]) => {
            const wrap = document.createElement("div");
            const dt = document.createElement("dt"); dt.className = "mono"; dt.textContent = k;
            const dd = document.createElement("dd"); dd.textContent = v;
            wrap.append(dt, dd);
            return wrap;
        }));
        const heroImg = $(".study__hero img", study);
        heroImg.src = c.hero[0];
        heroImg.alt = c.hero[1];
        $(".study__challenge", study).textContent = c.challenge;
        $(".study__solution", study).textContent = c.solution;
        $(".study__list", study).replaceChildren(...c.list.map((t) => { const li = document.createElement("li"); li.textContent = t; return li; }));
        $(".study__gallery", study).replaceChildren(...c.gallery.map(([src, alt], i) => {
            const img = document.createElement("img");
            img.src = src; img.alt = alt; img.loading = "lazy"; img.decoding = "async";
            img.width = i === 2 ? 390 : 1200; img.height = i === 2 ? 780 : 750;
            return img;
        }));
        $(".study__live", study).href = c.link;
        return true;
    }
    function openStudy(key) {
        if (!fillStudy(key)) return;
        $(".study__scroll", study).scrollTop = 0;
        study.showModal();
        stopScroll();
        if (cursorEl) cursorEl.classList.remove("is-label", "is-hover");
        if (animate) {
            gsap.fromTo(study, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 0.9, ease: "expo.inOut" });
            gsap.fromTo($$(".study__head > *, .study__hero", study), { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.08, ease: "expo.out", delay: 0.45 });
        }
    }
    function closeStudy() {
        if (!study.open) return;
        const done = () => { study.close(); startScroll(); };
        if (animate) gsap.to(study, { clipPath: "inset(0 0 100% 0)", duration: 0.7, ease: "expo.inOut", onComplete: done });
        else done();
    }
    function initStudy() {
        $$(".js-open-case").forEach((el) => el.addEventListener("click", () => openStudy(el.dataset.case)));
        $(".study__close", study).addEventListener("click", closeStudy);
        study.addEventListener("cancel", (e) => { e.preventDefault(); closeStudy(); });
        study.addEventListener("close", () => { study.style.clipPath = ""; });
    }

    /* ----------------------------------------------------------------------
       Cursor personalizado + botões magnéticos
       ---------------------------------------------------------------------- */
    let cursorEl = null;
    function initCursor() {
        if (!animate || !finePointer) return;
        cursorEl = $(".cursor");
        const label = $(".cursor__label", cursorEl);
        const xTo = gsap.quickTo(cursorEl, "x", { duration: 0.35, ease: "power3" });
        const yTo = gsap.quickTo(cursorEl, "y", { duration: 0.35, ease: "power3" });
        window.addEventListener("pointermove", (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
        document.addEventListener("pointerover", (e) => {
            const labelled = e.target.closest("[data-cursor]");
            const interactive = e.target.closest("a, button");
            if (labelled && !study.open) {
                label.textContent = labelled.dataset.cursor;
                cursorEl.classList.add("is-label");
                cursorEl.classList.remove("is-hover");
            } else {
                cursorEl.classList.remove("is-label");
                cursorEl.classList.toggle("is-hover", Boolean(interactive));
            }
        });
        document.documentElement.addEventListener("pointerleave", () => cursorEl.classList.add("is-hidden"));
        document.documentElement.addEventListener("pointerenter", () => cursorEl.classList.remove("is-hidden"));
    }

    function initMagnetic() {
        if (!animate || !finePointer) return;
        $$(".magnetic").forEach((el) => {
            const strength = el.classList.contains("btn--xl") ? 0.25 : 0.35;
            const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
            const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
            el.addEventListener("pointermove", (e) => {
                const r = el.getBoundingClientRect();
                xTo((e.clientX - (r.left + r.width / 2)) * strength);
                yTo((e.clientY - (r.top + r.height / 2)) * strength);
            });
            el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
        });
    }

    /* Prévia flutuante dos "Mais projetos" */
    function initMorePreview() {
        if (!animate || !finePointer) return;
        const box = $(".more__preview");
        const img = $("img", box);
        const xTo = gsap.quickTo(box, "x", { duration: 0.5, ease: "power3" });
        const yTo = gsap.quickTo(box, "y", { duration: 0.5, ease: "power3" });
        $$(".more__item").forEach((item) => {
            item.addEventListener("pointerenter", () => {
                img.src = item.dataset.img;
                gsap.to(box, { opacity: 1, scale: 1, duration: 0.45, ease: "power3.out" });
            });
            item.addEventListener("pointerleave", () => gsap.to(box, { opacity: 0, scale: 0.6, duration: 0.35, ease: "power3.in" }));
            item.addEventListener("pointermove", (e) => { xTo(e.clientX + 24); yTo(e.clientY - 110); });
        });
    }

    /* ----------------------------------------------------------------------
       Preloader + entrada do hero
       ---------------------------------------------------------------------- */
    function runPreloader(done) {
        const pre = $(".preloader");
        let seen = false;
        try { seen = sessionStorage.getItem("gb-preloader") === "1"; } catch { /* sem storage */ }
        if (!animate || seen) {
            document.documentElement.classList.add("no-preloader");
            done(0);
            return;
        }
        try { sessionStorage.setItem("gb-preloader", "1"); } catch { /* sem storage */ }

        stopScroll();
        const num = $(".preloader__num", pre);
        const words = $$(".preloader__words span", pre);
        const counter = { v: 0 };
        const tl = gsap.timeline({
            onComplete: () => { pre.remove(); startScroll(); },
        });
        tl.from($(".preloader__name", pre), { yPercent: 100, opacity: 0, duration: 0.9, ease: "expo.out" })
            .to(counter, { v: 100, duration: 1.6, ease: "power2.inOut", onUpdate: () => { num.textContent = Math.round(counter.v); } }, 0);
        words.forEach((w, i) => {
            tl.to(w, { yPercent: 0, duration: 0.45, ease: "expo.out" }, 0.15 + i * 0.5);
            if (i < words.length - 1) tl.to(w, { yPercent: -110, duration: 0.45, ease: "expo.in" }, 0.15 + i * 0.5 + 0.3);
        });
        tl.to(pre, { clipPath: "inset(0 0 100% 0)", duration: 1, ease: "expo.inOut" }, "+=0.15");
        tl.call(() => done(0.2), null, "-=0.55");
    }

    const markReady = () => document.documentElement.classList.add("is-ready");

    function heroIntro(delay) {
        markReady();
        const title = $(".hero__title");
        const split = SplitText.create(title, { type: "lines", mask: "lines", linesClass: "split-line" });
        const tl = gsap.timeline({ delay });
        tl.from(header.children, { y: -30, opacity: 0, duration: 1, stagger: 0.06, ease: "expo.out" }, 0)
            .from(".status", { y: 20, opacity: 0, duration: 0.8, ease: "expo.out" }, 0.1)
            .from(split.lines, { yPercent: 110, duration: 1.2, stagger: 0.09, ease: "expo.out" }, 0.15)
            .fromTo(".hero__photo-frame", { clipPath: "inset(100% 0 0 0 round 24px)" }, { clipPath: "inset(0% 0 0 0 round 24px)", duration: 1.4, ease: "expo.inOut" }, 0.1)
            .from(".hero__photo-frame img", { scale: 1.35, duration: 1.8, ease: "expo.out" }, 0.3)
            .from(".hero__lead", { y: 30, opacity: 0, duration: 1, ease: "expo.out" }, 0.55)
            .from(".hero__actions .btn", { y: 30, opacity: 0, duration: 1, stagger: 0.08, ease: "expo.out" }, 0.65)
            .from(".chip--float", { scale: 0, opacity: 0, duration: 0.9, stagger: 0.12, ease: "back.out(2)" }, 0.9)
            .from(".hero__foot", { opacity: 0, y: 20, duration: 1, ease: "expo.out" }, 0.9);

        // Chips flutuando
        $$(".chip--float").forEach((chip, i) => {
            gsap.to(chip, { y: i % 2 ? 10 : -10, duration: 2.4 + i * 0.4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 2 });
        });

        // Paralaxe ao sair do hero
        gsap.to(".hero__photo-frame img", {
            yPercent: 12, ease: "none",
            scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero__copy", {
            y: -80, opacity: 0.2, ease: "none",
            scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true },
        });
    }

    /* ----------------------------------------------------------------------
       Animações por seção
       ---------------------------------------------------------------------- */
    function initMarquee() {
        const track = $(".marquee__track");
        const loop = gsap.to(track, { xPercent: -50, repeat: -1, duration: 28, ease: "none" });
        let direction = 1;
        if (lenis) {
            lenis.on("scroll", ({ velocity, direction: dir }) => {
                if (dir) direction = dir;
                const boost = Math.min(Math.abs(velocity) / 6, 4);
                gsap.to(loop, { timeScale: direction * (1 + boost), duration: 0.2, overwrite: true });
                gsap.to(loop, { timeScale: direction, duration: 1.2, delay: 0.2, ease: "power2.out", overwrite: false });
            });
        }
    }

    function initStatement() {
        const text = $(".statement__text");
        const split = SplitText.create(text, { type: "words", wordsClass: "word" });
        gsap.fromTo(split.words, { opacity: 0.12 }, {
            opacity: 1, stagger: 0.1, ease: "none",
            scrollTrigger: { trigger: text, start: "top 78%", end: "bottom 45%", scrub: true },
        });
    }

    function initCounters() {
        $$(".js-count").forEach((el) => {
            const to = Number(el.dataset.to);
            const pad = Number(el.dataset.pad || 0);
            const obj = { v: 0 };
            el.textContent = String(0).padStart(pad, "0");
            ScrollTrigger.create({
                trigger: el, start: "top 88%", once: true,
                onEnter: () => gsap.to(obj, {
                    v: to, duration: 1.8, ease: "power3.out",
                    onUpdate: () => { el.textContent = String(Math.round(obj.v)).padStart(pad, "0"); },
                }),
            });
        });
    }

    function initTitles() {
        $$(".section-title, .cta__title").forEach((title) => {
            const split = SplitText.create(title, { type: "lines", mask: "lines", linesClass: "split-line" });
            gsap.from(split.lines, {
                yPercent: 110, duration: 1.2, stagger: 0.1, ease: "expo.out",
                scrollTrigger: { trigger: title, start: "top 85%" },
            });
        });
    }

    function initReveals() {
        const targets = $$(".eyebrow, .section-lead, .case__info > *, .svc__row, .tcard, .timeline li, .about__text p, .stack, .acc__item, .more__item, .footer__col, .footer__top-btn, .cta__lead, .cta__actions, .cta__phone, .stat, .faq__head .btn")
            .filter((el) => !el.closest(".hero") && !el.closest(".study"));
        gsap.set(targets, { y: 50, opacity: 0 });
        ScrollTrigger.batch(targets, {
            start: "top 90%",
            once: true,
            onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 1.1, stagger: 0.08, ease: "expo.out", overwrite: true }),
        });
    }

    function initWork() {
        const mm = gsap.matchMedia();
        mm.add("(min-width: 901px)", () => {
            const cases = $$(".case");
            cases.forEach((c, i) => {
                const card = $(".case__card", c);
                // Imagem e celular com paralaxe
                gsap.fromTo($(".case__phone", c), { y: 60 }, {
                    y: -40, ease: "none",
                    scrollTrigger: { trigger: c, start: "top bottom", end: "bottom top", scrub: true },
                });
                // O card anterior "recua" quando o próximo sobe por cima
                const next = cases[i + 1];
                if (!next) return;
                gsap.to(card, {
                    scale: 0.92, filter: "brightness(0.35)", ease: "none",
                    scrollTrigger: { trigger: next, start: "top 85%", end: "top 15%", scrub: true },
                });
            });
        });
        mm.add("(max-width: 900px)", () => {
            $$(".case__media").forEach((m) => {
                gsap.from(m, { clipPath: "inset(12% 12% 12% 12% round 20px)", duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: m, start: "top 85%" } });
            });
        });
    }

    function initProcess() {
        const mm = gsap.matchMedia();
        mm.add("(min-width: 901px)", () => {
            const section = $(".process");
            const track = $(".process__track");
            const bar = $(".process__bar span");
            const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: section, start: "top top", end: () => `+=${distance() + window.innerHeight * 0.3}`,
                    pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
                },
            });
            tl.to(track, { x: () => -distance(), ease: "none" }, 0).to(bar, { scaleX: 1, ease: "none" }, 0);
            $$(".step").forEach((step) => {
                gsap.from($(".step__num", step), {
                    yPercent: 40, opacity: 0, ease: "none",
                    scrollTrigger: { trigger: step, containerAnimation: tl, start: "left 95%", end: "left 60%", scrub: true },
                });
            });
        });
        mm.add("(max-width: 900px)", () => {
            gsap.from(".step", { y: 50, opacity: 0, duration: 1, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: ".process__track", start: "top 85%" } });
        });
    }

    function initAbout() {
        const img = $(".about__photo img");
        gsap.fromTo(img, { clipPath: "inset(30% 30% 30% 30% round 24px)", scale: 1.25 }, {
            clipPath: "inset(0% 0% 0% 0% round 24px)", scale: 1, duration: 1.6, ease: "expo.out",
            scrollTrigger: { trigger: ".about", start: "top 70%" },
        });
    }

    function initFooter() {
        const big = $(".footer__big");
        const split = SplitText.create(big, { type: "chars", charsClass: "char" });
        gsap.from(split.chars, {
            yPercent: 100, opacity: 0, duration: 1.2, stagger: 0.05, ease: "expo.out",
            scrollTrigger: { trigger: big, start: "top 95%" },
        });
    }

    function initProgress() {
        gsap.to(".progress span", {
            scaleX: 1, ease: "none",
            scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
        });
    }

    /* ----------------------------------------------------------------------
       Inicialização
       ---------------------------------------------------------------------- */
    function boot() {
        initClock();
        initCopy();
        initAccordion();
        initHeader();
        initMenu();
        initStudy();

        if (!animate) {
            markReady();
            initAnchors();
            document.documentElement.classList.add("no-preloader");
            return;
        }

        gsap.registerPlugin(ScrollTrigger, SplitText);
        initLenis();
        initAnchors();
        initCursor();
        initMagnetic();
        initMorePreview();

        const startAnimations = (delay) => {
            heroIntro(delay);
            initMarquee();
            initStatement();
            initCounters();
            initTitles();
            initReveals();
            initWork();
            initProcess();
            initAbout();
            initFooter();
            initProgress();
            ScrollTrigger.refresh();
        };

        // Rede de segurança: nunca deixa o topo invisível se algo atrasar
        setTimeout(markReady, 4000);

        // Espera as fontes para medir as linhas do texto corretamente
        const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
        fontsReady.then(() => runPreloader(startAnimations));
        window.addEventListener("load", () => ScrollTrigger.refresh());
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
})();
