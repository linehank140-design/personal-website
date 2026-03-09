(function bootstrapPlatform() {
  "use strict";

  var STORAGE_KEY = "katie-platform-content-v1";

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

  function renderIndexPage(content) {
    var indexContent = (content && content.index) || {};
    var globalContent = (content && content.global) || {};
    var globalContact = globalContent.contact || {};
    var hero = indexContent.hero || {};
    var about = indexContent.about || {};
    var selectedWork = indexContent.selectedWork || {};
    var growthFramework = indexContent.growthFramework || {};
    var skillsTools = indexContent.skillsTools || {};
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
      hero.selectedWorkButtonLabel || "View Selected Work",
      "#selected-work"
    );

    setAnchor(
      "contactLinkedInLink",
      contact.linkedInLabel || "LinkedIn",
      linkedInHref
    );
    setAnchor("contactEmailLink", contact.emailLabel || "Email", emailHref);

    setTextContent("aboutTitle", about.title || "");
    renderParagraphs("aboutSummary", about.paragraphs || []);

    setTextContent("selectedWorkTitle", selectedWork.title || "");
    var selectedWorkCards = document.getElementById("selectedWorkCards");
    if (selectedWorkCards && Array.isArray(selectedWork.cards)) {
      selectedWorkCards.innerHTML = selectedWork.cards
        .map(function toSelectedWorkCard(card) {
          return (
            "<article class=\"selectedWorkCard\">" +
            "<h3>" +
            escapeHtml(card.title || "") +
            "</h3>" +
            "<p>" +
            escapeHtml(card.body || "") +
            "</p>" +
            (card.support
              ? "<p class=\"selectedWorkCard__support\">" + escapeHtml(card.support) + "</p>"
              : "") +
            "</article>"
          );
        })
        .join("");
    }

    setTextContent("growthFrameworkTitle", growthFramework.title || "");
    setTextContent("growthFrameworkIntro", growthFramework.intro || "");
    setTextContent("growthFrameworkOutro", growthFramework.outro || "");

    var growthFrameworkList = document.getElementById("growthFrameworkList");
    if (growthFrameworkList && Array.isArray(growthFramework.items)) {
      growthFrameworkList.innerHTML = growthFramework.items
        .map(function toGrowthFrameworkItem(item) {
          return (
            "<li><strong>" +
            escapeHtml(item.label || "") +
            "</strong><p>" +
            escapeHtml(item.detail || "") +
            "</p></li>"
          );
        })
        .join("");
    }

    setTextContent("skillsToolsTitle", skillsTools.title || "");
    var skillsToolsGroups = document.getElementById("skillsToolsGroups");
    if (skillsToolsGroups && Array.isArray(skillsTools.groups)) {
      skillsToolsGroups.innerHTML = skillsTools.groups
        .map(function toSkillGroup(group) {
          var itemHtml = Array.isArray(group.items)
            ? group.items
                .map(function toSkillItem(item) {
                  return "<li>" + escapeHtml(item) + "</li>";
                })
                .join("")
            : "";

          return (
            "<article class=\"skillsGroup\">" +
            "<h3>" +
            escapeHtml(group.title || "") +
            "</h3>" +
            "<ul>" +
            itemHtml +
            "</ul>" +
            "</article>"
          );
        })
        .join("");
    }

    setTextContent("contactTitle", contact.title || "");
    setTextContent("contactLede", contact.lede || "");
  }

  function renderAboutPage(content) {
    var about = (content && content.about) || {};

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

    setTextContent("aboutGalleryTitle", about.galleryTitle || "");
    setTextContent("aboutGalleryNote", about.galleryNote || "");

    var galleryGrid = document.getElementById("aboutGalleryGrid");
    if (galleryGrid && Array.isArray(about.galleryItems)) {
      galleryGrid.innerHTML = about.galleryItems
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

      var requiredKeys = ["global", "index", "about", "petIndustry"];
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

    if (page === "about") {
      renderAboutPage(content);
      return;
    }

    if (page === "pet-industry") {
      renderPetIndustryPage(content);
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
