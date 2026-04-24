(function () {
  "use strict";

  const projectsData = [
    {
      title: "Internal Team Product (CloudTechtiq)",
      description:
        "Designed and developed a new internal product at CloudTechtiq, streamlining team workflows and improving operational efficiency.",
      tags: ["Django", "Python", "React", "PostgreSQL", "CI/CD"],
      projectLink: "https://cloudtechtiq.com/",
      imageUrl: "public/cloudtechtiq.png",
    },
    {
      title: "Rosterly (Radixlink)",
      description:
        "Contributed to the core development of Rosterly.io at Radixlink, enhancing existing features and implementing new functionalities to improve the overall product.",
      tags: ["Django", "Python", "JavaScript", "React", "PostgreSQL"],
      projectLink: "https://rosterly.io/",
      imageUrl: "public/rosterly.png",
    },
    {
      title: "Articify",
      description:
        "Developed an open-source AI-powered web app for automated article summarization, streamlining the reading experience.",
      tags: ["React", "Redux", "Vite", "Tailwind", "TypeScript"],
      projectLink: "https://articify.rajpoot.dev/",
      imageUrl: "public/articify.png",
    },
  ];

  const experiencesData = [
    {
      title: "Full Stack Developer (CloudTechtiq)",
      location: "Jaipur, Rajasthan",
      description:
        "As a Full Stack Developer at CloudTechtiq, I specialize in building and optimizing scalable backend systems, ensuring seamless authentication, payment processing, and deployment automation. I have designed and implemented multi-tenant architectures with MFA authentication, dynamic configuration management, and automated invoicing to enhance security and flexibility. My role also involves integrating payment gateways such as Razorpay, PayPal, and Stripe, managing multi-webhook processing, and streamlining CI/CD pipelines for efficient deployments. Additionally, I optimize cloud infrastructure to improve performance, scalability, and cost efficiency while maintaining high system reliability.",
      icon: "code",
      date: "October, 2024 - present",
    },
    {
      title: "Full Stack Developer (Radixlink)",
      location: "Chandler, Arizona",
      description:
        "As a Full Stack Developer at Radixlink, I design and build scalable web applications, working closely with cross-functional teams to deliver high-quality software solutions. My role involves developing both front-end and back-end components, ensuring smooth integration and optimal performance. I also participate in code reviews, contribute to technical documentation, and mentor junior developers. This position allows me to utilize my expertise in various technologies, enhance my problem-solving skills, and stay updated with industry trends to continuously improve our development processes.",
      icon: "code",
      date: "June, 2023 - September, 2024",
    },
    {
      title: "BCA (Bachelor of Computer Applications)",
      location: "Jhansi, Uttar Pradesh",
      description:
        "I am currently pursuing my BCA degree at Chandra Sekhar Azad Institute of Science and Technology, which began in 2021 and is expected to conclude in 2024. This program is allowing me to further develop my skills and knowledge in the field of computer applications.",
      icon: "cap",
      date: "2021 - 2024",
    },
    {
      title: "Higher Secondary (Class 11 - Class 12)",
      location: "Jhansi, Uttar Pradesh",
      description:
        "I continued my education at Government Inter College for Class 11 and Class 12, where I further honed my passion for computer science and programming.",
      icon: "cap",
      date: "2020",
    },
    {
      title: "High School (Class 9 - Class 10)",
      location: "Jhansi, Uttar Pradesh",
      description:
        "I was a student at Modern Public School from Class 9 to Class 12, and it was during this time that I discovered my deep interest in computers and programming.",
      icon: "cap",
      date: "2018",
    },
  ];

  const skillsData = [
    "HTML",
    "CSS",
    "JavaScript",
    "TypeScript",
    "Python",
    "React",
    "Next.js",
    "Tailwind CSS",
    "Redux",
    "Framer Motion",
    "Node.js",
    "Django",
    "Django Rest Framework",
    "FastAPI",
    "Express",
    "MongoDB",
    "PostgreSQL",
    "MySQL",
    "GraphQL",
    "Supabase",
    "Vercel",
    "AWS",
    "Git",
    "Vite",
    "ESLint",
    "Prettier",
    "Linux",
    "Jira",
    "JWT",
    "Docker",
    "Kubernetes",
    "GitHub Actions",
    "Docker Compose",
    "CI/CD",
  ];

  const icons = {
    code:
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
    cap:
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6"></path><path d="M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 1.5 9 1.5 12 0v-5"></path></svg>',
  };

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderProjects() {
    const container = document.getElementById("project-list");
    if (!container) return;
    const fragments = projectsData.map(function (project) {
      const tags = project.tags
        .map(function (tag) {
          return '<li class="project-tag">' + escapeHtml(tag) + "</li>";
        })
        .join("");
      return (
        '<a class="project-card" href="' +
        escapeHtml(project.projectLink) +
        '" target="_blank" rel="noopener noreferrer">' +
        '<div class="project-body">' +
        '<h3 class="project-title">' +
        escapeHtml(project.title) +
        "</h3>" +
        '<p class="project-desc">' +
        escapeHtml(project.description) +
        "</p>" +
        '<ul class="project-tags">' +
        tags +
        "</ul>" +
        "</div>" +
        '<img class="project-image" src="' +
        escapeHtml(project.imageUrl) +
        '" alt="' +
        escapeHtml(project.title) +
        '" loading="lazy" />' +
        "</a>"
      );
    });
    container.innerHTML = fragments.join("");
  }

  function renderSkills() {
    const container = document.getElementById("skill-list");
    if (!container) return;
    container.innerHTML = skillsData
      .map(function (skill) {
        return '<li class="skill-item">' + escapeHtml(skill) + "</li>";
      })
      .join("");
  }

  function renderTimeline() {
    const container = document.getElementById("timeline");
    if (!container) return;
    container.innerHTML = experiencesData
      .map(function (item) {
        return (
          '<div class="timeline-item">' +
          '<div class="timeline-icon">' +
          (icons[item.icon] || "") +
          "</div>" +
          '<div class="timeline-content">' +
          '<h3 class="timeline-title">' +
          escapeHtml(item.title) +
          "</h3>" +
          '<p class="timeline-location">' +
          escapeHtml(item.location) +
          "</p>" +
          '<p class="timeline-description">' +
          escapeHtml(item.description) +
          "</p>" +
          '<span class="timeline-date">' +
          escapeHtml(item.date) +
          "</span>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function setupYear() {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  function setupTheme() {
    const toggle = document.getElementById("theme-toggle");
    const root = document.documentElement;

    function safeGet(key) {
      try {
        return window.localStorage.getItem(key);
      } catch (_) {
        return null;
      }
    }
    function safeSet(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (_) {}
    }

    const stored = safeGet("theme");
    if (stored === "dark") {
      root.classList.add("dark");
    } else if (
      !stored &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      root.classList.add("dark");
    }

    if (!toggle) return;
    toggle.addEventListener("click", function () {
      const isDark = root.classList.toggle("dark");
      safeSet("theme", isDark ? "dark" : "light");
    });
  }

  function setupActiveSection() {
    const links = document.querySelectorAll(".nav-link");
    const sections = Array.from(document.querySelectorAll("main .section"));
    if (!links.length || !sections.length) return;

    let timeOfLastClick = 0;

    links.forEach(function (link) {
      link.addEventListener("click", function () {
        timeOfLastClick = Date.now();
        const section = link.getAttribute("data-section");
        setActive(section);
      });
    });

    function setActive(name) {
      links.forEach(function (link) {
        if (link.getAttribute("data-section") === name) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });
    }

    const idToName = {
      home: "Home",
      about: "About",
      projects: "Projects",
      skills: "Skills",
      experience: "Experience",
      contact: "Contact",
    };

    const observer = new IntersectionObserver(
      function (entries) {
        if (Date.now() - timeOfLastClick < 1000) return;
        const visible = entries
          .filter(function (e) {
            return e.isIntersecting;
          })
          .sort(function (a, b) {
            return b.intersectionRatio - a.intersectionRatio;
          });
        if (visible.length) {
          const id = visible[0].target.id;
          if (idToName[id]) setActive(idToName[id]);
        }
      },
      {
        rootMargin: "-40% 0px -40% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    sections.forEach(function (section) {
      if (section.id) observer.observe(section);
    });

    setActive("Home");
  }

  function setupRevealOnScroll() {
    const targets = document.querySelectorAll(
      ".fade-in-on-view, .project-card, .skill-item, .timeline-item"
    );
    if (!targets.length || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) {
        el.classList.add("visible");
      });
      return;
    }
    const observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  function showToast(message, kind) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "toast" + (kind === "error" ? " error" : "");
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function () {
      toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-8px)";
      setTimeout(function () {
        toast.remove();
      }, 300);
    }, 3500);
  }

  function setupContactForm() {
    const form = document.getElementById("contact-form");
    if (!form) return;
    const submitBtn = form.querySelector(".btn-submit");
    const submitLabel = form.querySelector(".btn-submit-label");
    const plane = form.querySelector(".icon-plane");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const email = form.elements["senderEmail"].value.trim();
      const message = form.elements["message"].value.trim();

      if (!email || email.length > 500 || !/^\S+@\S+\.\S+$/.test(email)) {
        showToast("Please enter a valid email address.", "error");
        return;
      }
      if (!message || message.length > 5000) {
        showToast("Please enter a message (up to 5000 characters).", "error");
        return;
      }

      submitBtn.disabled = true;
      const originalLabel = submitLabel ? submitLabel.textContent : "";
      if (submitLabel) submitLabel.textContent = "";
      if (plane) plane.classList.add("hidden");
      const spinner = document.createElement("span");
      spinner.className = "spinner";
      submitBtn.appendChild(spinner);

      const subject = "Message from contact form";
      const body = message + "\n\n— " + email;
      const mailto =
        "mailto:manvendra@rajpoot.dev?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(body);

      setTimeout(function () {
        window.location.href = mailto;
        spinner.remove();
        if (submitLabel) submitLabel.textContent = originalLabel || "Submit";
        if (plane) plane.classList.remove("hidden");
        submitBtn.disabled = false;
        showToast("Opening your email client…");
        form.reset();
      }, 400);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderProjects();
    renderSkills();
    renderTimeline();
    setupYear();
    setupTheme();
    setupActiveSection();
    setupRevealOnScroll();
    setupContactForm();
  });
})();
