(function initializePostBuilder() {
  "use strict";

  var STORAGE_KEY = "katie-post-builder-inputs-v1";
  var EXAMPLE_INPUTS = {
    orgName: "NIQ for Media",
    partnerName: "Amazon Marketing Cloud (AMC)",
    market: "Italy",
    initiativeName:
      "a collaboration between NIQ and Amazon Marketing Cloud to help advertisers and agencies understand cross-platform campaign reach and impact",
    audience: "advertisers and agencies",
    sourceOne: "NIQ Sinottica consumer panel data",
    sourceTwo: "Amazon advertising data",
    reachLine: "How many consumers were reached across platforms?",
    audienceLine: "Who was reached, and how did audiences differ?",
    purchaseLine: "Did ad exposure lead to purchases, and where?",
    pressUrl: "https://lnkd.in/efSc_HJB",
    closingLine:
      "Want to learn more about how cross-platform measurement in Italy can elevate your strategy? Reach out and lets talk!",
    hashtags: "NIQMedia, AmazonMarketingCloud, CrossPlatformMeasurement"
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function trimValue(value) {
    return String(value || "").trim();
  }

  function normalizeHashtags(value) {
    var parts = String(value || "")
      .split(",")
      .map(function mapPart(part) {
        return part.trim();
      })
      .filter(Boolean);

    return parts
      .map(function mapTag(tag) {
        return "#" + tag.replace(/^#+/, "").replace(/\s+/g, "");
      })
      .join(" ");
  }

  function collectInputs(fields) {
    return {
      orgName: trimValue(fields.orgName.value),
      partnerName: trimValue(fields.partnerName.value),
      market: trimValue(fields.market.value),
      initiativeName: trimValue(fields.initiativeName.value),
      audience: trimValue(fields.audience.value),
      sourceOne: trimValue(fields.sourceOne.value),
      sourceTwo: trimValue(fields.sourceTwo.value),
      reachLine: trimValue(fields.reachLine.value),
      audienceLine: trimValue(fields.audienceLine.value),
      purchaseLine: trimValue(fields.purchaseLine.value),
      pressUrl: trimValue(fields.pressUrl.value),
      closingLine: trimValue(fields.closingLine.value),
      hashtags: trimValue(fields.hashtags.value)
    };
  }

  function saveInputs(inputValues) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inputValues, null, 2));
  }

  function loadInputs() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function hydrateFields(fields, stored) {
    if (!stored || typeof stored !== "object") {
      return;
    }

    Object.keys(fields).forEach(function hydrate(key) {
      if (Object.prototype.hasOwnProperty.call(stored, key) && typeof stored[key] === "string") {
        fields[key].value = stored[key];
      }
    });
  }

  function applyInputs(fields, values) {
    if (!values || typeof values !== "object") {
      return;
    }

    Object.keys(fields).forEach(function applyValue(key) {
      if (Object.prototype.hasOwnProperty.call(values, key) && typeof values[key] === "string") {
        fields[key].value = values[key];
      }
    });
  }

  function buildFullDraft(data) {
    var hashtags = normalizeHashtags(data.hashtags);

    return [
      data.orgName + " + " + data.partnerName + " are unlocking cross-platform ad insights in " + data.market + ".",
      "",
      "We are excited to announce " +
        data.initiativeName +
        " to help " +
        data.audience +
        " in " +
        data.market +
        " better understand cross-platform campaign performance across linear TV and " +
        data.partnerName +
        ".",
      "",
      "By integrating insights from " +
        data.sourceOne +
        " with " +
        data.sourceTwo +
        ", this initiative delivers actionable insight into how ad exposure across digital, streaming, and TV channels drives incremental reach and purchases.",
      "",
      "What we are exploring:",
      "- Reach: " + data.reachLine,
      "- Audience composition: " + data.audienceLine,
      "- Purchase behavior: " + data.purchaseLine,
      "",
      "Read the press release for full details: " + data.pressUrl,
      "",
      data.closingLine,
      "",
      hashtags
    ].join("\n");
  }

  function buildConciseDraft(data) {
    var hashtags = normalizeHashtags(data.hashtags);

    return [
      "New collaboration: " + data.orgName + " + " + data.partnerName + " (" + data.market + ")",
      "",
      "We launched " +
        data.initiativeName +
        " to give " +
        data.audience +
        " clearer cross-platform measurement across TV and digital channels.",
      "",
      "Focus areas:",
      "- Reach: " + data.reachLine,
      "- Audience: " + data.audienceLine,
      "- Purchase impact: " + data.purchaseLine,
      "",
      "Details: " + data.pressUrl,
      "",
      data.closingLine,
      "",
      hashtags
    ].join("\n");
  }

  function buildExecutiveDraft(data) {
    var hashtags = normalizeHashtags(data.hashtags);

    return [
      data.orgName + " and " + data.partnerName + " are advancing cross-platform measurement in " + data.market + ".",
      "",
      "This collaboration combines " +
        data.sourceOne +
        " and " +
        data.sourceTwo +
        " to help " +
        data.audience +
        " evaluate true campaign contribution across channels.",
      "",
      "Measurement priorities:",
      "- Total reach: " + data.reachLine,
      "- Audience quality: " + data.audienceLine,
      "- Incremental outcomes: " + data.purchaseLine,
      "",
      "Full release: " + data.pressUrl,
      "",
      data.closingLine,
      "",
      hashtags
    ].join("\n");
  }

  function missingRequired(data) {
    var required = [
      "orgName",
      "partnerName",
      "market",
      "initiativeName",
      "audience",
      "sourceOne",
      "sourceTwo",
      "reachLine",
      "audienceLine",
      "purchaseLine",
      "pressUrl",
      "closingLine"
    ];

    return required.filter(function findMissing(key) {
      return !data[key];
    });
  }

  function setStatus(element, message, tone) {
    element.textContent = message;
    element.className = "adminStatus";
    element.classList.add("adminStatus--" + (tone || "info"));
  }

  function exportText(text) {
    var blob = new Blob([text], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "linkedin-post-draft.txt";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  document.addEventListener("DOMContentLoaded", function onReady() {
    if (!document.body || document.body.dataset.page !== "post-builder") {
      return;
    }

    var fields = {
      orgName: byId("orgName"),
      partnerName: byId("partnerName"),
      market: byId("market"),
      initiativeName: byId("initiativeName"),
      audience: byId("audience"),
      sourceOne: byId("sourceOne"),
      sourceTwo: byId("sourceTwo"),
      reachLine: byId("reachLine"),
      audienceLine: byId("audienceLine"),
      purchaseLine: byId("purchaseLine"),
      pressUrl: byId("pressUrl"),
      closingLine: byId("closingLine"),
      hashtags: byId("hashtags")
    };

    var output = byId("postOutput");
    var status = byId("builderStatus");
    var loadExampleButton = byId("loadExampleButton");
    var generateDraftButton = byId("generateDraftButton");
    var generateVariantsButton = byId("generateVariantsButton");
    var copyOutputButton = byId("copyOutputButton");
    var exportOutputButton = byId("exportOutputButton");

    var allReady =
      output &&
      status &&
      loadExampleButton &&
      generateDraftButton &&
      generateVariantsButton &&
      copyOutputButton &&
      exportOutputButton &&
      Object.keys(fields).every(function allFieldsExist(key) {
        return Boolean(fields[key]);
      });

    if (!allReady) {
      return;
    }

    var stored = loadInputs();
    applyInputs(fields, EXAMPLE_INPUTS);
    hydrateFields(fields, stored);

    loadExampleButton.addEventListener("click", function onLoadExample() {
      applyInputs(fields, EXAMPLE_INPUTS);
      setStatus(status, "Example values loaded from your screenshot format.", "success");
    });

    function generate(singleDraft) {
      var data = collectInputs(fields);
      var missing = missingRequired(data);

      if (missing.length > 0) {
        setStatus(status, "Missing required fields: " + missing.join(", "), "error");
        return;
      }

      saveInputs(data);

      if (singleDraft) {
        output.value = buildFullDraft(data);
        setStatus(status, "Draft generated.", "success");
        return;
      }

      var variants = [
        "Variant 1: Detailed\n\n" + buildFullDraft(data),
        "Variant 2: Concise\n\n" + buildConciseDraft(data),
        "Variant 3: Executive\n\n" + buildExecutiveDraft(data)
      ];

      output.value = variants.join("\n\n--------------------\n\n");
      setStatus(status, "Three variants generated.", "success");
    }

    generateDraftButton.addEventListener("click", function onGenerateDraft() {
      generate(true);
    });

    generateVariantsButton.addEventListener("click", function onGenerateVariants() {
      generate(false);
    });

    copyOutputButton.addEventListener("click", function onCopy() {
      if (!output.value.trim()) {
        setStatus(status, "Generate a draft before copying.", "error");
        return;
      }

      navigator.clipboard
        .writeText(output.value)
        .then(function onCopied() {
          setStatus(status, "Copied output to clipboard.", "success");
        })
        .catch(function onCopyFail() {
          setStatus(status, "Copy failed in this browser. Select and copy manually.", "error");
        });
    });

    exportOutputButton.addEventListener("click", function onExport() {
      if (!output.value.trim()) {
        setStatus(status, "Generate a draft before exporting.", "error");
        return;
      }

      exportText(output.value);
      setStatus(status, "Exported draft as text file.", "success");
    });
  });
})();
