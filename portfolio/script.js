/* ==========================================================
   PORTFÓLIO - SCRIPT PRINCIPAL
   Carregado com "defer": o HTML já está pronto quando roda,
   então não precisa de DOMContentLoaded.
========================================================== */

"use strict";

// Usuário pediu menos movimento no sistema?
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Espera X milissegundos (usado na digitação)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


/* ==========================================================
   ANIMAÇÕES DE ENTRADA (GERAL)
========================================================== */

function initEntranceAnimations() {

    const animatedElements = document.querySelectorAll(".fade-in, .slide-up");

    setTimeout(() => {
        animatedElements.forEach(el => el.classList.add("visible"));
    }, 100);
}


/* ==========================================================
   SECTION 1 - HERO
   Digitação + descrição + estatísticas
========================================================== */

function initHero() {

    const typingText = document.getElementById("typing-text");
    const description = document.querySelector(".description");
    const stats = document.querySelectorAll(".stat-item");

    if (!typingText) return;

    // Escreve o texto usando textContent + <br> criado via DOM (sem innerHTML)
    function render(text) {

        const lines = text.split("\n");
        const fragment = document.createDocumentFragment();

        lines.forEach((line, index) => {
            if (index > 0) fragment.appendChild(document.createElement("br"));
            fragment.appendChild(document.createTextNode(line));
        });

        typingText.replaceChildren(fragment);
    }

    // ---------- Digita texto ----------
    async function typeText(text, speed = 80, onChar) {

        for (let i = 1; i <= text.length; i++) {
            render(text.slice(0, i));
            if (onChar) onChar(i);
            await sleep(speed);
        }
    }

    // ---------- Apaga texto ----------
    async function eraseText(text, speed = 40) {

        for (let i = text.length - 1; i >= 0; i--) {
            render(text.slice(0, i));
            await sleep(speed);
        }
    }

    // ---------- Contador das estatísticas ----------
    function animateCounter(counter) {

        const target = parseInt(counter.dataset.target, 10) || 0;

        if (reducedMotion.matches) {
            counter.textContent = target;
            return;
        }

        let current = 0;
        const increment = target / 120;

        function updateCounter() {

            current += increment;

            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        }

        updateCounter();
    }

    // ---------- Mostra as estatísticas em sequência ----------
    function showStatsSequentially() {

        stats.forEach((item, index) => {

            setTimeout(() => {
                item.classList.add("show");
                animateCounter(item.querySelector(".stat-number"));
            }, reducedMotion.matches ? 0 : index * 500);
        });
    }

    const firstText = "Olá, eu me chamo\nGabriel";
    const finalText = "Desenvolvedor\nFront-end";

    // Sem animação: mostra direto o estado final
    if (reducedMotion.matches) {
        render(finalText);
        description.classList.add("show");
        showStatsSequentially();
        return;
    }

    // ---------- Animação principal da Hero ----------
    async function startHeroAnimation() {

        await typeText(firstText);
        await sleep(2000);

        await eraseText(firstText);
        await sleep(500);

        // Mostra a descrição logo no começo da segunda digitação
        await typeText(finalText, 80, i => {
            if (i === 4) description.classList.add("show");
        });

        await sleep(200);
        showStatsSequentially();
    }

    startHeroAnimation();
}


/* ==========================================================
   HEADER INTELIGENTE + MENU MOBILE
   - Some ao descer, aparece ao subir
   - Ganha fundo com blur ao rolar
   - Menu hambúrguer no celular
========================================================== */

function initHeader() {

    const header = document.querySelector(".site-header");
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.getElementById("site-nav");

    if (!header) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    // ---------- Menu mobile ----------
    function setMenu(open) {
        header.classList.toggle("menu-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    }

    if (toggle && nav) {

        toggle.addEventListener("click", () => {
            setMenu(!header.classList.contains("menu-open"));
        });

        // Fecha ao clicar em um link
        nav.addEventListener("click", e => {
            if (e.target.closest("a")) setMenu(false);
        });

        // Fecha com ESC e devolve o foco ao botão
        document.addEventListener("keydown", e => {
            if (e.key === "Escape" && header.classList.contains("menu-open")) {
                setMenu(false);
                toggle.focus();
            }
        });

        // Fecha se a tela crescer para o layout desktop
        window.matchMedia("(min-width: 1101px)").addEventListener("change", e => {
            if (e.matches) setMenu(false);
        });
    }

    // ---------- Scroll ----------
    function updateHeader() {

        const currentScrollY = window.scrollY;

        header.classList.toggle("header-scrolled", currentScrollY > 40);

        // Descendo → esconde | Subindo → mostra (nunca esconde com o menu aberto)
        const goingDown = currentScrollY > lastScrollY && currentScrollY > 120;
        const menuOpen = header.classList.contains("menu-open");

        header.classList.toggle("header-hidden", goingDown && !menuOpen);

        lastScrollY = currentScrollY;
        ticking = false;
    }

    window.addEventListener("scroll", () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(updateHeader);
        }
    }, { passive: true });

    // Se um elemento dentro do header receber foco pelo teclado, mostra o header
    header.addEventListener("focusin", () => header.classList.remove("header-hidden"));

    updateHeader();
}


/* ==========================================================
   BOLINHA DO MOUSE
   Só anima enquanto ela ainda está se movendo
========================================================== */

function initMouseBall() {

    const ball = document.querySelector(".mouse-ball");

    // Só em dispositivos com mouse de verdade
    const hasMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (!ball || !hasMouse) return;

    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let running = false;
    let started = false;

    function place() {
        ball.style.transform =
            `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
    }

    function animate() {

        // Movimento suave (perseguindo)
        currentX += (mouseX - currentX) * 0.16;
        currentY += (mouseY - currentY) * 0.16;

        place();

        // Parou de se mover? Para o loop
        if (Math.abs(mouseX - currentX) < 0.1 && Math.abs(mouseY - currentY) < 0.1) {
            currentX = mouseX;
            currentY = mouseY;
            place();
            running = false;
            return;
        }

        requestAnimationFrame(animate);
    }

    document.addEventListener("mousemove", e => {

        mouseX = e.clientX;
        mouseY = e.clientY;

        // Primeiro movimento: nasce já no lugar do mouse
        if (!started) {
            started = true;
            currentX = mouseX;
            currentY = mouseY;
            place();
            ball.classList.add("is-visible");
            return;
        }

        if (reducedMotion.matches) {
            currentX = mouseX;
            currentY = mouseY;
            place();
            return;
        }

        if (!running) {
            running = true;
            requestAnimationFrame(animate);
        }
    }, { passive: true });

    // Mouse saiu da janela: esconde
    document.documentElement.addEventListener("mouseleave", () => {
        ball.classList.remove("is-visible");
        started = false;
    });
}


/* ==========================================================
   MODAIS (<dialog>) - ABRIR / FECHAR COM ANIMAÇÃO
   showModal() já resolve: ESC, foco preso, camada superior
   e devolução do foco ao botão que abriu.
========================================================== */

function openDialog(dialog) {
    dialog.classList.remove("is-closing");
    if (!dialog.open) dialog.showModal();
}

function closeDialog(dialog) {

    if (!dialog.open || dialog.classList.contains("is-closing")) return;

    dialog.classList.add("is-closing");

    // Espera a animação de saída terminar (se houver) e fecha de verdade
    const animations = dialog.getAnimations();

    Promise.allSettled(animations.map(a => a.finished)).then(() => {
        if (dialog.classList.contains("is-closing")) dialog.close();
    });
}

function setupDialog(dialog) {

    let pressedOnBackdrop = false;

    // Clique fora do conteúdo (no próprio dialog = área do fundo) fecha.
    // Confere onde o clique COMEÇOU para não fechar ao arrastar uma seleção.
    dialog.addEventListener("pointerdown", e => {
        pressedOnBackdrop = e.target === dialog;
    });

    dialog.addEventListener("click", e => {
        if (e.target === dialog && pressedOnBackdrop) closeDialog(dialog);
        pressedOnBackdrop = false;
    });

    // ESC: troca o fechamento instantâneo pelo animado
    dialog.addEventListener("cancel", e => {
        e.preventDefault();
        closeDialog(dialog);
    });

    // Limpa o estado quando fechar (por qualquer caminho)
    dialog.addEventListener("close", () => {
        dialog.classList.remove("is-closing");
    });
}


/* ==========================================================
   SECTION 3 - PROJETOS
   Desktop: rolagem vertical vira movimento horizontal.
   A altura da seção é calculada pela largura real dos cards.
   Celular: lista vertical (sem JS).
========================================================== */

function initProjects() {

    const section = document.querySelector(".projects-section");
    const sticky = document.querySelector(".projects-sticky");
    const track = document.querySelector(".projects-track");

    if (!section || !sticky || !track) return;

    const desktop = window.matchMedia("(min-width: 901px)");

    let maxHorizontal = 0;
    let currentX = 0;
    let targetX = 0;
    let running = false;
    let enabled = false;

    function applyTransform() {
        track.style.transform = `translate3d(${-currentX}px, 0, 0)`;
    }

    // ---------- Mede o quanto precisa andar na horizontal ----------
    function measure() {

        if (!desktop.matches) {
            // Celular: desliga o efeito e limpa estilos do JS
            enabled = false;
            section.style.height = "";
            track.style.transform = "";
            currentX = targetX = 0;
            return;
        }

        enabled = true;

        // Fim real = borda direita da última imagem + margem lateral
        const lastCard = track.lastElementChild;
        const lastImage = lastCard.querySelector(".project-image") || lastCard;
        const gutter = parseFloat(getComputedStyle(track).paddingLeft) || 0;
        const contentEnd = lastCard.offsetLeft + lastImage.offsetWidth + gutter;

        maxHorizontal = Math.max(0, contentEnd - track.clientWidth);

        // 1px de rolagem vertical = 1px de movimento horizontal
        section.style.height = `${window.innerHeight + maxHorizontal}px`;

        updateTarget();
        currentX = targetX;
        applyTransform();
    }

    // ---------- Converte a rolagem em posição horizontal ----------
    function updateTarget() {

        if (!enabled) return;

        const rect = section.getBoundingClientRect();
        const maxVertical = section.offsetHeight - window.innerHeight;
        const progress = maxVertical > 0
            ? Math.min(1, Math.max(0, -rect.top / maxVertical))
            : 0;

        targetX = progress * maxHorizontal;
    }

    // ---------- Anima só até chegar no alvo ----------
    function animate() {

        currentX += (targetX - currentX) * 0.07;

        if (Math.abs(targetX - currentX) < 0.5) {
            currentX = targetX;
            applyTransform();
            running = false;
            return;
        }

        applyTransform();
        requestAnimationFrame(animate);
    }

    function onScroll() {

        if (!enabled) return;

        updateTarget();

        if (reducedMotion.matches) {
            currentX = targetX;
            applyTransform();
            return;
        }

        if (!running) {
            running = true;
            requestAnimationFrame(animate);
        }
    }

    // ---------- Teclado: Tab em um card fora da tela ----------
    // Rola a página até o ponto em que aquele card aparece
    track.addEventListener("focusin", e => {

        // O navegador pode ter rolado o container escondido: desfaz
        sticky.scrollLeft = 0;

        // Só para foco de teclado (clique do mouse não deve rolar a página)
        if (!enabled || !e.target.matches(":focus-visible")) return;

        const card = e.target.closest(".project-card");
        if (!card) return;

        const gutter = parseFloat(getComputedStyle(track).paddingLeft) || 0;
        const wanted = Math.min(maxHorizontal, Math.max(0, card.offsetLeft - gutter));
        const sectionTop = section.getBoundingClientRect().top + window.scrollY;

        window.scrollTo({ top: sectionTop + wanted, behavior: "instant" });

        targetX = currentX = wanted;
        applyTransform();
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    desktop.addEventListener("change", measure);

    // Fontes mudam a largura dos títulos: mede de novo quando carregarem
    if (document.fonts) document.fonts.ready.then(measure);

    measure();
}


/* ==========================================================
   MODAL DOS PROJETOS
========================================================== */

function initProjectModal() {

    const modal = document.getElementById("modalProjeto");

    if (!modal) return;

    const fechar = document.getElementById("modalFechar");
    const titulo = document.getElementById("modalTitulo");
    const descricao = document.getElementById("modalDescricao");
    const img = document.getElementById("modalImg");
    const techList = document.getElementById("modalTech");
    const link = document.getElementById("modalLink");
    const repo = document.getElementById("modalRepo");

    setupDialog(modal);

    document.querySelectorAll(".btn-ver-mais").forEach(botao => {

        botao.addEventListener("click", () => {

            const data = botao.dataset;

            titulo.textContent = data.title;
            descricao.textContent = data.desc;
            img.src = data.img;
            img.alt = `Captura de tela: ${data.title}`;
            link.href = data.link;
            repo.href = data.repo;

            // Cria as tags de tecnologias
            const items = data.tech.split("|").map(tech => {
                const li = document.createElement("li");
                li.textContent = tech;
                return li;
            });

            techList.replaceChildren(...items);

            openDialog(modal);
        });
    });

    fechar.addEventListener("click", () => closeDialog(modal));
}


/* ==========================================================
   SECTION 4 - SKILLS (modal com <dialog>)
========================================================== */

function initSkills() {

    const dialog = document.getElementById("skill-detail");
    const closeBtn = document.getElementById("skill-close-btn");
    const skillIcons = document.querySelectorAll(".skill-icon");

    const detailIconBox = document.getElementById("skill-detail-icon-box");
    const detailIcon = document.getElementById("skill-detail-icon");
    const detailTitle = document.getElementById("skill-detail-title");
    const detailDesc = document.getElementById("skill-detail-desc");
    const detailTag = document.getElementById("skill-detail-tag");
    const sidebarList = document.getElementById("skill-sidebar-list");

    if (!dialog) return;

    // ---------- Dados das skills ----------
    const skillsData = {
        html: {
            icon: "fa-brands fa-html5",
            color: "#e34c26",
            tag: "MARKUP",
            title: "HTML5",
            desc: "Estruturação semântica de páginas web modernas, com foco em acessibilidade, SEO e boas práticas de marcação."
        },
        css: {
            icon: "fa-brands fa-css3-alt",
            color: "#1572b6",
            tag: "ESTILIZAÇÃO",
            title: "CSS3",
            desc: "Estilização avançada com Flexbox, Grid, animações, responsividade e efeitos visuais modernos."
        },
        js: {
            icon: "fa-brands fa-js",
            color: "#f7df1e",
            tag: "LINGUAGEM",
            title: "JavaScript",
            desc: "Desenvolvimento de aplicações interativas, manipulação do DOM, consumo de APIs e boas práticas com ES6+."
        },
        react: {
            icon: "fa-brands fa-react",
            color: "#61dafb",
            tag: "FRAMEWORK",
            title: "React",
            desc: "Criação de interfaces modernas com componentização, hooks, estado e integração com APIs."
        },
        node: {
            icon: "fa-brands fa-node-js",
            color: "#6cc24a",
            tag: "BACKEND",
            title: "Node.js",
            desc: "Desenvolvimento backend com APIs REST, autenticação, integração com bancos de dados e Express."
        },
        git: {
            icon: "fa-brands fa-git-alt",
            color: "#f05032",
            tag: "VERSIONAMENTO",
            title: "Git",
            desc: "Controle de versão profissional com Git e GitHub, branches, pull requests e trabalho em equipe."
        },
        python: {
            icon: "fa-brands fa-python",
            color: "#3776ab",
            tag: "LINGUAGEM",
            title: "Python",
            desc: "Linguagem versátil usada em automação, scripts, análise de dados e desenvolvimento back-end."
        },
        figma: {
            icon: "fa-brands fa-figma",
            color: "#a259ff",
            tag: "DESIGN",
            title: "Figma",
            desc: "Design de interfaces, prototipagem interativa e criação de sistemas visuais consistentes."
        }
    };

    setupDialog(dialog);

    // ---------- Monta a sidebar uma vez (botões) ----------
    const sidebarButtons = Object.entries(skillsData).map(([key, data]) => {

        const button = document.createElement("button");
        button.type = "button";
        button.className = "skill-sidebar-item";
        button.dataset.skill = key;

        const icon = document.createElement("i");
        icon.className = data.icon;
        icon.style.color = data.color;
        icon.setAttribute("aria-hidden", "true");

        const label = document.createElement("span");
        label.textContent = data.title;

        button.append(icon, label);
        button.addEventListener("click", () => {
            updateDetail(key);
            // O botão clicado some da lista: leva o foco para o título
            detailTitle.focus();
        });

        return button;
    });

    sidebarList.replaceChildren(...sidebarButtons);

    // ---------- Atualiza detalhes ----------
    function updateDetail(skillKey) {

        const data = skillsData[skillKey];
        if (!data) return;

        // Reinicia as animações de entrada
        const animated = [detailIconBox, detailTag, detailTitle, detailDesc];
        animated.forEach(el => { el.style.animation = "none"; });
        void detailIconBox.offsetWidth;

        detailIcon.className = "skill-detail-icon " + data.icon;
        detailIcon.style.color = data.color;
        detailTag.textContent = data.tag;
        detailTitle.textContent = data.title;
        detailDesc.textContent = data.desc;

        animated.forEach(el => { el.style.animation = ""; });

        // Esconde da sidebar a skill que está aberta
        sidebarButtons.forEach(button => {
            button.hidden = button.dataset.skill === skillKey;
        });
    }

    // ---------- Eventos ----------
    skillIcons.forEach(icon => {
        icon.addEventListener("click", () => {
            updateDetail(icon.dataset.skill);
            openDialog(dialog);
        });
    });

    closeBtn.addEventListener("click", () => closeDialog(dialog));
}


/* ==========================================================
   SECTION 5 - EXPERIÊNCIA
   Timeline animada com scroll
========================================================== */

function initExperienceTimeline() {

    const timeline = document.querySelector(".experience-timeline");
    const timelineItems = Array.from(document.querySelectorAll(".timeline-item"));

    if (!timeline || timelineItems.length === 0) return;

    let start = 0;
    let end = 1;
    let dots = [];
    let ticking = false;

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // ---------- Calcula posições da timeline ----------
    function calculateTimelinePositions() {

        const scrollY = window.scrollY;
        const timelineTop = timeline.getBoundingClientRect().top + scrollY;

        start = timelineTop - window.innerHeight * 0.78;
        end = timelineTop + timeline.offsetHeight - window.innerHeight * 0.42;

        dots = timelineItems.map(item => {
            const dotRect = item.querySelector(".timeline-dot").getBoundingClientRect();
            return {
                item: item,
                y: dotRect.top + scrollY + dotRect.height / 2
            };
        });

        updateTimeline();
    }

    // ---------- Atualiza a timeline no scroll ----------
    function updateTimeline() {

        ticking = false;

        const scrollY = window.scrollY;
        const progress = clamp((scrollY - start) / Math.max(1, end - start), 0, 1);

        timeline.style.setProperty("--timeline-progress", progress.toFixed(4));

        // Quando a bolinha passa do centro da tela, o item aparece
        const screenCenter = scrollY + window.innerHeight * 0.52;

        dots.forEach(({ item, y }) => {
            const reached = screenCenter >= y;
            item.classList.toggle("show", reached);
            item.classList.toggle("is-active", reached);
        });
    }

    window.addEventListener("scroll", () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(updateTimeline);
        }
    }, { passive: true });

    window.addEventListener("resize", () => {
        requestAnimationFrame(calculateTimelinePositions);
    });

    window.addEventListener("load", calculateTimelinePositions);

    if (document.fonts) {
        document.fonts.ready.then(calculateTimelinePositions);
    }

    calculateTimelinePositions();
}


/* ==========================================================
   SECTION 6 - FORMULÁRIO DE CONTATO
   - Com data-endpoint (Formspree/Web3Forms): envia via fetch
   - Sem endpoint: abre o app de e-mail com tudo preenchido
========================================================== */

function initContactForm() {

    const form = document.getElementById("contact-form");
    const status = document.getElementById("form-status");

    if (!form || !status) return;

    const submitButton = form.querySelector('button[type="submit"]');

    function setStatus(message, type) {
        status.textContent = message;
        status.classList.toggle("is-error", type === "error");
        status.classList.toggle("is-success", type === "success");
    }

    form.addEventListener("submit", async e => {

        // Nunca recarrega a página
        e.preventDefault();

        const nome = form.elements.nome.value.trim();
        const email = form.elements.email.value.trim();
        const mensagem = form.elements.mensagem.value.trim();

        // "required" aceita só espaços: confere de novo sem eles
        if (!nome || !email || mensagem.length < 10 || !form.checkValidity()) {
            setStatus("Preencha nome, um e-mail válido e uma mensagem com pelo menos 10 caracteres.", "error");
            const firstInvalid = [...form.elements].find(el =>
                (el.value !== undefined && el.required && (!el.value.trim() || !el.checkValidity()))
            );
            if (firstInvalid) firstInvalid.focus();
            return;
        }

        const endpoint = form.dataset.endpoint;

        // ---------- Envio por serviço (Formspree/Web3Forms) ----------
        if (endpoint) {

            submitButton.disabled = true;
            setStatus("Enviando...", null);

            try {
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: { Accept: "application/json" },
                    body: new FormData(form)
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                form.reset();
                setStatus("Mensagem enviada! Respondo em breve.", "success");

            } catch (error) {
                setStatus("Não foi possível enviar agora. Tente novamente ou use o e-mail ao lado.", "error");
            } finally {
                submitButton.disabled = false;
            }

            return;
        }

        // ---------- Fallback: mailto preenchido ----------
        const to = form.dataset.email;
        const subject = encodeURIComponent(`Contato pelo portfólio - ${nome}`);
        const body = encodeURIComponent(`${mensagem}\n\n${nome}\n${email}`);

        window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;

        setStatus("Abrindo seu aplicativo de e-mail com a mensagem pronta...", "success");
    });
}


/* ==========================================================
   FOOTER - ANO DINÂMICO
========================================================== */

function initFooterYear() {
    const year = document.getElementById("footer-year");
    if (year) year.textContent = new Date().getFullYear();
}


/* ==========================================================
   INICIALIZAÇÃO
   Projetos antes da timeline: a altura da seção de projetos
   muda a posição de tudo que vem depois.
========================================================== */

initEntranceAnimations();
initHero();
initHeader();
initMouseBall();
initProjects();
initProjectModal();
initSkills();
initExperienceTimeline();
initContactForm();
initFooterYear();
