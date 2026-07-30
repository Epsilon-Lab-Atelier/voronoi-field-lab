"use strict";

const assert = require("node:assert/strict");
const core = require("../assets/js/voronoi-core.js");

function nearlyEqual(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
}

const onePoint = [{ x: 0.5, y: 0.5 }];
const oneCell = core.computeCells(onePoint);
assert.equal(oneCell.length, 1);
nearlyEqual(core.polygonArea(oneCell[0]), 1);

const twoPoints = [
  { x: 0.25, y: 0.5 },
  { x: 0.75, y: 0.5 },
];
const twoCells = core.computeCells(twoPoints);
nearlyEqual(core.polygonArea(twoCells[0]), 0.5);
nearlyEqual(core.polygonArea(twoCells[1]), 0.5);

const fourPoints = [
  { x: 0.25, y: 0.25 },
  { x: 0.75, y: 0.25 },
  { x: 0.25, y: 0.75 },
  { x: 0.75, y: 0.75 },
];
const fourCells = core.computeCells(fourPoints);
const totalArea = fourCells.reduce((sum, polygon) => sum + core.polygonArea(polygon), 0);
nearlyEqual(totalArea, 1, 1e-8);
fourCells.forEach((polygon) => nearlyEqual(core.polygonArea(polygon), 0.25, 1e-8));

const nearest = core.nearestPoint(twoPoints, { x: 0.1, y: 0.5 });
assert.equal(nearest.index, 0);
nearlyEqual(nearest.distance, 0.15);

const centroid = core.polygonCentroid([
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
]);
nearlyEqual(centroid.x, 0.5);
nearlyEqual(centroid.y, 0.5);


const rectangularPoints = [
  { x: 0.2, y: 0.5 },
  { x: 0.8, y: 0.5 },
];
const rectangularCells = core.computeCells(
  rectangularPoints,
  undefined,
  { xScale: 5 / 3, yScale: 1 },
);
nearlyEqual(core.polygonArea(rectangularCells[0]), 0.5, 1e-8);
nearlyEqual(core.polygonArea(rectangularCells[1]), 0.5, 1e-8);

const metricNearest = core.nearestPoint(
  [
    { x: 0.35, y: 0.8 },
    { x: 0.65, y: 0.5 },
  ],
  { x: 0.5, y: 0.5 },
  { xScale: 5 / 3, yScale: 1 },
);
assert.equal(metricNearest.index, 1);

console.log("Voronoi core tests passed.");
