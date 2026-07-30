(function startVoronoiFieldLab() {
  "use strict";

  const VERSION = "0.1.1";
  const STORAGE_KEY = "epsilonlab.voronoi-field-lab.v0.1.1";
  const LEGACY_STORAGE_KEYS = ["epsilonlab.voronoi-field-lab.v0.1.0"];
  const MAX_POINTS = 30;
  const FIELD_ASPECT = 5 / 3;
  const MIN_POINT_DISTANCE = 0.018;
  const COLORS = [
    "#6c5ce7", "#2f9f95", "#e28a46", "#d75a78", "#477bc2",
    "#81a84d", "#9b67b8", "#d0a62f", "#3f9fc0", "#b86445",
    "#5d6fd1", "#4eaa77", "#c7689e", "#8c7b4b", "#4f8f9d",
  ];

  const core = window.VoronoiCore;
  if (!core) {
    throw new Error("VoronoiCoreを読み込めませんでした。");
  }

  const elements = {
    canvas: document.getElementById("voronoiCanvas"),
    canvasFrame: document.getElementById("canvasFrame"),
    canvasHint: document.getElementById("canvasHint"),
    statusText: document.getElementById("statusText"),
    modeButtons: Array.from(document.querySelectorAll("[data-mode]")),
    undoButton: document.getElementById("undoButton"),
    exportButton: document.getElementById("exportButton"),
    presetSelect: document.getElementById("presetSelect"),
    presetGuideTitle: document.getElementById("presetGuideTitle"),
    presetGuideText: document.getElementById("presetGuideText"),
    randomCount: document.getElementById("randomCount"),
    randomButton: document.getElementById("randomButton"),
    clearButton: document.getElementById("clearButton"),
    selectionInfo: document.getElementById("selectionInfo"),
    deleteButton: document.getElementById("deleteButton"),
    fieldWidthInput: document.getElementById("fieldWidthInput"),
    unitSelect: document.getElementById("unitSelect"),
    fillToggle: document.getElementById("fillToggle"),
    pointLabelToggle: document.getElementById("pointLabelToggle"),
    areaToggle: document.getElementById("areaToggle"),
    pointCountStat: document.getElementById("pointCountStat"),
    fieldSizeStat: document.getElementById("fieldSizeStat"),
    meanAreaStat: document.getElementById("meanAreaStat"),
    probeStat: document.getElementById("probeStat"),
    regionTableBody: document.getElementById("regionTableBody"),
    toast: document.getElementById("toast"),
  };

  const context = elements.canvas.getContext("2d");
  let canvasMetrics = { width: 0, height: 0, dpr: 1 };
  let cells = [];
  let cellAreas = [];
  let toastTimer = null;
  let dragState = null;
  let pendingAdd = null;
  let nextUid = 1;

  const state = {
    points: [],
    selectedUid: null,
    mode: "edit",
    probe: null,
    unit: "km",
    fieldWidthMeters: 10000,
    showFill: true,
    showPointLabels: true,
    showAreas: true,
    preset: "sample",
    history: [],
  };

  const presets = {
    sample: [
      { x: 0.20, y: 0.27 },
      { x: 0.72, y: 0.23 },
      { x: 0.34, y: 0.73 },
      { x: 0.79, y: 0.70 },
    ],
    bisector: [
      { x: 0.29, y: 0.50 },
      { x: 0.71, y: 0.50 },
    ],
    territory: [
      { x: 0.14, y: 0.22 },
      { x: 0.39, y: 0.18 },
      { x: 0.68, y: 0.24 },
      { x: 0.86, y: 0.44 },
      { x: 0.66, y: 0.72 },
      { x: 0.35, y: 0.78 },
      { x: 0.13, y: 0.59 },
    ],
    cluster: [
      { x: 0.18, y: 0.22 },
      { x: 0.24, y: 0.31 },
      { x: 0.31, y: 0.21 },
      { x: 0.27, y: 0.40 },
      { x: 0.72, y: 0.28 },
      { x: 0.84, y: 0.68 },
      { x: 0.56, y: 0.77 },
    ],
    grid: [
      { x: 0.17, y: 0.25 },
      { x: 0.50, y: 0.25 },
      { x: 0.83, y: 0.25 },
      { x: 0.17, y: 0.75 },
      { x: 0.50, y: 0.75 },
      { x: 0.83, y: 0.75 },
    ],
  };

  const presetGuides = {
    sample: {
      title: "基本の4点",
      text: "点を1つ動かしたとき、どの境界が動き、どの境界はほとんど変わらないでしょうか。",
    },
    bisector: {
      title: "2点の境界",
      text: "境界が2点のちょうど中間を通り、2点を結ぶ線に直角になることを確かめてみましょう。",
    },
    territory: {
      title: "巣を中心にした縄張りモデル",
      text: "各点を巣やねぐらと見立てます。点が密集すると、仮の縄張りが狭くなる様子を観察できます。",
    },
    cluster: {
      title: "密集と孤立",
      text: "密集した点と孤立した点では、領域の広さにどのような違いが生まれるでしょうか。",
    },
    grid: {
      title: "ほぼ均等な配置",
      text: "点を規則的に並べると、領域の形や面積がどこまでそろうか比べてみましょう。",
    },
    custom: {
      title: "自由配置",
      text: "点を1つ追加または移動したとき、変化するのはどの領域でしょうか。近くの点との関係に注目してみましょう。",
    },
  };

  function createPoint(x, y) {
    return {
      uid: nextUid++,
      x: clamp(x, 0.015, 0.985),
      y: clamp(y, 0.015, 0.985),
    };
  }

  function clonePoints(points) {
    return points.map((point) => ({ uid: point.uid, x: point.x, y: point.y }));
  }

  function snapshot() {
    return {
      points: clonePoints(state.points),
      selectedUid: state.selectedUid,
      probe: state.probe ? { x: state.probe.x, y: state.probe.y } : null,
      fieldWidthMeters: state.fieldWidthMeters,
      unit: state.unit,
      showFill: state.showFill,
      showPointLabels: state.showPointLabels,
      showAreas: state.showAreas,
      preset: state.preset,
    };
  }

  function pushHistory() {
    state.history.push(snapshot());
    if (state.history.length > 60) {
      state.history.shift();
    }
    elements.undoButton.disabled = false;
  }

  function restoreSnapshot(saved) {
    state.points = clonePoints(saved.points);
    state.selectedUid = saved.selectedUid;
    state.probe = saved.probe ? { x: saved.probe.x, y: saved.probe.y } : null;
    state.fieldWidthMeters = saved.fieldWidthMeters;
    state.unit = saved.unit;
    state.showFill = saved.showFill;
    state.showPointLabels = saved.showPointLabels;
    state.showAreas = saved.showAreas;
    state.preset = presetGuides[saved.preset] ? saved.preset : "custom";
    nextUid = Math.max(1, ...state.points.map((point) => point.uid + 1));
    syncControlsFromState();
    persistState();
    updateAll();
  }

  function undo() {
    const saved = state.history.pop();
    if (!saved) {
      return;
    }
    restoreSnapshot(saved);
    elements.undoButton.disabled = state.history.length === 0;
    announce("1つ前の状態に戻しました。");
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function formatNumber(value, maximumFractionDigits) {
    return new Intl.NumberFormat("ja-JP", {
      maximumFractionDigits,
      minimumFractionDigits: 0,
    }).format(value);
  }

  function unitFactor() {
    return state.unit === "km" ? 1000 : 1609.344;
  }

  function unitLabel() {
    return state.unit === "km" ? "km" : "mile";
  }

  function areaUnitLabel() {
    return state.unit === "km" ? "km²" : "mile²";
  }

  function fieldWidthInCurrentUnit() {
    return state.fieldWidthMeters / unitFactor();
  }

  function fieldHeightMeters() {
    return state.fieldWidthMeters / FIELD_ASPECT;
  }

  function fieldHeightInCurrentUnit() {
    return fieldHeightMeters() / unitFactor();
  }

  function normalizedAreaToCurrentUnit(area) {
    const areaSquareMeters = area * state.fieldWidthMeters * fieldHeightMeters();
    const factor = unitFactor();
    return areaSquareMeters / (factor * factor);
  }

  function normalizedDistanceToCurrentUnit(dx, dy) {
    const physicalX = dx * state.fieldWidthMeters;
    const physicalY = dy * fieldHeightMeters();
    return Math.hypot(physicalX, physicalY) / unitFactor();
  }

  function pointIndexByUid(uid) {
    return state.points.findIndex((point) => point.uid === uid);
  }

  function selectedPoint() {
    const index = pointIndexByUid(state.selectedUid);
    return index >= 0 ? state.points[index] : null;
  }

  function pointColor(index, alpha) {
    const hex = COLORS[index % COLORS.length];
    if (typeof alpha !== "number") {
      return hex;
    }
    const red = Number.parseInt(hex.slice(1, 3), 16);
    const green = Number.parseInt(hex.slice(3, 5), 16);
    const blue = Number.parseInt(hex.slice(5, 7), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  function distanceMetric() {
    return { xScale: FIELD_ASPECT, yScale: 1 };
  }

  function computeGeometry() {
    cells = core.computeCells(state.points, undefined, distanceMetric());
    cellAreas = cells.map((polygon) => core.polygonArea(polygon));
  }

  function resizeCanvas() {
    const rectangle = elements.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const width = Math.max(1, Math.round(rectangle.width));
    const height = Math.max(1, Math.round(rectangle.height));

    if (
      canvasMetrics.width === width
      && canvasMetrics.height === height
      && canvasMetrics.dpr === dpr
    ) {
      return;
    }

    canvasMetrics = { width, height, dpr };
    elements.canvas.width = Math.round(width * dpr);
    elements.canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function drawGrid(ctx, width, height) {
    ctx.save();
    ctx.strokeStyle = "rgba(16, 24, 45, 0.055)";
    ctx.lineWidth = 1;
    const columns = 10;
    const rows = 6;
    for (let column = 1; column < columns; column += 1) {
      const x = (column / columns) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let row = 1; row < rows; row += 1) {
      const y = (row / rows) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function tracePolygon(ctx, polygon, width, height) {
    if (!polygon.length) {
      return false;
    }
    ctx.beginPath();
    ctx.moveTo(polygon[0].x * width, polygon[0].y * height);
    for (let index = 1; index < polygon.length; index += 1) {
      ctx.lineTo(polygon[index].x * width, polygon[index].y * height);
    }
    ctx.closePath();
    return true;
  }

  function drawScale(ctx, width, height) {
    const scaleNormalized = 0.2;
    const scaleValue = fieldWidthInCurrentUnit() * scaleNormalized;
    const left = 22;
    const y = height - 20;
    const lineWidth = Math.max(48, width * scaleNormalized);

    ctx.save();
    ctx.strokeStyle = "rgba(16, 24, 45, 0.78)";
    ctx.fillStyle = "rgba(16, 24, 45, 0.78)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + lineWidth, y);
    ctx.moveTo(left, y - 5);
    ctx.lineTo(left, y + 5);
    ctx.moveTo(left + lineWidth, y - 5);
    ctx.lineTo(left + lineWidth, y + 5);
    ctx.stroke();
    ctx.font = "700 11px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${formatNumber(scaleValue, scaleValue < 10 ? 2 : 1)} ${unitLabel()}`, left + (lineWidth / 2), y - 4);
    ctx.restore();
  }

  function drawProbe(ctx, width, height) {
    if (!state.probe || !state.points.length) {
      return;
    }

    const nearest = core.nearestPoint(state.points, state.probe, distanceMetric());
    if (!nearest) {
      return;
    }

    const probeX = state.probe.x * width;
    const probeY = state.probe.y * height;
    const pointX = nearest.point.x * width;
    const pointY = nearest.point.y * height;
    const displayIndex = nearest.index + 1;
    const distance = normalizedDistanceToCurrentUnit(
      state.probe.x - nearest.point.x,
      state.probe.y - nearest.point.y,
    );

    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = pointColor(nearest.index, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(probeX, probeY);
    ctx.lineTo(pointX, pointY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#10182d";
    ctx.beginPath();
    ctx.arc(probeX, probeY, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    const label = `点${displayIndex}まで ${formatNumber(distance, distance < 10 ? 2 : 1)} ${unitLabel()}`;
    ctx.font = "800 12px -apple-system, BlinkMacSystemFont, sans-serif";
    const textWidth = ctx.measureText(label).width;
    const boxWidth = textWidth + 20;
    const boxHeight = 30;
    const boxX = clamp(probeX + 10, 6, width - boxWidth - 6);
    const boxY = clamp(probeY - 38, 6, height - boxHeight - 6);

    ctx.fillStyle = "rgba(16, 24, 45, 0.92)";
    roundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 8);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, boxX + 10, boxY + (boxHeight / 2));
    ctx.restore();
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function renderToContext(ctx, width, height, options) {
    const config = options || {};
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    drawGrid(ctx, width, height);

    cells.forEach((polygon, index) => {
      if (!polygon.length) {
        return;
      }
      if (tracePolygon(ctx, polygon, width, height)) {
        if (state.showFill) {
          ctx.fillStyle = pointColor(index, 0.22);
          ctx.fill();
        }
        ctx.strokeStyle = state.points[index].uid === state.selectedUid
          ? pointColor(index)
          : "rgba(16, 24, 45, 0.48)";
        ctx.lineWidth = state.points[index].uid === state.selectedUid ? 3 : 1.35;
        ctx.stroke();
      }
    });

    cells.forEach((polygon, index) => {
      if (!polygon.length || !state.showAreas) {
        return;
      }
      const point = state.points[index];
      const centroid = core.polygonCentroid(polygon, point);
      const area = normalizedAreaToCurrentUnit(cellAreas[index]);
      const label = `${formatNumber(area, area < 10 ? 2 : 1)} ${areaUnitLabel()}`;
      const x = centroid.x * width;
      const y = centroid.y * height;

      ctx.font = `${Math.max(10, width * 0.013)}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const textWidth = ctx.measureText(label).width;
      const boxWidth = textWidth + 14;
      const boxHeight = Math.max(20, width * 0.026);
      ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
      roundedRect(ctx, x - (boxWidth / 2), y - (boxHeight / 2), boxWidth, boxHeight, 7);
      ctx.fill();
      ctx.fillStyle = "rgba(16, 24, 45, 0.82)";
      ctx.fillText(label, x, y + 0.5);
    });

    state.points.forEach((point, index) => {
      const x = point.x * width;
      const y = point.y * height;
      const selected = point.uid === state.selectedUid;
      const radius = selected ? Math.max(8, width * 0.012) : Math.max(6, width * 0.009);

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = pointColor(index);
      ctx.fill();
      ctx.lineWidth = selected ? 4 : 2.5;
      ctx.strokeStyle = selected ? "#10182d" : "#ffffff";
      ctx.stroke();

      if (state.showPointLabels) {
        ctx.fillStyle = "#ffffff";
        ctx.font = `900 ${Math.max(10, radius * 1.15)}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(index + 1), x, y + 0.5);
      }
    });

    drawScale(ctx, width, height);
    drawProbe(ctx, width, height);

    if (config.branding) {
      ctx.fillStyle = "rgba(16, 24, 45, 0.66)";
      ctx.font = "700 18px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText("Voronoi Field Lab | EpsilonLab", width - 22, height - 16);
    }

    ctx.restore();
  }

  function draw() {
    const { width, height, dpr } = canvasMetrics;
    if (!width || !height) {
      return;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderToContext(context, width, height, { branding: false });
  }

  function updateAll() {
    computeGeometry();
    draw();
    updateControls();
    updatePresetGuide();
    updateStats();
    updateRegionTable();
  }

  function updateControls() {
    elements.undoButton.disabled = state.history.length === 0;
    const selected = selectedPoint();
    elements.deleteButton.disabled = !selected;

    if (!selected) {
      elements.selectionInfo.innerHTML = "<strong>点を選択してください</strong><span>キャンバス上の点をクリックできます。</span>";
    } else {
      const index = pointIndexByUid(selected.uid);
      const x = (selected.x * state.fieldWidthMeters) / unitFactor();
      const y = ((1 - selected.y) * fieldHeightMeters()) / unitFactor();
      elements.selectionInfo.innerHTML = `<strong>点${index + 1}</strong><span>x = ${formatNumber(x, 2)} ${unitLabel()} / y = ${formatNumber(y, 2)} ${unitLabel()}</span>`;
    }

    elements.modeButtons.forEach((button) => {
      const active = button.dataset.mode === state.mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    elements.canvasFrame.dataset.mode = state.mode;
    if (state.mode === "edit") {
      elements.canvasHint.innerHTML = "<strong>編集モード</strong><span>空白をクリック: 追加 / 点をドラッグ: 移動</span>";
      elements.canvas.setAttribute("aria-label", "ボロノイ図の編集キャンバス。空白をクリックすると点を追加し、点をドラッグすると移動できます。");
    } else {
      elements.canvasHint.innerHTML = "<strong>最寄り調査</strong><span>好きな場所をクリックすると、いちばん近い点を表示</span>";
      elements.canvas.setAttribute("aria-label", "最寄りの点を調べるキャンバス。好きな場所をクリックしてください。");
    }
  }

  function updatePresetGuide() {
    const guide = presetGuides[state.preset] || presetGuides.custom;
    elements.presetSelect.value = state.preset;
    elements.presetGuideTitle.textContent = guide.title;
    elements.presetGuideText.textContent = guide.text;
  }

  function markCustomPreset() {
    state.preset = "custom";
  }

  function updateStats() {
    const pointCount = state.points.length;
    const fieldWidth = fieldWidthInCurrentUnit();
    const fieldHeight = fieldHeightInCurrentUnit();
    const totalArea = (state.fieldWidthMeters * fieldHeightMeters()) / (unitFactor() * unitFactor());
    const meanArea = pointCount ? totalArea / pointCount : 0;

    elements.pointCountStat.textContent = String(pointCount);
    elements.fieldSizeStat.textContent = `${formatNumber(fieldWidth, 2)} x ${formatNumber(fieldHeight, 2)} ${unitLabel()}`;
    elements.meanAreaStat.textContent = pointCount
      ? `${formatNumber(meanArea, meanArea < 10 ? 2 : 1)} ${areaUnitLabel()}`
      : "-";

    if (state.probe && pointCount) {
      const nearest = core.nearestPoint(state.points, state.probe, distanceMetric());
      const distance = normalizedDistanceToCurrentUnit(
        state.probe.x - nearest.point.x,
        state.probe.y - nearest.point.y,
      );
      elements.probeStat.textContent = `点${nearest.index + 1}: ${formatNumber(distance, distance < 10 ? 2 : 1)} ${unitLabel()}`;
    } else {
      elements.probeStat.textContent = "未選択";
    }

    elements.statusText.textContent = pointCount
      ? `${pointCount}個の点からボロノイ図を作成しています。`
      : "点がありません。キャンバスをクリックして追加してください。";
  }

  function updateRegionTable() {
    elements.regionTableBody.replaceChildren();
    const totalAreaNormalized = 1;

    state.points.forEach((point, index) => {
      const row = document.createElement("tr");
      row.className = "region-row";
      if (point.uid === state.selectedUid) {
        row.classList.add("is-selected");
      }
      row.tabIndex = 0;
      row.dataset.uid = String(point.uid);

      const area = normalizedAreaToCurrentUnit(cellAreas[index] || 0);
      const ratio = ((cellAreas[index] || 0) / totalAreaNormalized) * 100;
      row.innerHTML = `
        <td><span class="point-swatch point-color-${index % COLORS.length}"></span>点${index + 1}</td>
        <td>${formatNumber(area, area < 10 ? 2 : 1)} ${areaUnitLabel()}</td>
        <td>${formatNumber(ratio, 1)}%</td>
      `;
      row.addEventListener("click", () => selectPoint(point.uid));
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectPoint(point.uid);
        }
      });
      elements.regionTableBody.appendChild(row);
    });
  }

  function syncControlsFromState() {
    elements.unitSelect.value = state.unit;
    elements.fieldWidthInput.value = formatForInput(fieldWidthInCurrentUnit());
    elements.fillToggle.checked = state.showFill;
    elements.pointLabelToggle.checked = state.showPointLabels;
    elements.areaToggle.checked = state.showAreas;
    elements.presetSelect.value = state.preset;
  }

  function formatForInput(value) {
    return String(Math.round(value * 1000) / 1000);
  }

  function persistState() {
    try {
      const saved = {
        version: VERSION,
        points: clonePoints(state.points),
        fieldWidthMeters: state.fieldWidthMeters,
        unit: state.unit,
        showFill: state.showFill,
        showPointLabels: state.showPointLabels,
        showAreas: state.showAreas,
        preset: state.preset,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch (error) {
      // Private browsing or restricted storage can disable localStorage.
    }
  }

  function restorePersistedState() {
    try {
      const candidateKeys = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS];
      let saved = null;
      let sourceKey = null;

      for (const key of candidateKeys) {
        const raw = localStorage.getItem(key);
        if (!raw) {
          continue;
        }
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.points)) {
          saved = parsed;
          sourceKey = key;
          break;
        }
      }

      if (!saved) {
        return false;
      }

      state.points = saved.points
        .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
        .slice(0, MAX_POINTS)
        .map((point) => ({
          uid: Number.isInteger(point.uid) ? point.uid : nextUid++,
          x: clamp(point.x, 0.015, 0.985),
          y: clamp(point.y, 0.015, 0.985),
        }));
      state.fieldWidthMeters = Number.isFinite(saved.fieldWidthMeters)
        ? clamp(saved.fieldWidthMeters, 100, 10000000)
        : 10000;
      state.unit = saved.unit === "mi" ? "mi" : "km";
      state.showFill = saved.showFill !== false;
      state.showPointLabels = saved.showPointLabels !== false;
      state.showAreas = saved.showAreas !== false;
      state.preset = presetGuides[saved.preset] ? saved.preset : "custom";
      nextUid = Math.max(1, ...state.points.map((point) => point.uid + 1));

      if (sourceKey !== STORAGE_KEY) {
        persistState();
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  function applyPreset(name, shouldRecord) {
    const source = presets[name] || presets.sample;
    if (shouldRecord) {
      pushHistory();
    }
    state.points = source.map((point) => createPoint(point.x, point.y));
    state.preset = presetGuides[name] ? name : "sample";
    state.selectedUid = null;
    state.probe = null;
    persistState();
    updateAll();
    announce(`${state.points.length}点のサンプルを配置しました。`);
  }

  function randomPoints(count) {
    const targetCount = clamp(Math.round(count), 3, MAX_POINTS);
    const points = [];
    let attempts = 0;
    const relaxedMinimum = Math.max(0.045, 0.16 / Math.sqrt(targetCount));

    while (points.length < targetCount && attempts < 6000) {
      attempts += 1;
      const candidate = {
        x: 0.06 + (Math.random() * 0.88),
        y: 0.07 + (Math.random() * 0.86),
      };
      const valid = points.every((point) => Math.hypot(
        candidate.x - point.x,
        candidate.y - point.y,
      ) >= relaxedMinimum);
      if (valid || attempts > 5000) {
        points.push(candidate);
      }
    }

    return points.map((point) => createPoint(point.x, point.y));
  }

  function addPoint(position) {
    if (state.points.length >= MAX_POINTS) {
      announce(`点は最大${MAX_POINTS}個までです。`);
      return false;
    }
    if (isTooClose(position, null)) {
      announce("ほかの点に近すぎます。少し離れた場所を選んでください。");
      return false;
    }
    pushHistory();
    const point = createPoint(position.x, position.y);
    state.points.push(point);
    markCustomPreset();
    state.selectedUid = point.uid;
    state.probe = null;
    persistState();
    updateAll();
    announce(`点${state.points.length}を追加しました。`);
    return true;
  }

  function deleteSelected() {
    const index = pointIndexByUid(state.selectedUid);
    if (index < 0) {
      return;
    }
    pushHistory();
    state.points.splice(index, 1);
    markCustomPreset();
    state.selectedUid = null;
    state.probe = null;
    persistState();
    updateAll();
    announce("選択した点を削除しました。");
  }

  function clearAll() {
    if (!state.points.length) {
      return;
    }
    pushHistory();
    state.points = [];
    markCustomPreset();
    state.selectedUid = null;
    state.probe = null;
    persistState();
    updateAll();
    announce("すべての点を消しました。元に戻すこともできます。");
  }

  function selectPoint(uid) {
    state.selectedUid = uid;
    state.mode = "edit";
    updateAll();
    elements.canvas.focus({ preventScroll: true });
    const index = pointIndexByUid(uid);
    announce(`点${index + 1}を選択しました。`);
  }

  function isTooClose(position, ignoredUid) {
    return state.points.some((point) => (
      point.uid !== ignoredUid
      && Math.hypot(point.x - position.x, point.y - position.y) < MIN_POINT_DISTANCE
    ));
  }

  function canvasPosition(event) {
    const rectangle = elements.canvas.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rectangle.left) / rectangle.width, 0, 1),
      y: clamp((event.clientY - rectangle.top) / rectangle.height, 0, 1),
    };
  }

  function hitTestPoint(position) {
    if (!state.points.length) {
      return null;
    }
    const radiusX = 15 / Math.max(canvasMetrics.width, 1);
    const radiusY = 15 / Math.max(canvasMetrics.height, 1);
    let best = null;
    let bestScore = Number.POSITIVE_INFINITY;

    state.points.forEach((point) => {
      const dx = (point.x - position.x) / radiusX;
      const dy = (point.y - position.y) / radiusY;
      const score = (dx * dx) + (dy * dy);
      if (score <= 1 && score < bestScore) {
        best = point;
        bestScore = score;
      }
    });
    return best;
  }

  function onPointerDown(event) {
    if (event.button !== 0 && event.pointerType !== "touch") {
      return;
    }
    const position = canvasPosition(event);

    if (state.mode === "probe") {
      state.probe = position;
      state.selectedUid = null;
      updateAll();
      const nearest = core.nearestPoint(state.points, position, distanceMetric());
      if (nearest) {
        announce(`この場所に最も近いのは点${nearest.index + 1}です。`);
      } else {
        announce("点がないため、最寄りを調べられません。");
      }
      return;
    }

    const hit = hitTestPoint(position);
    if (hit) {
      pushHistory();
      state.selectedUid = hit.uid;
      state.probe = null;
      dragState = {
        pointerId: event.pointerId,
        uid: hit.uid,
        moved: false,
        startX: position.x,
        startY: position.y,
        originalX: hit.x,
        originalY: hit.y,
      };
      elements.canvas.setPointerCapture(event.pointerId);
      updateAll();
      event.preventDefault();
      return;
    }

    pendingAdd = {
      pointerId: event.pointerId,
      startX: position.x,
      startY: position.y,
    };
    elements.canvas.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }
    const position = canvasPosition(event);
    const distanceFromStart = Math.hypot(position.x - dragState.startX, position.y - dragState.startY);
    if (distanceFromStart > 0.002) {
      dragState.moved = true;
    }
    const point = state.points.find((candidate) => candidate.uid === dragState.uid);
    if (!point) {
      return;
    }
    const candidate = {
      x: clamp(position.x, 0.015, 0.985),
      y: clamp(position.y, 0.015, 0.985),
    };
    if (!isTooClose(candidate, point.uid)) {
      point.x = candidate.x;
      point.y = candidate.y;
      computeGeometry();
      draw();
      updateControls();
      updateStats();
      updateRegionTable();
    }
    event.preventDefault();
  }

  function onPointerUp(event) {
    if (dragState && dragState.pointerId === event.pointerId) {
      const point = state.points.find((candidate) => candidate.uid === dragState.uid);
      if (!dragState.moved && point) {
        state.history.pop();
        elements.undoButton.disabled = state.history.length === 0;
      } else {
        markCustomPreset();
        persistState();
        announce("点を移動しました。");
      }
      dragState = null;
      if (elements.canvas.hasPointerCapture(event.pointerId)) {
        elements.canvas.releasePointerCapture(event.pointerId);
      }
      updateAll();
      return;
    }

    if (pendingAdd && pendingAdd.pointerId === event.pointerId) {
      const position = canvasPosition(event);
      const moved = Math.hypot(position.x - pendingAdd.startX, position.y - pendingAdd.startY) > 0.006;
      pendingAdd = null;
      if (elements.canvas.hasPointerCapture(event.pointerId)) {
        elements.canvas.releasePointerCapture(event.pointerId);
      }
      if (!moved) {
        addPoint(position);
      }
    }
  }

  function onPointerCancel(event) {
    if (dragState && dragState.pointerId === event.pointerId) {
      const point = state.points.find((candidate) => candidate.uid === dragState.uid);
      if (point) {
        point.x = dragState.originalX;
        point.y = dragState.originalY;
      }
      state.history.pop();
      dragState = null;
      updateAll();
    }
    pendingAdd = null;
  }

  function moveSelectedByKeyboard(dx, dy) {
    const point = selectedPoint();
    if (!point) {
      return;
    }
    const candidate = {
      x: clamp(point.x + dx, 0.015, 0.985),
      y: clamp(point.y + dy, 0.015, 0.985),
    };
    if (isTooClose(candidate, point.uid)) {
      announce("ほかの点に近すぎるため移動できません。");
      return;
    }
    pushHistory();
    point.x = candidate.x;
    point.y = candidate.y;
    markCustomPreset();
    persistState();
    updateAll();
  }

  function onCanvasKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      undo();
      return;
    }
    if ((event.key === "Delete" || event.key === "Backspace") && selectedPoint()) {
      event.preventDefault();
      deleteSelected();
      return;
    }
    if (event.key === "Escape") {
      state.selectedUid = null;
      state.probe = null;
      updateAll();
      announce("選択を解除しました。");
      return;
    }

    const step = event.shiftKey ? 0.02 : 0.005;
    const movement = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }[event.key];
    if (movement && selectedPoint()) {
      event.preventDefault();
      moveSelectedByKeyboard(movement[0], movement[1]);
    }
  }

  function setMode(mode) {
    state.mode = mode === "probe" ? "probe" : "edit";
    state.selectedUid = null;
    if (state.mode === "edit") {
      state.probe = null;
    }
    updateAll();
    announce(state.mode === "edit" ? "点の編集モードに切り替えました。" : "最寄りを調べるモードに切り替えました。");
  }

  function setUnit(unit) {
    const nextUnit = unit === "mi" ? "mi" : "km";
    if (nextUnit === state.unit) {
      return;
    }
    state.unit = nextUnit;
    syncControlsFromState();
    persistState();
    updateAll();
    announce(`単位を${unitLabel()}に切り替えました。境界の形は変わりません。`);
  }

  function setFieldWidthFromInput() {
    const value = Number.parseFloat(elements.fieldWidthInput.value);
    if (!Number.isFinite(value) || value <= 0) {
      syncControlsFromState();
      announce("フィールドの横幅には0より大きい数を入力してください。");
      return;
    }
    const meters = value * unitFactor();
    state.fieldWidthMeters = clamp(meters, 100, 10000000);
    syncControlsFromState();
    persistState();
    updateAll();
    announce("フィールドのスケールを変更しました。図の形は変わりません。");
  }

  function exportPng() {
    const exportWidth = 2000;
    const exportHeight = Math.round(exportWidth / FIELD_ASPECT);
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = exportWidth;
    exportCanvas.height = exportHeight;
    const exportContext = exportCanvas.getContext("2d");
    renderToContext(exportContext, exportWidth, exportHeight, { branding: true });

    exportCanvas.toBlob((blob) => {
      if (!blob) {
        announce("PNG画像を作成できませんでした。");
        return;
      }
      const now = new Date();
      const stamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
        "-",
        String(now.getHours()).padStart(2, "0"),
        String(now.getMinutes()).padStart(2, "0"),
      ].join("");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `voronoi-field-lab-${stamp}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      announce("PNG画像を保存しました。");
    }, "image/png");
  }

  function announce(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      elements.toast.classList.remove("is-visible");
    }, 2300);
  }

  function bindEvents() {
    elements.modeButtons.forEach((button) => {
      button.addEventListener("click", () => setMode(button.dataset.mode));
    });
    elements.undoButton.addEventListener("click", undo);
    elements.exportButton.addEventListener("click", exportPng);
    elements.presetSelect.addEventListener("change", () => applyPreset(elements.presetSelect.value, true));
    elements.randomButton.addEventListener("click", () => {
      const count = Number.parseInt(elements.randomCount.value, 10);
      pushHistory();
      state.points = randomPoints(Number.isFinite(count) ? count : 8);
      markCustomPreset();
      state.selectedUid = null;
      state.probe = null;
      persistState();
      updateAll();
      announce(`${state.points.length}個の点をランダムに配置しました。`);
    });
    elements.clearButton.addEventListener("click", clearAll);
    elements.deleteButton.addEventListener("click", deleteSelected);
    elements.unitSelect.addEventListener("change", () => setUnit(elements.unitSelect.value));
    elements.fieldWidthInput.addEventListener("change", setFieldWidthFromInput);
    elements.fieldWidthInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        setFieldWidthFromInput();
        elements.fieldWidthInput.blur();
      }
    });

    elements.fillToggle.addEventListener("change", () => {
      state.showFill = elements.fillToggle.checked;
      persistState();
      draw();
    });
    elements.pointLabelToggle.addEventListener("change", () => {
      state.showPointLabels = elements.pointLabelToggle.checked;
      persistState();
      draw();
    });
    elements.areaToggle.addEventListener("change", () => {
      state.showAreas = elements.areaToggle.checked;
      persistState();
      draw();
    });

    elements.canvas.addEventListener("pointerdown", onPointerDown);
    elements.canvas.addEventListener("pointermove", onPointerMove);
    elements.canvas.addEventListener("pointerup", onPointerUp);
    elements.canvas.addEventListener("pointercancel", onPointerCancel);
    elements.canvas.addEventListener("keydown", onCanvasKeyDown);

    window.addEventListener("keydown", (event) => {
      const target = event.target;
      const isFormControl = target instanceof HTMLInputElement
        || target instanceof HTMLSelectElement
        || target instanceof HTMLTextAreaElement;
      if (!isFormControl && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      }
    });

    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(resizeCanvas);
      observer.observe(elements.canvasFrame);
    } else {
      window.addEventListener("resize", resizeCanvas);
    }
  }

  function initialize() {
    const restored = restorePersistedState();
    if (!restored) {
      state.points = presets.sample.map((point) => createPoint(point.x, point.y));
      state.preset = "sample";
    }
    syncControlsFromState();
    bindEvents();
    computeGeometry();
    resizeCanvas();
    updateAll();
  }

  initialize();
}());
