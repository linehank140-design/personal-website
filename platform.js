(function bootstrapPlatform() {
  "use strict";

  var STORAGE_KEY = "katie-platform-content-v2";

  function cloneValue(value) {
    if (value === undefined) {
      return undefined;
    }
    return JSON.parse(JSON.stringify(value));
  }

  function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function mergeDeep(base, override) {
    if (Array.isArray(base)) {
      if (Array.isArray(override)) {
        return cloneValue(override);
      }
      return cloneValue(base);
    }

    if (isRecord(base)) {
      var baseKeys = Object.keys(base);
      var overrideObject = isRecord(override) ? override : {};
      var result = {};

      baseKeys.forEach(function assignBaseKey(key) {
        result[key] = mergeDeep(base[key], overrideObject[key]);
      });

      Object.keys(overrideObject).forEach(function assignExtraKey(key) {
        if (!Object.prototype.hasOwnProperty.call(result, key)) {
          result[key] = cloneValue(overrideObject[key]);
        }
      });

      return result;
    }

    if (override === undefined) {
      return cloneValue(base);
    }

    return cloneValue(override);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getDefaults() {
    return cloneValue(window.siteContentDefaults || {});
  }

  function getContent() {
    var defaults = getDefaults();
    var raw;

    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return defaults;
    }

    if (!raw) {
      return defaults;
    }

    try {
      var parsed = JSON.parse(raw);
      return mergeDeep(defaults, parsed);
    } catch (error) {
      return defaults;
    }
  }

  function saveContent(content) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(content, null, 2));
  }

  function resetContent() {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function setTextContent(id, value) {
    var element = document.getElementById(id);
    if (!element) {
      return;
    }
    element.textContent = value || "";
  }

  function setHtmlContent(id, html) {
    var element = document.getElementById(id);
    if (!element) {
      return;
    }
    element.innerHTML = html || "";
  }

  function setAnchor(id, label, href) {
    var anchor = document.getElementById(id);
    if (!anchor) {
      return;
    }

    anchor.textContent = label || "";
    if (href) {
      anchor.href = href;
    }
  }

  function renderParagraphs(id, paragraphs) {
    var container = document.getElementById(id);
    if (!container || !Array.isArray(paragraphs)) {
      return;
    }

    container.innerHTML = paragraphs
      .map(function toParagraph(text) {
        return "<p>" + escapeHtml(text) + "</p>";
      })
      .join("");
  }

  function renderList(id, items) {
    var list = document.getElementById(id);
    if (!list || !Array.isArray(items)) {
      return;
    }

    list.innerHTML = items
      .map(function toListItem(item) {
        return "<li>" + escapeHtml(item) + "</li>";
      })
      .join("");
  }

  function renderDefinitionList(id, items) {
    var list = document.getElementById(id);
    if (!list || !Array.isArray(items)) {
      return;
    }

    list.innerHTML = items
      .map(function toListItem(item) {
        return (
          "<li><strong>" +
          escapeHtml(item.label || "") +
          ":</strong> " +
          escapeHtml(item.detail || "") +
          "</li>"
        );
      })
      .join("");
  }

  function renderHobbyChips(chipsId, descriptionId, hobbies) {
    var chipsContainer = document.getElementById(chipsId);
    var description = document.getElementById(descriptionId);
    if (!chipsContainer || !description) {
      return;
    }

    if (!Array.isArray(hobbies) || !hobbies.length) {
      chipsContainer.innerHTML = "";
      description.textContent = "";
      description.style.display = "none";
      return;
    }

    description.style.display = "";
    var activeIndex = 0;

    function updateActiveState() {
      var buttons = chipsContainer.querySelectorAll(".chip");
      buttons.forEach(function onEachButton(button, index) {
        button.classList.toggle("active", index === activeIndex);
      });

      var activeHobby = hobbies[activeIndex] || {};
      description.textContent = activeHobby.description || "";
    }

    chipsContainer.innerHTML = hobbies
      .map(function toChip(hobby, index) {
        var isActive = index === activeIndex ? " active" : "";
        return (
          "<button type=\"button\" class=\"chip" +
          isActive +
          "\" data-hobby-index=\"" +
          index +
          "\">" +
          escapeHtml(hobby.label || "") +
          "</button>"
        );
      })
      .join("");

    chipsContainer.querySelectorAll(".chip").forEach(function onChipClick(button) {
      button.addEventListener("click", function onClick() {
        var nextIndex = Number(button.getAttribute("data-hobby-index"));
        if (Number.isNaN(nextIndex)) {
          return;
        }
        activeIndex = nextIndex;
        updateActiveState();
      });
    });

    updateActiveState();
  }

  function applySharedContent(content) {
    var globalContent = (content && content.global) || {};
    var announcement = globalContent.announcement || {};

    setTextContent("announcementIntro", announcement.intro || "");
    setAnchor("announcementLink", announcement.linkText || "", announcement.linkUrl || "#");

    var footerName = document.getElementById("footerName");
    if (footerName) {
      footerName.textContent = globalContent.footerName || "";
    }

    var yearElement = document.getElementById("year");
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  }

  function initializeMobileNav() {
    var navToggle = document.querySelector(".nav__toggle");
    var mobileNavMenu = document.getElementById("mobileNavMenu");

    if (!navToggle || !mobileNavMenu) {
      return;
    }

    function setMobileMenu(open) {
      navToggle.setAttribute("aria-expanded", String(open));
      mobileNavMenu.classList.toggle("is-open", open);
    }

    navToggle.addEventListener("click", function onToggleClick() {
      var isOpen = navToggle.getAttribute("aria-expanded") === "true";
      setMobileMenu(!isOpen);
    });

    document.addEventListener("keydown", function onKeydown(event) {
      if (event.key === "Escape") {
        setMobileMenu(false);
      }
    });

    document.addEventListener("click", function onDocumentClick(event) {
      var target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!mobileNavMenu.contains(target) && !navToggle.contains(target)) {
        setMobileMenu(false);
      }
    });

    mobileNavMenu.querySelectorAll("a").forEach(function closeOnClick(link) {
      link.addEventListener("click", function onLinkClick() {
        setMobileMenu(false);
      });
    });
  }

  function renderKeyResultsSection(keyResults) {
    setTextContent("keyResultsTitle", keyResults.title || "");
    var keyResultsList = document.getElementById("keyResultsList");
    if (!keyResultsList || !Array.isArray(keyResults.metrics)) {
      return;
    }

    keyResultsList.innerHTML = keyResults.metrics
      .map(function toMetricCard(metric) {
        var value = metric.value || "";
        var valueClass = value.length > 10 ? " impactMetricCard__value--long" : "";

        return (
          "<article class=\"impactMetricCard\">" +
          "<p class=\"impactMetricCard__icon\" aria-hidden=\"true\">" + escapeHtml(metric.icon || "") + "</p>" +
          "<p class=\"impactMetricCard__value" + valueClass + "\">" + escapeHtml(value) + "</p>" +
          "<p class=\"impactMetricCard__label\">" + escapeHtml(metric.label || "") + "</p>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderCaseStudiesSection(caseStudies) {
    setTextContent("caseStudiesTitle", caseStudies.title || "");
    setTextContent("caseStudiesIntro", caseStudies.intro || "");
    setTextContent("caseStudiesBackToTop", caseStudies.backToTopLabel || "");

    var caseStudiesCards = document.getElementById("caseStudiesCards");
    if (!caseStudiesCards || !Array.isArray(caseStudies.items)) {
      return;
    }

    caseStudiesCards.innerHTML = caseStudies.items
      .map(function toCaseStudyCard(item) {
        var focusItems = Array.isArray(item.focus)
          ? item.focus
              .map(function toFocusRow(text) {
                return "<li>" + escapeHtml(text) + "</li>";
              })
              .join("")
          : "";

        var impactItems = Array.isArray(item.impact)
          ? item.impact
              .map(function toImpactRow(text) {
                return "<li><strong>" + escapeHtml(text) + "</strong></li>";
              })
              .join("")
          : "";

        var exampleItems = Array.isArray(item.examples)
          ? (
            "<div class=\"caseStudy__group\">" +
            "<h4 class=\"caseStudy__label\">Examples</h4>" +
            "<ul class=\"caseStudy__list caseStudy__list--examples\">" +
            item.examples
              .map(function toExampleRow(text) {
                return "<li>" + escapeHtml(text) + "</li>";
              })
              .join("") +
            "</ul>" +
            "</div>"
          )
          : "";

        return (
          "<article class=\"caseStudyCard\">" +
          "<header class=\"caseStudyCard__header\">" +
          "<h3 class=\"caseStudyCard__title\">" + escapeHtml(item.title || "") + "</h3>" +
          "<p class=\"caseStudyCard__subtitle\">" + escapeHtml(item.subtitle || "") + "</p>" +
          "</header>" +
          "<div class=\"caseStudy__group\">" +
          "<h4 class=\"caseStudy__label\">The challenge</h4>" +
          "<p class=\"caseStudy__text\">" + escapeHtml(item.challenge || "") + "</p>" +
          "</div>" +
          exampleItems +
          "<div class=\"caseStudy__group\">" +
          "<h4 class=\"caseStudy__label\">What I focused on</h4>" +
          "<ul class=\"caseStudy__list\">" + focusItems + "</ul>" +
          "</div>" +
          "<div class=\"caseStudy__group caseStudy__group--impact\">" +
          "<h4 class=\"caseStudy__label\">Impact</h4>" +
          "<ul class=\"caseStudy__list\">" + impactItems + "</ul>" +
          "</div>" +
          "<div class=\"caseStudy__group\">" +
          "<h4 class=\"caseStudy__label\">Why it mattered</h4>" +
          "<p class=\"caseStudy__text\">" + escapeHtml(item.whyItMattered || "") + "</p>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderPlatformsRetailersSection(platformsRetailers) {
    setTextContent("platformsRetailersTitle", platformsRetailers.title || "");
    setTextContent("platformsRetailersLede", platformsRetailers.lede || "");
    var platformsRetailersList = document.getElementById("platformsRetailersList");
    if (!platformsRetailersList || !Array.isArray(platformsRetailers.groups)) {
      return;
    }

    platformsRetailersList.innerHTML = platformsRetailers.groups
      .map(function toGroup(group) {
        var itemHtml = Array.isArray(group.items)
          ? group.items
              .map(function toItem(item) {
                var label = (item && item.name) || "";

                return (
                  "<article class=\"platformCard\">" +
                  "<span class=\"platformCard__label\">" +
                  escapeHtml(label) +
                  "</span>" +
                  "</article>"
                );
              })
              .join("")
          : "";

        return (
          "<section class=\"platformGroup\">" +
          "<h3 class=\"platformGroup__title\">" +
          escapeHtml(group.title || "") +
          "</h3>" +
          "<div class=\"platformGroup__grid\">" +
          itemHtml +
          "</div>" +
          "</section>"
        );
      })
      .join("");
  }

  function renderContactSection(contact, linkedInHref, emailHref) {
    setAnchor(
      "contactLinkedInLink",
      contact.linkedInLabel || "LinkedIn",
      linkedInHref
    );
    setAnchor("contactEmailLink", contact.emailLabel || "Email", emailHref);
    setTextContent("contactTitle", contact.title || "");
    setTextContent("contactLede", contact.lede || "");
  }

  function renderCapabilitiesToolsSection(capabilitiesTools) {
    setTextContent("capabilitiesToolsTitle", capabilitiesTools.title || "");

    var capabilitiesToolsGroups = document.getElementById("capabilitiesToolsGroups");
    if (!capabilitiesToolsGroups || !Array.isArray(capabilitiesTools.groups)) {
      return;
    }

    capabilitiesToolsGroups.innerHTML = capabilitiesTools.groups
      .map(function toCapabilityGroup(group) {
        var items = Array.isArray(group.items) ? group.items.slice(0, 6) : [];

        if (group.format === "tags") {
          var tagHtml = items
            .map(function toTag(item) {
              return "<span class=\"toolTag\">" + escapeHtml(item) + "</span>";
            })
            .join("");

          return (
            "<article class=\"skillsGroup\">" +
            "<h3>" +
            escapeHtml(group.title || "") +
            "</h3>" +
            "<div class=\"toolTags\" role=\"list\" aria-label=\"" +
            escapeHtml(group.title || "Tools") +
            "\">" +
            tagHtml +
            "</div>" +
            "</article>"
          );
        }

        var listHtml = items
          .map(function toListItem(item) {
            return "<li>" + escapeHtml(item) + "</li>";
          })
          .join("");

        return (
          "<article class=\"skillsGroup\">" +
          "<h3>" +
          escapeHtml(group.title || "") +
          "</h3>" +
          "<ul>" +
          listHtml +
          "</ul>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderCoursesCertificationsSection(coursesCertifications) {
    setTextContent("coursesCertificationsTitle", coursesCertifications.title || "");

    var cardsContainer = document.getElementById("coursesCertificationsCards");
    var modal = document.getElementById("courseModal");
    var modalTitle = document.getElementById("courseModalTitle");
    var modalProvider = document.getElementById("courseModalProvider");
    var modalYear = document.getElementById("courseModalYear");
    var modalDescription = document.getElementById("courseModalDescription");
    var modalLink = document.getElementById("courseModalLink");

    if (
      !cardsContainer ||
      !modal ||
      !modalTitle ||
      !modalProvider ||
      !modalYear ||
      !modalDescription ||
      !modalLink ||
      !Array.isArray(coursesCertifications.items)
    ) {
      return;
    }

    var items = coursesCertifications.items;

    cardsContainer.innerHTML = items
      .map(function toCourseCard(item, index) {
        return (
          "<button type=\"button\" class=\"courseCard\" data-course-index=\"" +
          index +
          "\">" +
          "<span class=\"courseCard__title\">" +
          escapeHtml(item.title || "") +
          "</span>" +
          "<span class=\"courseCard__provider\">" +
          escapeHtml(item.provider || "") +
          "</span>" +
          "</button>"
        );
      })
      .join("");

    function closeModal() {
      modal.hidden = true;
    }

    function openModal(item) {
      modalTitle.textContent = item.title || "";
      modalProvider.textContent = item.provider || "";
      modalYear.textContent = "Completion year: " + (item.completionYear || "");
      modalDescription.textContent = item.description || "";
      modalLink.href = item.certificationUrl || "#";
      modal.hidden = false;
    }

    cardsContainer.querySelectorAll(".courseCard").forEach(function onCardClick(button) {
      button.addEventListener("click", function handleClick() {
        var index = Number(button.getAttribute("data-course-index"));
        if (Number.isNaN(index) || !items[index]) {
          return;
        }
        openModal(items[index]);
      });
    });

    modal.querySelectorAll("[data-course-modal-close]").forEach(function onCloseTrigger(node) {
      node.addEventListener("click", function handleClose() {
        closeModal();
      });
    });

    document.addEventListener("keydown", function onModalKeydown(event) {
      if (event.key === "Escape" && !modal.hidden) {
        closeModal();
      }
    });
  }

  function renderIndustryReadingSection(industryReading) {
    setTextContent("industryReadingTitle", industryReading.title || "");
    setTextContent("industryReadingLede", industryReading.lede || "");

    var industryReadingCards = document.getElementById("industryReadingCards");
    if (!industryReadingCards || !Array.isArray(industryReading.cards)) {
      return;
    }

    industryReadingCards.innerHTML = industryReading.cards
      .map(function toReadingCard(card) {
        var themeKey = String(card.theme || "").trim().toLowerCase();
        var categoryLabel = String(card.category || "").trim();
        if (!categoryLabel) {
          if (themeKey === "shopping-ai") {
            categoryLabel = "AI Commerce";
          } else if (themeKey === "cloudflare") {
            categoryLabel = "Web Discovery";
          } else {
            categoryLabel = String(card.theme || "Reading").replace(/[-_]+/g, " ");
          }
        }
        categoryLabel = categoryLabel.toUpperCase();
        var metaText =
          String(card.source || "") + (card.date ? " • " + String(card.date) : "");
        var ctaLabel = String(card.cta || "Read article");
        if (ctaLabel.indexOf("→") !== 0) {
          ctaLabel = "→ " + ctaLabel;
        }

        return (
          "<article class=\"readingCard\">" +
          "<div class=\"readingCard__body\">" +
          "<p class=\"readingCard__category\">" + escapeHtml(categoryLabel || "Reading") + "</p>" +
          "<h3 class=\"readingCard__title\">" + escapeHtml(card.title || "") + "</h3>" +
          "<p class=\"readingCard__summary\">" + escapeHtml(card.summary || "") + "</p>" +
          "<p class=\"readingCard__meta\">" + escapeHtml(metaText) + "</p>" +
          "<a class=\"readingCard__link\" href=\"" +
          escapeHtml(card.url || "#") +
          "\" target=\"_blank\" rel=\"noreferrer\">" +
          escapeHtml(ctaLabel) +
          "</a>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");

    initIndustryReadingScroller();
  }

  function initIndustryReadingScroller() {
    var scroller = document.querySelector("[data-reading-scroller]");
    if (!scroller) {
      return;
    }

    var viewport = scroller.querySelector("[data-reading-viewport]");
    var prevButton = scroller.querySelector("[data-reading-prev]");
    var nextButton = scroller.querySelector("[data-reading-next]");
    var firstCard = viewport ? viewport.querySelector(".readingCard") : null;

    if (!viewport || !prevButton || !nextButton || !firstCard) {
      return;
    }

    function getStepSize() {
      var gap = 18;
      return firstCard.getBoundingClientRect().width + gap;
    }

    function updateButtons() {
      var maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
      prevButton.disabled = viewport.scrollLeft <= 2;
      nextButton.disabled = viewport.scrollLeft >= maxScrollLeft - 2;
    }

    prevButton.addEventListener("click", function onPrevClick() {
      viewport.scrollBy({ left: -getStepSize(), behavior: "smooth" });
    });

    nextButton.addEventListener("click", function onNextClick() {
      viewport.scrollBy({ left: getStepSize(), behavior: "smooth" });
    });

    viewport.addEventListener("scroll", updateButtons, { passive: true });
    window.addEventListener("resize", updateButtons);
    updateButtons();
  }

  function renderIndexPage(content) {
    var indexContent = (content && content.index) || {};
    var globalContent = (content && content.global) || {};
    var globalContact = globalContent.contact || {};
    var hero = indexContent.hero || {};
    var about = indexContent.about || {};
    var keyResults = indexContent.keyResults || {};
    var caseStudies = indexContent.caseStudies || {};
    var platformsRetailers = indexContent.platformsRetailers || {};
    var industryReading = indexContent.industryReading || {};
    var contact = indexContent.contact || {};

    if (indexContent.title) {
      document.title = indexContent.title;
    }

    setTextContent("heroName", hero.name || "");
    setHtmlContent("heroHeadline", hero.headlineHtml || "");
    setTextContent("heroSubhead", hero.subhead || "");
    setTextContent("heroMetaLine", hero.bestFit || "");

    var linkedInHref = globalContact.linkedInUrl || "#";
    var emailAddress = (globalContact.email || "").trim();
    var emailHref = emailAddress
      ? "mailto:" + encodeURIComponent(emailAddress) + "?subject=Let's%20Connect%20-%20Kate%20Linehan"
      : "#";
    setAnchor("heroInterviewLink", hero.interviewButtonLabel || "Let's Connect", linkedInHref);
    setAnchor(
      "heroSelectedWorkLink",
      hero.selectedWorkButtonLabel || "View Case Studies",
      "#case-studies"
    );

    setTextContent("aboutTitle", about.title || "");
    renderParagraphs("aboutSummary", about.paragraphs || []);

    renderKeyResultsSection(keyResults);
    renderCaseStudiesSection(caseStudies);
    renderPlatformsRetailersSection(platformsRetailers);
    renderIndustryReadingSection(industryReading);
    renderContactSection(contact, linkedInHref, emailHref);
  }

  function renderSelectedWorkPage(content) {
    var indexContent = (content && content.index) || {};
    var caseStudies = indexContent.caseStudies || {};
    document.title = "Kate Linehan | Selected Work";
    renderCaseStudiesSection(caseStudies);
  }

  function renderGrowthPage(content) {
    var indexContent = (content && content.index) || {};
    var keyResults = indexContent.keyResults || {};
    document.title = "Kate Linehan | Growth";
    renderKeyResultsSection(keyResults);
  }

  function renderSkillsPage(content) {
    var indexContent = (content && content.index) || {};
    var capabilitiesTools = indexContent.capabilitiesTools || {};
    var coursesCertifications = indexContent.coursesCertifications || {};
    document.title = "Kate Linehan | Skills";
    renderCapabilitiesToolsSection(capabilitiesTools);
    renderCoursesCertificationsSection(coursesCertifications);
  }

  function renderContactPage(content) {
    var indexContent = (content && content.index) || {};
    var globalContent = (content && content.global) || {};
    var globalContact = globalContent.contact || {};
    var contact = indexContent.contact || {};

    var linkedInHref = globalContact.linkedInUrl || "#";
    var emailAddress = (globalContact.email || "").trim();
    var emailHref = emailAddress
      ? "mailto:" + encodeURIComponent(emailAddress) + "?subject=Let's%20Connect%20-%20Kate%20Linehan"
      : "#";

    document.title = "Kate Linehan | Contact";
    renderContactSection(contact, linkedInHref, emailHref);
  }

  function renderAboutPage(content) {
    var about = (content && content.about) || {};
    var aboutDefaults = (getDefaults().about) || {};

    if (about.title) {
      document.title = about.title;
    }

    setTextContent("aboutTitle", about.pageTitle || "");
    setTextContent("aboutSubhead", about.subhead || "");
    renderParagraphs("aboutIntro", about.introParagraphs || []);

    setTextContent("aboutImpactTitle", about.selectedImpactTitle || "");
    renderList("aboutImpactList", about.selectedImpactItems || []);

    setTextContent("aboutGrowthTitle", about.growthTitle || "");
    renderParagraphs("aboutGrowthParagraphs", about.growthParagraphs || []);

    var growthQuote = document.getElementById("aboutGrowthQuote");
    if (growthQuote) {
      growthQuote.innerHTML = "<em>" + escapeHtml(about.growthQuote || "") + "</em>";
    }

    setTextContent("aboutCrossFunctionalTitle", about.crossFunctionalTitle || "");
    renderList("aboutCrossFunctionalList", about.crossFunctionalItems || []);
    setTextContent("aboutCrossFunctionalSupport", about.crossFunctionalSupport || "");

    setTextContent("aboutKnownForTitle", about.knownForTitle || "");
    renderList("aboutKnownForList", about.knownForItems || []);

    setTextContent("aboutCurrentlyTitle", about.currentlyTitle || "");
    setTextContent("aboutCurrentlyText", about.currentlyText || "");

    setTextContent("aboutOutsideTitle", about.outsideTitle || "");
    renderParagraphs("aboutOutsideParagraphs", about.outsideParagraphs || []);

    var hobbiesTitle = about.hobbiesTitle || aboutDefaults.hobbiesTitle || "";
    var hobbiesHook = about.hobbiesHook || aboutDefaults.hobbiesHook || "";
    var hobbies =
      Array.isArray(about.hobbies) && about.hobbies.length
        ? about.hobbies
        : (Array.isArray(aboutDefaults.hobbies) ? aboutDefaults.hobbies : []);

    setTextContent("aboutHobbiesTitle", hobbiesTitle);
    setTextContent("aboutHobbiesHook", hobbiesHook);
    renderHobbyChips("aboutHobbiesChips", "aboutHobbyDescription", hobbies);

    var galleryTitle = about.galleryTitle || aboutDefaults.galleryTitle || "";
    var gallerySubtitle = about.gallerySubtitle || aboutDefaults.gallerySubtitle || "";
    var galleryNote = about.galleryNote || aboutDefaults.galleryNote || "";
    var galleryItems =
      Array.isArray(about.galleryItems) && about.galleryItems.length
        ? about.galleryItems
        : (Array.isArray(aboutDefaults.galleryItems) ? aboutDefaults.galleryItems : []);

    setTextContent("aboutGalleryTitle", galleryTitle);
    setTextContent("aboutGallerySubtitle", gallerySubtitle);
    setTextContent("aboutGalleryNote", galleryNote);

    var galleryGrid = document.getElementById("aboutGalleryGrid");
    if (galleryGrid && Array.isArray(galleryItems)) {
      galleryGrid.innerHTML = galleryItems
        .map(function toGalleryCard(item) {
          return (
            "<figure class=\"aboutPhotoCard\">" +
            "<div class=\"aboutPhotoImage " +
            escapeHtml(item.imageClass || "") +
            "\"></div>" +
            "<figcaption>" +
            escapeHtml(item.caption || "") +
            "</figcaption>" +
            "</figure>"
          );
        })
        .join("");
    }

    setTextContent("aboutCtaText", about.ctaText || "");
    setTextContent("aboutCtaLink", about.ctaLabel || "Let's connect");
  }

  function renderPetIndustryPage(content) {
    var petIndustry = (content && content.petIndustry) || {};

    if (petIndustry.title) {
      document.title = petIndustry.title;
    }

    setTextContent("petPageTitle", petIndustry.pageTitle || "");

    var cardsContainer = document.getElementById("petCards");
    if (cardsContainer && Array.isArray(petIndustry.cards)) {
      cardsContainer.innerHTML = petIndustry.cards
        .map(function toCard(card) {
          var itemHtml = Array.isArray(card.items)
            ? card.items
                .map(function toCardItem(text) {
                  return "<li>" + escapeHtml(text) + "</li>";
                })
                .join("")
            : "";

          return (
            "<article class=\"card\">" +
            "<h3>" +
            escapeHtml(card.title || "") +
            "</h3>" +
            "<ul>" +
            itemHtml +
            "</ul>" +
            "</article>"
          );
        })
        .join("");
    }

    setTextContent("petPageHistoryTitle", petIndustry.historyTitle || "");
    renderDefinitionList("petPageHistoryList", petIndustry.historyItems || []);
  }

  function renderResourceCards(containerId, resources) {
    var container = document.getElementById(containerId);
    if (!container || !Array.isArray(resources)) {
      return;
    }

    container.innerHTML = resources
      .map(function toResourceCard(resource) {
        var topics = Array.isArray(resource.topics) ? resource.topics : [];
        var topicLabel = topics.join("|");
        var topicsHtml = topics
          .map(function toTopicPill(topic) {
            return "<span class=\"topicPill\">" + escapeHtml(topic) + "</span>";
          })
          .join("");

        return (
          "<article class=\"linkCard\" data-topics=\"" +
          escapeHtml(topicLabel) +
          "\" data-source=\"" +
          escapeHtml(resource.source || "") +
          "\" data-title=\"" +
          escapeHtml(resource.title || "") +
          "\" data-summary=\"" +
          escapeHtml(resource.summary || "") +
          "\" data-url=\"" +
          escapeHtml(resource.url || "#") +
          "\" data-cta=\"" +
          escapeHtml(resource.cta || "Read resource") +
          "\">" +
          "<p class=\"linkCard__kicker\">" +
          escapeHtml(resource.source || "") +
          "</p>" +
          "<h3 class=\"linkCard__title\">" +
          escapeHtml(resource.title || "") +
          "</h3>" +
          "<p class=\"linkCard__summary\">" +
          escapeHtml(resource.summary || "") +
          "</p>" +
          "<p class=\"linkCard__topics\">" + topicsHtml + "</p>" +
          "<a class=\"linkCard__cta\" href=\"" +
          escapeHtml(resource.url || "#") +
          "\" target=\"_blank\" rel=\"noreferrer\">" +
          escapeHtml(resource.cta || "Read resource") +
          "</a>" +
          "</article>"
        );
      })
      .join("");
  }

  function initBlogFilters(blog) {
    var filtersRoot = document.getElementById("blogFilters");
    var status = document.getElementById("blogFilterStatus");
    var searchInput = document.getElementById("blogSearchInput");
    var clearButton = document.getElementById("blogSearchClear");
    var featuredSection = document.getElementById("blogFeaturedSection");
    var featuredSource = document.getElementById("blogFeaturedSource");
    var featuredTitle = document.getElementById("blogFeaturedTitle");
    var featuredSummary = document.getElementById("blogFeaturedSummary");
    var featuredCta = document.getElementById("blogFeaturedCta");
    var buttons = filtersRoot ? filtersRoot.querySelectorAll("[data-blog-filter]") : [];
    var cards = document.querySelectorAll("#blog-top .linkCard");
    var ecommerceSection = document.getElementById("blogEcommerceSection");
    var petSection = document.getElementById("blogPetSection");
    var totalCount = cards.length;

    if (!cards.length) {
      return;
    }

    var validFilters = Array.isArray(blog.filters) ? blog.filters : [];
    var currentFilter = "All";

    function normalizeTopic(value) {
      return String(value || "").trim().toLowerCase();
    }

    function isValidFilter(value) {
      if (value === "All") {
        return true;
      }
      return validFilters.indexOf(value) > -1;
    }

    function getSearchQuery() {
      return normalizeTopic(searchInput ? searchInput.value : "");
    }


    function updateSectionVisibility() {
      if (ecommerceSection) {
        var ecommerceCards = ecommerceSection.querySelectorAll(".linkCard:not(.linkCard--hidden)");
        ecommerceSection.hidden = ecommerceCards.length === 0;
      }
      if (petSection) {
        var petCards = petSection.querySelectorAll(".linkCard:not(.linkCard--hidden)");
        petSection.hidden = petCards.length === 0;
      }
    }

    function updateStatus(visibleCount, searchQuery) {
      if (!status) {
        return;
      }
      if (visibleCount === 0) {
        status.textContent = "No resources match your current filters. Try another keyword.";
        return;
      }

      if (currentFilter === "All" && !searchQuery) {
        status.textContent = "Showing " + visibleCount + " of " + totalCount + " resources";
        return;
      }

      status.textContent =
        "Showing " +
        visibleCount +
        " result" +
        (visibleCount === 1 ? "" : "s") +
        " for " +
        currentFilter +
        (searchQuery ? " + \"" + searchQuery + "\"" : "");
    }

    function updateFeaturedCard(visibleCards) {
      if (
        !featuredSection ||
        !featuredSource ||
        !featuredTitle ||
        !featuredSummary ||
        !featuredCta
      ) {
        return;
      }

      if (!visibleCards.length) {
        featuredSection.hidden = true;
        return;
      }

      var card = visibleCards[0];
      featuredSection.hidden = false;
      featuredSource.textContent = String(card.getAttribute("data-source") || "Featured");
      featuredTitle.textContent = String(card.getAttribute("data-title") || "");
      featuredSummary.textContent = String(card.getAttribute("data-summary") || "");
      featuredCta.href = String(card.getAttribute("data-url") || "#");
      featuredCta.textContent = String(card.getAttribute("data-cta") || "Read featured resource");
    }

    function applyFilter(filterValue) {
      var normalizedFilter = normalizeTopic(filterValue);
      var searchQuery = getSearchQuery();
      var visibleCount = 0;
      var visibleCards = [];

      cards.forEach(function onCard(card) {
        var rawTopics = String(card.getAttribute("data-topics") || "");
        var topics = rawTopics
          .split("|")
          .map(normalizeTopic)
          .filter(Boolean);
        var searchText = normalizeTopic(
          String(card.getAttribute("data-source") || "") +
            " " +
            String(card.getAttribute("data-title") || "") +
            " " +
            String(card.getAttribute("data-summary") || "") +
            " " +
            rawTopics
        );

        var shouldShow =
          (normalizedFilter === "all" || topics.indexOf(normalizedFilter) > -1) &&
          (!searchQuery || searchText.indexOf(searchQuery) > -1);

        card.classList.toggle("linkCard--hidden", !shouldShow);
        if (shouldShow) {
          visibleCount += 1;
          visibleCards.push(card);
        }
      });

      updateSectionVisibility();
      updateStatus(visibleCount, searchQuery);
      updateFeaturedCard(visibleCards);
    }

    if (filtersRoot && buttons.length) {
      buttons.forEach(function onButton(button) {
        button.addEventListener("click", function onClick() {
          var nextFilter = String(button.getAttribute("data-blog-filter") || "All");
          if (!isValidFilter(nextFilter)) {
            return;
          }

          currentFilter = nextFilter;
          buttons.forEach(function onButtonState(node) {
            var isActive = String(node.getAttribute("data-blog-filter")) === currentFilter;
            node.classList.toggle("is-active", isActive);
          });
          applyFilter(currentFilter);
        });
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", function onSearchInput() {
        applyFilter(currentFilter);
      });
    }

    if (clearButton && searchInput) {
      clearButton.addEventListener("click", function onClearClick() {
        searchInput.value = "";
        searchInput.focus();
        applyFilter(currentFilter);
      });
    }

    applyFilter(currentFilter);
  }

  function updateBlogMeta(blog) {
    var fallbackOrigin = "https://katieagate.com";
    var hasHttpLocation =
      window.location && /^(http:|https:)$/.test(String(window.location.protocol || ""));
    var currentPath =
      hasHttpLocation && window.location.pathname ? window.location.pathname : "/blog.html";
    var canonicalUrl = new URL(currentPath || "/blog.html", fallbackOrigin).toString();
    var defaultDescription =
      "Curated AI, SEO, GEO, ecommerce, and pet industry resources from Kate Linehan.";
    var description = String(blog.lede || defaultDescription);

    var canonical = document.querySelector("link[rel=\"canonical\"]");
    if (canonical) {
      canonical.setAttribute("href", canonicalUrl);
    }

    var descriptionMeta = document.querySelector("meta[name=\"description\"]");
    if (descriptionMeta) {
      descriptionMeta.setAttribute("content", description);
    }

    var robotsMeta = document.querySelector("meta[name=\"robots\"]");
    if (robotsMeta) {
      robotsMeta.setAttribute(
        "content",
        "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
      );
    }

    var ogTitle = document.querySelector("meta[property=\"og:title\"]");
    if (ogTitle) {
      ogTitle.setAttribute("content", String(blog.title || "Kate Linehan | Resources"));
    }

    var ogDescription = document.querySelector("meta[property=\"og:description\"]");
    if (ogDescription) {
      ogDescription.setAttribute("content", description);
    }

    var ogUrl = document.querySelector("meta[property=\"og:url\"]");
    if (ogUrl) {
      ogUrl.setAttribute("content", canonicalUrl);
    }

    var twitterTitle = document.querySelector("meta[name=\"twitter:title\"]");
    if (twitterTitle) {
      twitterTitle.setAttribute("content", String(blog.title || "Kate Linehan | Resources"));
    }

    var twitterDescription = document.querySelector("meta[name=\"twitter:description\"]");
    if (twitterDescription) {
      twitterDescription.setAttribute("content", description);
    }
  }

  function renderBlogFaq(items) {
    var container = document.getElementById("blogFaqItems");
    if (!container || !Array.isArray(items)) {
      return;
    }

    container.innerHTML = items
      .map(function toFaqItem(item) {
        return (
          "<article class=\"blogFaqItem\">" +
          "<h3 class=\"blogFaqItem__question\">" +
          escapeHtml(item.question || "") +
          "</h3>" +
          "<p class=\"blogFaqItem__answer\">" +
          escapeHtml(item.answer || "") +
          "</p>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderBlogStructuredData(content, blog) {
    var node = document.getElementById("blogStructuredData");
    if (!node) {
      return;
    }

    var fallbackOrigin = "https://katieagate.com";
    var hasHttpLocation =
      window.location && /^(http:|https:)$/.test(String(window.location.protocol || ""));
    var currentPath =
      hasHttpLocation && window.location.pathname ? window.location.pathname : "/blog.html";
    var pageUrl = new URL(currentPath || "/blog.html", fallbackOrigin).toString();
    var personName =
      (content && content.global && content.global.footerName) || "Kate Linehan";
    var resources = []
      .concat(Array.isArray(blog.ecommerceResources) ? blog.ecommerceResources : [])
      .concat(Array.isArray(blog.petResources) ? blog.petResources : []);
    var faqItems = Array.isArray(blog.faqItems) ? blog.faqItems : [];

    var graph = [];

    graph.push({
      "@type": "Person",
      "@id": pageUrl + "#person",
      name: personName,
      url: "https://katieagate.com/",
      sameAs: [
        content && content.global && content.global.contact
          ? content.global.contact.linkedInUrl || ""
          : ""
      ].filter(Boolean)
    });

    graph.push({
      "@type": "CollectionPage",
      "@id": pageUrl + "#webpage",
      url: pageUrl,
      name: String(blog.pageTitle || "Resources"),
      description: String(blog.lede || ""),
      isPartOf: {
        "@type": "WebSite",
        "@id": "https://katieagate.com/#website",
        name: "Kate Linehan",
        url: "https://katieagate.com/"
      },
      about: [
        "Answer Engine Optimization",
        "Search Engine Optimization",
        "Generative Engine Optimization",
        "Ecommerce strategy",
        "Pet industry insights"
      ],
      inLanguage: "en-US"
    });

    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://katieagate.com/index.html"
        },
        {
          "@type": "ListItem",
          position: 2,
          name: String(blog.pageTitle || "Resources"),
          item: pageUrl
        }
      ]
    });

    graph.push({
      "@type": "ItemList",
      "@id": pageUrl + "#resource-list",
      name: "Curated resources",
      numberOfItems: resources.length,
      itemListElement: resources.map(function toListItem(resource, index) {
        return {
          "@type": "ListItem",
          position: index + 1,
          url: String(resource.url || pageUrl),
          name: String(resource.title || resource.source || "Resource"),
          description: String(resource.summary || "")
        };
      })
    });

    if (faqItems.length) {
      graph.push({
        "@type": "FAQPage",
        "@id": pageUrl + "#faq",
        mainEntity: faqItems.map(function toQuestion(item) {
          return {
            "@type": "Question",
            name: String(item.question || ""),
            acceptedAnswer: {
              "@type": "Answer",
              text: String(item.answer || "")
            }
          };
        })
      });
    }

    node.textContent = JSON.stringify(
      {
        "@context": "https://schema.org",
        "@graph": graph
      },
      null,
      2
    );
  }

  function renderBlogPage(content) {
    var blog = (content && content.blog) || {};

    if (blog.title) {
      document.title = blog.title;
    }

    setTextContent("blogPageTitle", blog.pageTitle || "");
    setTextContent("blogPageLede", blog.lede || "");
    setTextContent("blogEcommerceTitle", blog.ecommerceTitle || "");
    setTextContent("blogPetTitle", blog.petTitle || "");
    setTextContent("blogFaqTitle", blog.faqTitle || "");
    renderBlogFaq(blog.faqItems || []);
    renderResourceCards("blogEcommerceCards", blog.ecommerceResources || []);
    renderResourceCards("blogPetCards", blog.petResources || []);
    updateBlogMeta(blog);
    renderBlogStructuredData(content, blog);
    initBlogFilters(blog);
  }

  function renderAdminPage(content) {
    document.title = "Katie Linehan | Content Platform";

    var editor = document.getElementById("contentEditor");
    var status = document.getElementById("adminStatus");
    var saveButton = document.getElementById("saveContentButton");
    var resetButton = document.getElementById("resetContentButton");
    var exportButton = document.getElementById("exportContentButton");
    var importInput = document.getElementById("importContentInput");

    if (!editor || !status || !saveButton || !resetButton || !exportButton || !importInput) {
      return;
    }

    function setStatus(message, kind) {
      status.textContent = message;
      status.className = "adminStatus";
      if (kind) {
        status.classList.add("adminStatus--" + kind);
      }
    }

    function loadEditor(nextContent) {
      editor.value = JSON.stringify(nextContent, null, 2);
    }

    function parseEditorContent() {
      var parsed = JSON.parse(editor.value);
      if (!isRecord(parsed)) {
        throw new Error("Root JSON value must be an object.");
      }

      var requiredKeys = ["global", "index", "about", "petIndustry", "blog"];
      requiredKeys.forEach(function ensureKey(key) {
        if (!Object.prototype.hasOwnProperty.call(parsed, key)) {
          throw new Error("Missing required top-level key: " + key);
        }
      });

      return parsed;
    }

    loadEditor(content);
    setStatus("Editing local content model. Save to apply changes to all pages.", "info");

    saveButton.addEventListener("click", function onSaveClick() {
      try {
        var parsed = parseEditorContent();
        saveContent(parsed);
        setStatus("Saved. Refresh any open pages to see updates.", "success");
      } catch (error) {
        setStatus("Save failed: " + error.message, "error");
      }
    });

    resetButton.addEventListener("click", function onResetClick() {
      var shouldReset = window.confirm(
        "Reset local content to defaults? This only affects this browser's saved content."
      );

      if (!shouldReset) {
        return;
      }

      resetContent();
      var defaults = getDefaults();
      loadEditor(defaults);
      setStatus("Defaults restored. Save if you want to store them again.", "success");
    });

    exportButton.addEventListener("click", function onExportClick() {
      try {
        var parsed = parseEditorContent();
        var payload = JSON.stringify(parsed, null, 2);
        var blob = new Blob([payload], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "katie-site-content.json";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        setStatus("JSON exported.", "success");
      } catch (error) {
        setStatus("Export failed: " + error.message, "error");
      }
    });

    importInput.addEventListener("change", function onImportChange(event) {
      var target = event.target;
      if (!target || !target.files || !target.files[0]) {
        return;
      }

      var file = target.files[0];
      var reader = new FileReader();

      reader.onload = function onLoad() {
        try {
          var imported = JSON.parse(String(reader.result || "{}"));
          if (!isRecord(imported)) {
            throw new Error("Imported JSON must be an object.");
          }

          editor.value = JSON.stringify(imported, null, 2);
          setStatus("Import complete. Click Save Changes to apply.", "success");
        } catch (error) {
          setStatus("Import failed: " + error.message, "error");
        }
      };

      reader.onerror = function onError() {
        setStatus("Import failed: unable to read file.", "error");
      };

      reader.readAsText(file);
      target.value = "";
    });
  }

  function routePage(content) {
    var page = document.body.dataset.page;

    if (page === "index") {
      renderIndexPage(content);
      return;
    }

    if (page === "selected-work") {
      renderSelectedWorkPage(content);
      return;
    }

    if (page === "growth") {
      renderGrowthPage(content);
      return;
    }

    if (page === "skills") {
      renderSkillsPage(content);
      return;
    }

    if (page === "contact") {
      renderContactPage(content);
      return;
    }

    if (page === "about") {
      renderAboutPage(content);
      return;
    }

    if (page === "pet-industry") {
      renderPetIndustryPage(content);
      return;
    }

    if (page === "blog") {
      renderBlogPage(content);
      return;
    }

    if (page === "platform-admin") {
      renderAdminPage(content);
    }
  }

  window.personalWebsitePlatform = {
    getDefaults: getDefaults,
    getContent: getContent,
    saveContent: saveContent,
    resetContent: resetContent
  };

  document.addEventListener("DOMContentLoaded", function onReady() {
    var content = getContent();
    applySharedContent(content);
    initializeMobileNav();
    routePage(content);
  });
})();
