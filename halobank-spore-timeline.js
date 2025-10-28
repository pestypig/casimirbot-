(() => {
  const SCRIPT_ID = "spore-timeline-script";
  if (window[SCRIPT_ID]) return;
  window[SCRIPT_ID] = true;

  const PX_PADDING = 60;
  const DEFAULT_HEIGHT = 360;
  const MAX_ZOOM = 8;
  const MIN_ZOOM = 0.2;
  // Tick spacing targets (pixels) to keep labels legible across scales
  const TICK_PX_MIN = 80;
  const TICK_PX_MAX = 140;
  // Time unit helpers (ms)
  const MS = 1;
  const SEC = 1000;
  const MIN = 60 * SEC;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;
  const YEAR = 365.2425 * DAY; // mean solar year for zoomed-out labels

  // Ladder of candidate steps from milliseconds to centuries
  const TIME_STEPS_MS = [
    1, 2, 5, 10, 20, 50, 100, 200, 500,
    1 * SEC, 2 * SEC, 5 * SEC, 10 * SEC, 30 * SEC,
    1 * MIN, 2 * MIN, 5 * MIN, 10 * MIN, 15 * MIN, 30 * MIN,
    1 * HOUR, 2 * HOUR, 3 * HOUR, 6 * HOUR, 12 * HOUR,
    1 * DAY, 2 * DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY, 90 * DAY, 180 * DAY,
    1 * YEAR, 2 * YEAR, 5 * YEAR, 10 * YEAR, 25 * YEAR, 50 * YEAR, 100 * YEAR, 200 * YEAR, 500 * YEAR,
  ];

  const state = {
    title: "Untitled project",
    items: [],
    tsiOn: false,
    tsiSeries: [],
    selection: null,
    zoom: 1,
    pan: 0,
    width: 960,
    minZoom: MIN_ZOOM,
    fitZoom: MIN_ZOOM,
  };

  let root = null;
  let headerEl = null;
  let titleInput = null;
  let uploadInput = null;
  let addNoteBtn = null;
  let tsiToggle = null;
  let zoomInBtn = null;
  let zoomOutBtn = null;
  let fitBtn = null;
  let resetBtn = null;
  let exportBtn = null;
  let timelineOuter = null;
  let svgEl = null;
  let axisGroup = null;
  let tsiGroup = null;
  let itemsGroup = null;
  let overlayEl = null;
  let detailsEl = null;
  let dropOverlay = null;
  let noteModal = null;
  let noteForm = null;
  let noteTitleInput = null;
  let noteTimeInput = null;
  let noteBodyInput = null;
  let noteError = null;

  let resizeObserver = null;
  let dragDepth = 0;

  function init(node) {
    root = node;
    node.className = "spore-timeline";
    node.style.padding = "12px 16px";
    node.style.color = "#e8eefc";
    dragDepth = 0;

    headerEl = document.createElement("div");
    headerEl.style.display = "flex";
    headerEl.style.gap = "12px";
    headerEl.style.alignItems = "center";
    headerEl.style.marginBottom = "12px";
    headerEl.style.flexWrap = "wrap";
    node.appendChild(headerEl);

    titleInput = document.createElement("input");
    titleInput.value = state.title;
    titleInput.setAttribute("aria-label", "Project title");
    titleInput.style.background = "#0f162b";
    titleInput.style.border = "1px solid #1c2746";
    titleInput.style.color = "#e8eefc";
    titleInput.style.padding = "6px 10px";
    titleInput.style.borderRadius = "8px";
    titleInput.style.minWidth = "220px";
    titleInput.addEventListener("input", () => {
      state.title = titleInput.value || "Untitled project";
    });
    headerEl.appendChild(titleInput);

    const uploadLabel = document.createElement("label");
    uploadLabel.style.cursor = "pointer";
    uploadLabel.style.background = "#141b31";
    uploadLabel.style.border = "1px solid #202a4a";
    uploadLabel.style.padding = "6px 10px";
    uploadLabel.style.borderRadius = "8px";
    uploadLabel.style.display = "inline-flex";
    uploadLabel.style.alignItems = "center";
    uploadLabel.style.gap = "6px";
    uploadLabel.title = "Select one or more files (Ctrl/Shift-click to multi-select)";
    uploadLabel.textContent = "Upload files…";
    headerEl.appendChild(uploadLabel);

    uploadInput = document.createElement("input");
    uploadInput.type = "file";
    uploadInput.multiple = true;
    uploadInput.setAttribute("multiple", "multiple");
    uploadInput.accept =
      "image/*,audio/*,text/plain,application/json,.txt,.md";
    uploadInput.style.display = "none";
    uploadInput.addEventListener("change", async (event) => {
      const files = Array.from(event.target.files || []);
      if (files.length) {
        await addFiles(files);
      }
      event.target.value = "";
    });
    uploadLabel.appendChild(uploadInput);

    addNoteBtn = makeButton("Add note");
    addNoteBtn.addEventListener("click", () => addNote());
    headerEl.appendChild(addNoteBtn);

    const tsiLabel = document.createElement("label");
    tsiLabel.style.display = "inline-flex";
    tsiLabel.style.alignItems = "center";
    tsiLabel.style.gap = "6px";
    tsiLabel.style.background = "#0f162b";
    tsiLabel.style.border = "1px solid #1c2746";
    tsiLabel.style.padding = "6px 10px";
    tsiLabel.style.borderRadius = "9px";

    tsiToggle = document.createElement("input");
    tsiToggle.type = "checkbox";
    tsiToggle.addEventListener("change", () => {
      state.tsiOn = tsiToggle.checked;
      if (!state.tsiOn) {
        state.tsiSeries = [];
      }
      render();
    });

    const tsiSpan = document.createElement("span");
    tsiSpan.textContent = "TSI overlay";

    tsiLabel.appendChild(tsiToggle);
    tsiLabel.appendChild(tsiSpan);
    headerEl.appendChild(tsiLabel);

    const controls = document.createElement("div");
    controls.style.marginLeft = "auto";
    controls.style.display = "flex";
    controls.style.gap = "8px";
    headerEl.appendChild(controls);

    zoomInBtn = makeButton("+");
    zoomInBtn.title = "Zoom in";
    zoomInBtn.setAttribute("aria-label", "Zoom in");
    zoomInBtn.addEventListener("click", () =>
      setZoom(state.zoom * 1.2)
    );
    controls.appendChild(zoomInBtn);

    zoomOutBtn = makeButton("-");
    zoomOutBtn.title = "Zoom out";
    zoomOutBtn.setAttribute("aria-label", "Zoom out");
    zoomOutBtn.addEventListener("click", () =>
      setZoom(state.zoom / 1.2)
    );
    controls.appendChild(zoomOutBtn);

    fitBtn = makeButton("Fit all");
    fitBtn.title = "Zoom to fit all items";
    fitBtn.setAttribute("aria-label", "Zoom to fit all items");
    fitBtn.addEventListener("click", () => fitTimelineToAll());
    controls.appendChild(fitBtn);

    resetBtn = makeButton("Reset");
    resetBtn.title = "Clear all items and reset the view";
    resetBtn.addEventListener("click", () => {
      clearTimeline();
    });
    controls.appendChild(resetBtn);

    exportBtn = makeButton("Finish & Export");
    exportBtn.title = "Export PNG";
    exportBtn.style.background = "#1a2850";
    exportBtn.style.border = "1px solid #314377";
    exportBtn.style.color = "#dfe6ff";
    exportBtn.addEventListener("click", () => finishExport());
    controls.appendChild(exportBtn);

    timelineOuter = document.createElement("div");
    timelineOuter.style.position = "relative";
    timelineOuter.style.height = DEFAULT_HEIGHT + "px";
    timelineOuter.style.background =
      "linear-gradient(180deg, #0f1526 0, #0b0f18 100%)";
    timelineOuter.style.border = "1px solid #18223d";
    timelineOuter.style.borderRadius = "12px";
    timelineOuter.style.overflow = "hidden";
    timelineOuter.style.minHeight = DEFAULT_HEIGHT + "px";
    node.appendChild(timelineOuter);

    svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgEl.setAttribute("width", "100%");
    svgEl.setAttribute("height", "100%");
    svgEl.setAttribute("preserveAspectRatio", "none");
    svgEl.setAttribute("viewBox", `0 0 ${state.width} ${DEFAULT_HEIGHT}`);
    timelineOuter.appendChild(svgEl);

    const defs = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "defs"
    );
    const gradient = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "linearGradient"
    );
    gradient.setAttribute("id", "tsiGradient");
    gradient.setAttribute("x1", "0");
    gradient.setAttribute("x2", "1");
    gradient.setAttribute("y1", "0");
    gradient.setAttribute("y2", "0");
    const stop1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "stop"
    );
    stop1.setAttribute("offset", "0");
    stop1.setAttribute("stop-color", "#ffd26a");
    gradient.appendChild(stop1);
    const stop2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "stop"
    );
    stop2.setAttribute("offset", "1");
    stop2.setAttribute("stop-color", "#8d9bff");
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svgEl.appendChild(defs);

    const axisLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    axisLine.setAttribute("x", "0");
    axisLine.setAttribute("y", "300");
    axisLine.setAttribute("width", state.width);
    axisLine.setAttribute("height", "1");
    axisLine.setAttribute("fill", "#23335f");
    svgEl.appendChild(axisLine);

    axisGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    svgEl.appendChild(axisGroup);

    tsiGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    svgEl.appendChild(tsiGroup);

    itemsGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    svgEl.appendChild(itemsGroup);

    overlayEl = document.createElement("div");
    overlayEl.style.position = "absolute";
    overlayEl.style.inset = "0";
    overlayEl.style.pointerEvents = "none";
    timelineOuter.appendChild(overlayEl);

    dropOverlay = document.createElement("div");
    dropOverlay.style.position = "absolute";
    dropOverlay.style.inset = "0";
    dropOverlay.style.display = "flex";
    dropOverlay.style.alignItems = "center";
    dropOverlay.style.justifyContent = "center";
    dropOverlay.style.background = "#0f162bcc";
    dropOverlay.style.backdropFilter = "blur(6px)";
    dropOverlay.style.opacity = "0";
    dropOverlay.style.visibility = "hidden";
    dropOverlay.style.pointerEvents = "none";
    dropOverlay.style.transition = "opacity 0.18s ease";

    const dropMessage = document.createElement("div");
    dropMessage.textContent = "Drop files to add to the timeline";
    dropMessage.style.border = "1px dashed #314377";
    dropMessage.style.padding = "18px 24px";
    dropMessage.style.borderRadius = "12px";
    dropMessage.style.color = "#dfe6ff";
    dropMessage.style.background = "#0b1227cc";
    dropMessage.style.boxShadow = "0 12px 32px #0006";
    dropMessage.style.fontSize = "14px";
    dropOverlay.appendChild(dropMessage);

    timelineOuter.appendChild(dropOverlay);

    noteModal = document.createElement("div");
    noteModal.style.position = "fixed";
    noteModal.style.inset = "0";
    noteModal.style.display = "flex";
    noteModal.style.alignItems = "center";
    noteModal.style.justifyContent = "center";
    noteModal.style.background = "#060913cc";
    noteModal.style.backdropFilter = "blur(8px)";
    noteModal.style.zIndex = "5000";
    noteModal.style.opacity = "0";
    noteModal.style.visibility = "hidden";
    noteModal.style.transition = "opacity 0.18s ease";

    const dialog = document.createElement("div");
    dialog.style.width = "min(420px, 90vw)";
    dialog.style.background = "#0f162b";
    dialog.style.border = "1px solid #1c2746";
    dialog.style.borderRadius = "14px";
    dialog.style.boxShadow = "0 18px 40px #000a";
    dialog.style.padding = "18px 20px";
    dialog.style.display = "flex";
    dialog.style.flexDirection = "column";
    dialog.style.gap = "12px";

    const heading = document.createElement("h2");
    heading.textContent = "New timeline note";
    heading.style.margin = "0";
    heading.style.fontSize = "17px";
    heading.style.color = "#ffffff";
    dialog.appendChild(heading);

    noteForm = document.createElement("form");
    noteForm.style.display = "flex";
    noteForm.style.flexDirection = "column";
    noteForm.style.gap = "10px";

    const titleLabel = document.createElement("label");
    titleLabel.style.display = "flex";
    titleLabel.style.flexDirection = "column";
    titleLabel.style.gap = "6px";
    titleLabel.style.color = "#dfe6ff";
    titleLabel.textContent = "Title";

    noteTitleInput = document.createElement("input");
    noteTitleInput.type = "text";
    noteTitleInput.required = false;
    noteTitleInput.placeholder = "Untitled note";
    noteTitleInput.style.background = "#0b1224";
    noteTitleInput.style.border = "1px solid #1b2547";
    noteTitleInput.style.borderRadius = "8px";
    noteTitleInput.style.color = "#ffffff";
    noteTitleInput.style.padding = "8px 10px";
    noteTitleInput.style.fontSize = "14px";
    titleLabel.appendChild(noteTitleInput);

    const timeLabel = document.createElement("label");
    timeLabel.style.display = "flex";
    timeLabel.style.flexDirection = "column";
    timeLabel.style.gap = "6px";
    timeLabel.style.color = "#dfe6ff";
    timeLabel.textContent = "Date & time";

    noteTimeInput = document.createElement("input");
    noteTimeInput.type = "datetime-local";
    noteTimeInput.required = true;
    noteTimeInput.style.background = "#0b1224";
    noteTimeInput.style.border = "1px solid #1b2547";
    noteTimeInput.style.borderRadius = "8px";
    noteTimeInput.style.color = "#ffffff";
    noteTimeInput.style.padding = "8px 10px";
    noteTimeInput.style.fontSize = "14px";
    timeLabel.appendChild(noteTimeInput);

    const bodyLabel = document.createElement("label");
    bodyLabel.style.display = "flex";
    bodyLabel.style.flexDirection = "column";
    bodyLabel.style.gap = "6px";
    bodyLabel.style.color = "#dfe6ff";
    bodyLabel.textContent = "Notes";

    noteBodyInput = document.createElement("textarea");
    noteBodyInput.rows = 4;
    noteBodyInput.placeholder = "What happened at this moment?";
    noteBodyInput.style.background = "#0b1224";
    noteBodyInput.style.border = "1px solid #1b2547";
    noteBodyInput.style.borderRadius = "8px";
    noteBodyInput.style.color = "#ffffff";
    noteBodyInput.style.padding = "8px 10px";
    noteBodyInput.style.fontSize = "14px";
    noteBodyInput.style.resize = "vertical";
    bodyLabel.appendChild(noteBodyInput);

    noteError = document.createElement("div");
    noteError.style.color = "#ff8a8a";
    noteError.style.fontSize = "12px";
    noteError.style.minHeight = "16px";

    const actionsRow = document.createElement("div");
    actionsRow.style.display = "flex";
    actionsRow.style.justifyContent = "flex-end";
    actionsRow.style.gap = "8px";

    const cancelBtn = makeButton("Cancel");
    cancelBtn.type = "button";
    cancelBtn.addEventListener("click", () => closeNoteModal());

    const submitBtn = makeButton("Add note");
    submitBtn.type = "submit";
    submitBtn.style.background = "#1a2850";
    submitBtn.style.border = "1px solid #314377";

    actionsRow.appendChild(cancelBtn);
    actionsRow.appendChild(submitBtn);

    noteForm.appendChild(titleLabel);
    noteForm.appendChild(timeLabel);
    noteForm.appendChild(bodyLabel);
    noteForm.appendChild(noteError);
    noteForm.appendChild(actionsRow);
    dialog.appendChild(noteForm);
    noteModal.appendChild(dialog);
    document.body.appendChild(noteModal);

    noteModal.addEventListener("click", (event) => {
      if (event.target === noteModal) {
        closeNoteModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && noteModal?.dataset.open === "true") {
        event.preventDefault();
        closeNoteModal();
      }
    });

    noteForm.addEventListener("submit", (event) => {
      event.preventDefault();
      handleNoteSubmit();
    });

    const onDragEnter = (event) => {
      if (!hasFileDrag(event)) return;
      event.preventDefault();
      dragDepth += 1;
      setDropOverlayVisible(true);
    };

    const onDragOver = (event) => {
      if (!hasFileDrag(event)) return;
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
    };

    const onDragLeave = (event) => {
      if (!hasFileDrag(event)) return;
      event.preventDefault();
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) {
        setDropOverlayVisible(false);
      }
    };

    const onDrop = async (event) => {
      if (!hasFileDrag(event)) return;
      event.preventDefault();
      setDropOverlayVisible(false);
      dragDepth = 0;
      const files = await filesFromDataTransfer(event.dataTransfer);
      if (files.length) {
        try {
          await addFiles(files);
        } catch (err) {
          console.warn("Timeline drop failed", err);
        }
      }
    };

    node.addEventListener("dragenter", onDragEnter);
    node.addEventListener("dragover", onDragOver);
    node.addEventListener("dragleave", onDragLeave);
    node.addEventListener("drop", onDrop);
    window.addEventListener("dragend", () => {
      dragDepth = 0;
      setDropOverlayVisible(false);
    });

    node.addEventListener("paste", async (event) => {
      if (isEditableTarget(event.target)) return;
      const files = Array.from(event.clipboardData?.files || []);
      if (files.length) {
        event.preventDefault();
        try {
          await addFiles(files);
        } catch (err) {
          console.warn("Timeline paste failed", err);
        }
      }
    });

    detailsEl = document.createElement("div");
    detailsEl.style.marginTop = "10px";
    node.appendChild(detailsEl);

    timelineOuter.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        const rect = timelineOuter.getBoundingClientRect();
        const minT =
          state.items.length > 0
            ? Math.min(...state.items.map((item) => item.start))
            : Date.now() - 3_600_000;
        const maxT =
          state.items.length > 0
            ? Math.max(...state.items.map((item) => item.end ?? item.start))
            : Date.now() + 3_600_000;
        const spanMs = Math.max(1, maxT - minT);
        const pxPerMsBase = Math.max(0.0003, state.width / Math.max(1000, spanMs));
        const pxPerMs = pxPerMsBase * state.zoom;

        if (event.ctrlKey || event.metaKey) {
          const anchorX = event.clientX - rect.left - PX_PADDING;
          const anchorTime =
            minT + (anchorX - state.pan) / Math.max(1e-9, pxPerMs);
          const factor = event.deltaY < 0 ? 1.1 : 0.9;
          const minZoom = state.minZoom ?? MIN_ZOOM;
          const nextZoom = Math.max(
            minZoom,
            Math.min(MAX_ZOOM, state.zoom * factor)
          );
          if (nextZoom !== state.zoom) {
            const nextPxPerMs = pxPerMsBase * nextZoom;
            state.pan = anchorX - (anchorTime - minT) * nextPxPerMs;
            state.zoom = nextZoom;
            render();
          }
        } else {
          state.pan -= event.deltaY * 0.5;
          render();
        }
      },
      { passive: false }
    );

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        state.width = timelineOuter.clientWidth || 960;
        render();
      });
      resizeObserver.observe(timelineOuter);
    } else {
      window.addEventListener("resize", () => {
        state.width = timelineOuter.clientWidth || 960;
        render();
      });
    }

    node.addEventListener("spore:timeline-span", (event) => {
      try {
        const detail = event.detail || {};
        node.dataset.spanStart = detail.tStart ?? "";
        node.dataset.spanEnd = detail.tEnd ?? "";
      } catch {}
    });

    render();
  }

  function makeButton(label) {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.style.background = "#141b31";
    btn.style.border = "1px solid #202a4a";
    btn.style.padding = "6px 10px";
    btn.style.borderRadius = "8px";
    btn.style.color = "#e8eefc";
    btn.style.cursor = "pointer";
    return btn;
  }

  function setDropOverlayVisible(visible) {
    if (!dropOverlay) return;
    dropOverlay.style.visibility = visible ? "visible" : "hidden";
    dropOverlay.style.opacity = visible ? "1" : "0";
  }

  function formatDateTimeLocal(ts) {
    const date = new Date(ts);
    const tzOffset = date.getTimezoneOffset();
    const adjusted = new Date(ts - tzOffset * 60_000);
    return adjusted.toISOString().slice(0, 16);
  }

  function openNoteModal(defaultTimestamp = Date.now()) {
    if (!noteModal) return;
    const journalCount =
      state.items.filter((item) => item.kind === "journal").length + 1;
    const defaultTitle = `Note ${journalCount}`;
    noteTitleInput.value = defaultTitle;
    noteTimeInput.value = formatDateTimeLocal(defaultTimestamp);
    noteBodyInput.value = "";
    noteError.textContent = "";

    noteModal.dataset.open = "true";
    noteModal.style.visibility = "visible";
    noteModal.style.opacity = "1";
    setTimeout(() => noteTitleInput.focus(), 0);
  }

  function closeNoteModal() {
    if (!noteModal) return;
    noteModal.dataset.open = "false";
    noteModal.style.opacity = "0";
    setTimeout(() => {
      if (noteModal?.dataset.open !== "true") {
        noteModal.style.visibility = "hidden";
      }
    }, 180);
  }

  function handleNoteSubmit() {
    const title = noteTitleInput.value.trim();
    const timeValue = noteTimeInput.value;
    const body = noteBodyInput.value.trim();

    if (!timeValue) {
      noteError.textContent = "Please choose a date and time.";
      return;
    }

    const parsed = new Date(timeValue);
    const start = parsed.getTime();
    if (!Number.isFinite(start)) {
      noteError.textContent = "Could not parse the provided date/time.";
      return;
    }

    const fallbackTitle =
      title ||
      `Note ${state.items.filter((item) => item.kind === "journal").length + 1}`;

    const id = uid();
    const note = {
      id,
      kind: "journal",
      name: fallbackTitle,
      start,
      note: body || undefined,
    };

    const hadItems = state.items.length > 0;
    state.items = [...state.items, note].sort((a, b) => a.start - b.start);
    state.selection = id;

    autoCenter({ preserveZoom: hadItems, preservePan: hadItems });
    render();
    closeNoteModal();
  }

  function revokeObjectUrls(items) {
    if (!items || !items.length) return;
    for (const entry of items) {
      const url = entry?.url;
      if (typeof url === "string" && url.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      }
    }
  }

  function clearTimeline() {
    if (!state.items.length) {
      state.zoom = 1;
      state.pan = 0;
      state.selection = null;
      state.minZoom = MIN_ZOOM;
      state.fitZoom = MIN_ZOOM;
      render();
      return;
    }

    revokeObjectUrls(state.items);
    state.items = [];
    state.selection = null;
    state.zoom = 1;
    state.pan = 0;
    state.minZoom = MIN_ZOOM;
    state.fitZoom = MIN_ZOOM;
    render();
  }

  function hasFileDrag(event) {
    const types = event?.dataTransfer?.types;
    if (!types) return false;
    if (typeof types.includes === "function") return types.includes("Files");
    if (typeof types.contains === "function") return types.contains("Files");
    return Array.from(types).includes("Files");
  }

  function isEditableTarget(node) {
    if (!node) return false;
    if (node instanceof HTMLInputElement) return true;
    if (node instanceof HTMLTextAreaElement) return true;
    return Boolean(node.isContentEditable);
  }

  async function filesFromDataTransfer(dataTransfer) {
    if (!dataTransfer) return [];
    const collected = Array.from(dataTransfer.files || []);
    const seen = new Set(
      collected.map(
        (file) => `${file.name}__${file.size}__${file.lastModified}`,
      ),
    );

    const items = Array.from(dataTransfer.items || []).filter(
      (item) => item.kind === "file",
    );

    for (const item of items) {
      const entry =
        typeof item.webkitGetAsEntry === "function"
          ? item.webkitGetAsEntry()
          : null;
      if (entry) {
        const nested = await collectFilesFromEntry(entry);
        for (const file of nested) {
          const key = `${file.name}__${file.size}__${file.lastModified}`;
          if (!seen.has(key)) {
            seen.add(key);
            collected.push(file);
          }
        }
      } else {
        const file = typeof item.getAsFile === "function" ? item.getAsFile() : null;
        if (file) {
          const key = `${file.name}__${file.size}__${file.lastModified}`;
          if (!seen.has(key)) {
            seen.add(key);
            collected.push(file);
          }
        }
      }
    }

    return collected;
  }

  function collectFilesFromEntry(entry) {
    return new Promise((resolve) => {
      if (!entry) {
        resolve([]);
        return;
      }

      if (entry.isFile) {
        entry.file(
          (file) => resolve([file]),
          () => resolve([]),
        );
        return;
      }

      if (entry.isDirectory) {
        const reader = entry.createReader();
        const files = [];
        const readEntries = () => {
          reader.readEntries(
            (entries) => {
              if (!entries.length) {
                resolve(files);
                return;
              }
              Promise.all(entries.map((child) => collectFilesFromEntry(child)))
                .then((batches) => {
                  for (const batch of batches) files.push(...batch);
                  readEntries();
                })
                .catch(() => resolve(files));
            },
            () => resolve(files),
          );
        };
        readEntries();
        return;
      }

      resolve([]);
    });
  }

  function setZoom(next) {
    const minZoom = state.minZoom ?? MIN_ZOOM;
    const clamped = Math.max(minZoom, Math.min(MAX_ZOOM, next));
    if (clamped !== state.zoom) {
      state.zoom = clamped;
      render();
    }
  }

  async function addFiles(list) {
    const files = Array.isArray(list)
      ? list
      : Array.from(list || []).filter(Boolean);
    if (!files.length) return;

    const additions = [];
    for (const file of files) {
      const id = uid();
      const lower = file.name.toLowerCase();
      const kind = file.type.startsWith("image/")
        ? "photo"
        : file.type.startsWith("audio/")
        ? "audio"
        : lower.includes("lyric")
        ? "lyrics"
        : "other";

      let start = file.lastModified || Date.now();
      let durationMs;

      if (kind === "photo") {
        const exifTime = await readExifDate(file);
        if (typeof exifTime === "number") start = exifTime;
      } else if (kind === "audio" || kind === "vocal") {
        const id3 = await readId3(file);
        if (id3?.date) start = id3.date;
        if (id3?.duration) durationMs = id3.duration;
      }

      const end = durationMs ? start + durationMs : undefined;
      const celestial = await haloSummarizeSpan(start, end ?? start + 1);
      const url = URL.createObjectURL(file);

      additions.push({
        id,
        kind,
        name: file.name,
        file,
        url,
        start,
        end,
        durationMs,
        celestial,
      });
    }

    state.items = [...state.items, ...additions].sort(
      (a, b) => a.start - b.start
    );
    autoCenter();
    render();
  }

  function addNote() {
    openNoteModal(Date.now());
  }

  function autoCenter(options = {}) {
    if (!state.items.length) {
      state.minZoom = MIN_ZOOM;
      state.fitZoom = MIN_ZOOM;
      if (!options?.preserveZoom) {
        state.zoom = MIN_ZOOM;
      } else {
        state.zoom = clamp(state.zoom ?? MIN_ZOOM, MIN_ZOOM, MAX_ZOOM);
      }
      if (!options?.preservePan) {
        state.pan = 0;
      }
      return;
    }
    const {
      preserveZoom = false,
      preservePan = false,
      targetTimestamp,
    } = options;

    const starts = state.items.map((item) => item.start);
    const ends = state.items.map((item) => item.end ?? item.start);
    const minAll = Math.min(...starts);
    const maxAll = Math.max(...ends);
    const spanAll = Math.max(1, maxAll - minAll);
    const baseScale = Math.max(0.0003, state.width / Math.max(1000, spanAll));
    const paddedWidth = Math.max(1, state.width - PX_PADDING * 2);
    const fitZoomRaw = paddedWidth / (spanAll * baseScale + 1e-9);
    const fitZoom = clamp(fitZoomRaw, MIN_ZOOM, MAX_ZOOM);
    state.fitZoom = fitZoom;
    state.minZoom = fitZoomRaw <= MAX_ZOOM ? fitZoom : MIN_ZOOM;

    if (!preserveZoom) {
      state.zoom = fitZoom;
    } else {
      state.zoom = clamp(state.zoom ?? fitZoom, state.minZoom, MAX_ZOOM);
    }

    if (state.zoom < state.minZoom) {
      state.zoom = state.minZoom;
    }

    const pxPerMs = baseScale * state.zoom;

    if (typeof targetTimestamp === "number") {
      const targetOffset = (targetTimestamp - minAll) * pxPerMs;
      const centerPx = state.width / 2 - PX_PADDING;
      state.pan = centerPx - targetOffset;
    } else if (!preservePan) {
      state.pan = 0;
    }
  }

  function fitTimelineToAll() {
    if (!state.items.length) {
      state.minZoom = MIN_ZOOM;
      state.fitZoom = MIN_ZOOM;
      state.pan = 0;
      const previousZoom = state.zoom;
      setZoom(MIN_ZOOM);
      if (state.zoom === previousZoom) render();
      return;
    }
    autoCenter({ preserveZoom: true, preservePan: false });
    const previousZoom = state.zoom;
    setZoom(state.fitZoom ?? state.minZoom ?? MIN_ZOOM);
    if (state.zoom === previousZoom) render();
  }

async function finishExport() {
    try {
      const mod = await import(
        "https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.esm.js"
      );
      const dataUrl = await mod.toPng(root, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${state.title.replace(/\s+/g, "_")}_timeline.png`;
      link.click();
    } catch (err) {
      window.alert("Export failed (html-to-image not available).");
    }
  }

  function render() {
    if (!root) return;
    state.width = timelineOuter.clientWidth || state.width;
    svgEl.setAttribute("viewBox", `0 0 ${state.width} ${DEFAULT_HEIGHT}`);

    const minT =
      state.items.length > 0
        ? Math.min(...state.items.map((item) => item.start))
        : Date.now() - 3_600_000;
    const maxT =
      state.items.length > 0
        ? Math.max(...state.items.map((item) => item.end ?? item.start))
        : Date.now() + 3_600_000;

    const spanMs = Math.max(1, maxT - minT);
    const pxPerMsBase = Math.max(0.0003, state.width / Math.max(1000, spanMs));
    const pxPerMs = pxPerMsBase * state.zoom;
    const xOf = (timestamp) =>
      Math.round((timestamp - minT) * pxPerMs + state.pan + PX_PADDING);

    while (axisGroup.firstChild) axisGroup.removeChild(axisGroup.firstChild);
    while (tsiGroup.firstChild) tsiGroup.removeChild(tsiGroup.firstChild);
    while (itemsGroup.firstChild) itemsGroup.removeChild(itemsGroup.firstChild);
    while (overlayEl.firstChild) overlayEl.removeChild(overlayEl.firstChild);

    timelineOuter.querySelector("rect")?.setAttribute("width", String(state.width));

    const { ticks, minors, stepMs } = buildTicks(minT, maxT, state.width, pxPerMs);

    for (const tMinor of minors) {
      const g = createSvg("g");
      g.setAttribute("transform", `translate(${xOf(tMinor)},0)`);
      const line = createSvg("rect");
      line.setAttribute("x", "0");
      line.setAttribute("y", "312");
      line.setAttribute("width", "1");
      line.setAttribute("height", "24");
      line.setAttribute("fill", "#18223d");
      g.appendChild(line);
      axisGroup.appendChild(g);
    }

    for (const timestamp of ticks) {
      const g = createSvg("g");
      g.setAttribute("transform", `translate(${xOf(timestamp)},0)`);

      const line = createSvg("rect");
      line.setAttribute("x", "0");
      line.setAttribute("y", "300");
      line.setAttribute("width", "1");
      line.setAttribute("height", "60");
      line.setAttribute("fill", "#1c2746");
      g.appendChild(line);

      const { line1, line2 } = formatTickLines(timestamp, stepMs);
      const label1 = createSvg("text");
      label1.setAttribute("x", "4");
      label1.setAttribute("y", "314");
      label1.setAttribute("fill", "#9fb0d9");
      label1.setAttribute("font-size", "11");
      label1.textContent = line1;
      g.appendChild(label1);

      if (line2) {
        const label2 = createSvg("text");
        label2.setAttribute("x", "4");
        label2.setAttribute("y", "330");
        label2.setAttribute("fill", "#3c4a77");
        label2.setAttribute("font-size", "10");
        label2.textContent = line2;
        g.appendChild(label2);
      }

      axisGroup.appendChild(g);
    }

    const pill = document.createElement("div");
    pill.textContent = `1 div = ${formatDurationShort(stepMs)}`;
    pill.style.position = "absolute";
    pill.style.top = "8px";
    pill.style.right = "10px";
    pill.style.padding = "2px 8px";
    pill.style.border = "1px solid #22335f";
    pill.style.borderRadius = "999px";
    pill.style.background = "#0b1227cc";
    pill.style.color = "#cfe1ff";
    pill.style.fontSize = "11px";
    pill.style.fontFamily =
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
    pill.style.pointerEvents = "none";
    overlayEl.appendChild(pill);

    if (state.tsiOn) {
      state.tsiSeries = mockTsi(minT, maxT);
    }

    if (state.tsiOn && state.tsiSeries.length > 1) {
      const polyline = createSvg("polyline");
      const pts = state.tsiSeries
        .map((p) => `${xOf(p.t)},${120 - (p.tsi - 1361) * 60}`)
        .join(" ");
      polyline.setAttribute("fill", "none");
      polyline.setAttribute("stroke", "url(#tsiGradient)");
      polyline.setAttribute("stroke-width", "2");
      polyline.setAttribute("points", pts);
      tsiGroup.appendChild(polyline);
    }

    for (const item of state.items) {
      const x = xOf(item.start);
      const x2 = xOf(item.end ?? item.start);
      const y = 220 + ((hash(item.id) % 80) - 40);
      const color = pickColor(item.kind);

      if (item.durationMs && item.durationMs > 0) {
        const rect = createSvg("rect");
        rect.setAttribute("x", String(Math.min(x, x2)));
        rect.setAttribute("y", String(y - 12));
        rect.setAttribute("width", String(Math.max(4, Math.abs(x2 - x))));
        rect.setAttribute("height", "24");
        rect.setAttribute("rx", "6");
        rect.setAttribute("fill", `${color}33`);
        rect.setAttribute("stroke", color);
        rect.setAttribute("stroke-width", "1");
        itemsGroup.appendChild(rect);

        const point = createSvg("circle");
        point.setAttribute("cx", String(x));
        point.setAttribute("cy", String(y));
        point.setAttribute("r", "3");
        point.setAttribute("fill", color);
        itemsGroup.appendChild(point);
      } else {
        const point = createSvg("circle");
        point.setAttribute("cx", String(x));
        point.setAttribute("cy", String(y));
        point.setAttribute("r", "5");
        point.setAttribute("fill", color);
        point.setAttribute("stroke", "#0b0f18");
        point.setAttribute("stroke-width", "1");
        itemsGroup.appendChild(point);
      }

      const label = document.createElement("div");
      label.textContent = `${item.name} • ${formatIso(item.start)}${
        item.durationMs ? ` • ${Math.round(item.durationMs / 1000)}s` : ""
      }`;
      const tooltipParts = [];
      if (item.note) tooltipParts.push(item.note);
      if (item.celestial?.text) tooltipParts.push(item.celestial.text);
      label.title = tooltipParts.join("\n");
      label.style.position = "absolute";
      label.style.left = `${x + 8}px`;
      label.style.top = `${y - 22}px`;
      label.style.pointerEvents = "auto";
      label.style.background = "#101733cc";
      label.style.border = "1px solid #23335f";
      label.style.borderRadius = "8px";
      label.style.padding = "2px 6px";
      label.style.color = "#dfe6ff";
      label.style.fontSize = "12px";
      label.style.whiteSpace = "nowrap";

      label.addEventListener("click", () => {
        state.selection = item.id;
        render();
      });

      label.addEventListener("dblclick", () => {
        editItem(item);
      });

      overlayEl.appendChild(label);
    }

    renderDetails();
  }

  function renderDetails() {
    detailsEl.innerHTML = "";
    if (!state.selection) {
      const text = document.createElement("div");
      text.style.color = "#9fb0d9";
      text.textContent = "Select a pin or span to see details.";
      detailsEl.appendChild(text);
      return;
    }
    const item = state.items.find((entry) => entry.id === state.selection);
    if (!item) {
      state.selection = null;
      renderDetails();
      return;
    }
    const card = document.createElement("div");
    card.style.background = "#0e1324";
    card.style.border = "1px solid #1b2547";
    card.style.padding = "10px";
    card.style.borderRadius = "10px";

    const name = document.createElement("div");
    name.style.color = "#ffffff";
    name.style.marginBottom = "4px";
    name.textContent = item.name;
    card.appendChild(name);

    const time = document.createElement("div");
    time.style.color = "#9fb0d9";
    time.style.fontFamily = "ui-monospace";
    time.textContent = `${formatIso(item.start)}${
      item.durationMs
        ? ` → ${formatIso(item.end ?? item.start)}`
        : ""
    }`;
    card.appendChild(time);

    if (item.celestial?.text) {
      const celestial = document.createElement("div");
      celestial.style.marginTop = "6px";
      celestial.style.color = "#cfe1ff";
      celestial.textContent = item.celestial.text;
      card.appendChild(celestial);
    }

    if (item.kind === "journal" && item.note) {
      const noteBlock = document.createElement("div");
      noteBlock.style.marginTop = "10px";
      noteBlock.style.color = "#dfe6ff";
      noteBlock.style.lineHeight = "1.4";
      noteBlock.textContent = item.note;
      card.appendChild(noteBlock);
    }

    const actions = document.createElement("div");
    actions.style.marginTop = "6px";

    const editBtn = makeButton("Edit time");
    editBtn.addEventListener("click", () => editItem(item));
    actions.appendChild(editBtn);

    const removeBtn = makeButton("Remove");
    removeBtn.style.marginLeft = "8px";
    removeBtn.style.background = "#311a1a";
    removeBtn.style.border = "1px solid #4a2020";
    removeBtn.style.color = "#ffd7d7";
    removeBtn.addEventListener("click", () => removeItem(item));
    actions.appendChild(removeBtn);

    card.appendChild(actions);
    detailsEl.appendChild(card);
  }

  function editItem(item) {
    const iso = window.prompt(
      "Edit start (ISO 8601, e.g. 2025-01-15T23:12:00Z)",
      new Date(item.start).toISOString()
    );
    if (!iso) return;
    const parsed = Date.parse(iso);
    if (!Number.isFinite(parsed)) {
      window.alert("Invalid date.");
      return;
    }
    item.start = parsed;
    if (item.durationMs) {
      item.end = parsed + item.durationMs;
    }
    state.items = [...state.items].sort((a, b) => a.start - b.start);
    render();
  }

  function removeItem(item) {
    state.items = state.items.filter((entry) => entry.id !== item.id);
    if (item.url) URL.revokeObjectURL(item.url);
    if (state.selection === item.id) state.selection = null;
    render();
  }

  function createSvg(tag) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function uid() {
    return Math.random().toString(36).slice(2);
  }

  function formatIso(timestamp) {
    return new Date(timestamp).toISOString().replace(".000Z", "Z");
  }

  // ────────────── Scale helpers (adaptive tick step + labels) ──────────────
  function pickTickStepMs(pxPerMs) {
    for (const step of TIME_STEPS_MS) {
      const px = step * pxPerMs;
      if (px >= TICK_PX_MIN && px <= TICK_PX_MAX) return step;
    }
    const largest = TIME_STEPS_MS[TIME_STEPS_MS.length - 1];
    return largest * pxPerMs < TICK_PX_MIN ? largest : TIME_STEPS_MS[0];
  }

  function formatDurationShort(ms) {
    const abs = Math.abs(ms);
    if (abs < SEC) return `${ms} ms`;
    if (abs < MIN) {
      const secs = ms / SEC;
      return `${secs.toFixed(secs % 1 ? 1 : 0)} s`;
    }
    if (abs < HOUR) {
      const mins = ms / MIN;
      return `${mins.toFixed(mins % 1 ? 1 : 0)} min`;
    }
    if (abs < DAY) {
      const hours = ms / HOUR;
      return `${hours.toFixed(hours % 1 ? 1 : 0)} h`;
    }
    if (abs < YEAR) {
      const days = ms / DAY;
      return `${days.toFixed(days % 1 ? 1 : 0)} d`;
    }
    const years = ms / YEAR;
    if (years < 100) return `${years.toFixed(years % 1 ? 1 : 0)} yr`;
    const centuries = years / 100;
    return `${centuries.toFixed(centuries % 1 ? 1 : 0)} century`;
  }

  function formatTickLines(ts, stepMs) {
    const d = new Date(ts);
    const iso = d.toISOString();
    const Y = iso.slice(0, 4);
    const M = iso.slice(5, 7);
    const D = iso.slice(8, 10);
    const hms = iso.slice(11, 19);
    const ms = iso.slice(20, 23);
    if (stepMs < SEC) {
      return { line1: `${Y}-${M}-${D}`, line2: `${hms}.${ms}` };
    }
    if (stepMs < MIN) {
      return { line1: `${Y}-${M}-${D}`, line2: hms };
    }
    if (stepMs < DAY) {
      return { line1: `${Y}-${M}-${D}`, line2: hms.slice(0, 5) };
    }
    if (stepMs < YEAR) {
      return { line1: `${Y}-${M}-${D}`, line2: "" };
    }
    if (stepMs < 10 * YEAR) {
      return { line1: `Year ${Y}`, line2: "" };
    }
    if (stepMs < 100 * YEAR) {
      return { line1: `${Y}s`, line2: "" };
    }
    return { line1: `${Math.floor(Number(Y) / 100)}00s`, line2: "" };
  }

  function pickColor(kind) {
    switch (kind) {
      case "audio":
      case "vocal":
        return "#7bdcf3";
      case "photo":
        return "#ffd26a";
      case "lyrics":
        return "#c3a6ff";
      case "journal":
        return "#6699ff";
      default:
        return "#bfc9e6";
    }
  }

  async function haloSummarizeSpan(tStart, tEnd) {
    try {
      if (window.HaloPeri) {
        const series =
          window.HaloPeri.series?.span ||
          (await window.buildSpanSeries?.(tStart, tEnd)) ||
          null;

        const merc = window.accrueGR_arcsec?.("mercury", tStart, tEnd);
        const earth = window.accrueGR_arcsec?.("earth", tStart, tEnd);
        const einNs = window.integrateEinsteinRelative_ns?.(series?.span);

        const parts = [];
        if (typeof merc?.arcsec === "number") {
          parts.push(`Mercury GR +${merc.arcsec.toFixed(2)}″`);
        }
        if (typeof earth?.arcsec === "number") {
          parts.push(`Earth GR +${earth.arcsec.toFixed(2)}″`);
        }
        if (Number.isFinite(einNs)) {
          parts.push(`Einstein redshift ${signed(einNs, 2)} ns`);
        }

        const extrema = (() => {
          const span = series?.span || [];
          for (let i = 1; i < span.length - 1; i++) {
            const prev = span[i - 1];
            const curr = span[i];
            const next = span[i + 1];
            if (!curr || !prev || !next) continue;
            if (curr.t >= tStart && curr.t <= tEnd) {
              if (curr.r < prev.r && curr.r < next.r) return "Perihelion";
              if (curr.r > prev.r && curr.r > next.r) return "Aphelion";
            }
          }
          return null;
        })();

        const text = [extrema, ...parts].filter(Boolean).join(" • ");
        if (text) return { text };
      }
    } catch (err) {
      console.warn("HaloBank summary failed:", err);
    }

    const days = Math.max(1, Math.round((tEnd - tStart) / 86_400_000));
    return {
      text: `Span ${days} day${days === 1 ? "" : "s"} • sky state summary (site-aware) available in HaloBank`,
    };
  }

  function signed(value, dp = 1) {
    const prefix = value >= 0 ? "+" : "";
    return `${prefix}${Math.abs(value).toFixed(dp)}`;
  }

  async function readExifDate(file) {
    try {
      const exifrMod = await import(
        "https://cdn.jsdelivr.net/npm/exifr@7.1.3/dist/lite.umd.min.js"
      );
      const parse =
        exifrMod?.parse ||
        exifrMod?.default?.parse ||
        (typeof exifrMod === "function" ? exifrMod : null);
      if (!parse) return undefined;
      const meta = await parse(file, { tiff: true, ifd0: true, exif: true });
      const dt =
        meta?.DateTimeOriginal ||
        meta?.CreateDate ||
        meta?.ModifyDate ||
        meta?.DateTime;
      if (dt) {
        const parsed = new Date(dt).getTime();
        if (Number.isFinite(parsed)) return parsed;
      }
    } catch (err) {
      console.warn("EXIF parse failed", err);
    }
    return undefined;
  }

  async function readId3(file) {
    try {
      const mm = await import(
        "https://cdn.jsdelivr.net/npm/music-metadata-browser@2.5.10/dist/music-metadata-browser.min.js"
      );
      const parseBlob =
        mm?.parseBlob ||
        mm?.default?.parseBlob ||
        (typeof mm === "function" ? mm : null);
      if (!parseBlob) return undefined;
      const meta = await parseBlob(file);
      const tdrc = meta?.common?.date || meta?.common?.year;
      const date = tdrc ? new Date(tdrc).getTime() : undefined;
      let duration = meta?.format?.duration
        ? meta.format.duration * 1000
        : undefined;
      if (!duration) {
        const url = URL.createObjectURL(file);
        duration = await new Promise((resolve) => {
          const audio = new Audio();
          audio.src = url;
          audio.addEventListener(
            "loadedmetadata",
            () => {
              resolve(
                Number.isFinite(audio.duration)
                  ? audio.duration * 1000
                  : undefined
              );
            },
            { once: true }
          );
          audio.addEventListener("error", () => resolve(undefined), {
            once: true,
          });
        });
        URL.revokeObjectURL(url);
      }
      return { date, duration };
    } catch (err) {
      console.warn("ID3 parse failed", err);
    }
    return undefined;
  }

  function buildTicks(minT, maxT, width, pxPerMs) {
    const step = pickTickStepMs(pxPerMs);
    const first = Math.ceil(minT / step) * step;
    const ticks = [];
    for (let t = first; t <= maxT; t += step) {
      ticks.push(t);
    }
    const minors = [];
    const minorStep = step / 5;
    if (minorStep * pxPerMs >= 14) {
      const firstMinor = Math.ceil(minT / minorStep) * minorStep;
      for (let t = firstMinor; t <= maxT; t += minorStep) {
        const ratio = t / step;
        if (Math.abs(Math.round(ratio) - ratio) > 1e-6) {
          minors.push(t);
        }
      }
    }
    return { ticks, minors, stepMs: step };
  }

  function mockTsi(minT, maxT) {
    const out = [];
    const day = 86_400_000;
    const amplitude = 0.6;
    const base = 1361;
    for (let t = Math.floor(minT / day) * day; t <= maxT; t += day) {
      const years = t / day / 365.25;
      const tsi = base + amplitude * Math.sin((2 * Math.PI * years) / 11);
      out.push({ t, tsi });
    }
    return out;
  }

  function hash(value) {
    let h = 0;
    for (let i = 0; i < value.length; i++) {
      h = (h << 5) - h + value.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  function mountTimeline() {
    const node = document.getElementById("spore-timeline-root");
    if (!node || node.dataset.sporeTimelineMounted) return Boolean(node);
    node.dataset.sporeTimelineMounted = "true";
    init(node);
    return true;
  }

  if (!mountTimeline()) {
    const observer = new MutationObserver(() => {
      if (mountTimeline()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.addEventListener("beforeunload", () => {
    try {
      for (const item of state.items) {
        if (item?.url) URL.revokeObjectURL(item.url);
      }
    } catch {}
  });
})();
