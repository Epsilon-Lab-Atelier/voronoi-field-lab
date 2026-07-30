(function attachVoronoiCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.VoronoiCore = api;
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function createVoronoiCore() {
  "use strict";

  const EPSILON = 1e-10;

  function clipPolygonToHalfPlane(polygon, dx, dy, limit) {
    if (!polygon.length) {
      return [];
    }

    const output = [];
    const evaluate = (point) => (point.x * dx) + (point.y * dy) - limit;

    for (let index = 0; index < polygon.length; index += 1) {
      const start = polygon[index];
      const end = polygon[(index + 1) % polygon.length];
      const startValue = evaluate(start);
      const endValue = evaluate(end);
      const startInside = startValue <= EPSILON;
      const endInside = endValue <= EPSILON;

      if (startInside && endInside) {
        output.push({ x: end.x, y: end.y });
      } else if (startInside && !endInside) {
        const denominator = startValue - endValue;
        if (Math.abs(denominator) > EPSILON) {
          const t = startValue / denominator;
          output.push({
            x: start.x + ((end.x - start.x) * t),
            y: start.y + ((end.y - start.y) * t),
          });
        }
      } else if (!startInside && endInside) {
        const denominator = startValue - endValue;
        if (Math.abs(denominator) > EPSILON) {
          const t = startValue / denominator;
          output.push({
            x: start.x + ((end.x - start.x) * t),
            y: start.y + ((end.y - start.y) * t),
          });
        }
        output.push({ x: end.x, y: end.y });
      }
    }

    return output;
  }

  function computeCells(points, bounds, metric) {
    const rectangle = bounds || { xMin: 0, yMin: 0, xMax: 1, yMax: 1 };
    const scaleX = metric && Number.isFinite(metric.xScale) ? metric.xScale : 1;
    const scaleY = metric && Number.isFinite(metric.yScale) ? metric.yScale : 1;
    const scaleXSquared = scaleX * scaleX;
    const scaleYSquared = scaleY * scaleY;

    return points.map((point, pointIndex) => {
      let polygon = [
        { x: rectangle.xMin, y: rectangle.yMin },
        { x: rectangle.xMax, y: rectangle.yMin },
        { x: rectangle.xMax, y: rectangle.yMax },
        { x: rectangle.xMin, y: rectangle.yMax },
      ];

      for (let otherIndex = 0; otherIndex < points.length; otherIndex += 1) {
        if (otherIndex === pointIndex) {
          continue;
        }

        const other = points[otherIndex];
        const rawDx = other.x - point.x;
        const rawDy = other.y - point.y;
        const squaredDistance = (rawDx * rawDx * scaleXSquared)
          + (rawDy * rawDy * scaleYSquared);

        if (squaredDistance < EPSILON) {
          if (otherIndex < pointIndex) {
            return [];
          }
          continue;
        }

        const dx = rawDx * scaleXSquared;
        const dy = rawDy * scaleYSquared;
        const limit = (
          ((other.x * other.x) - (point.x * point.x)) * scaleXSquared
          + ((other.y * other.y) - (point.y * point.y)) * scaleYSquared
        ) / 2;

        polygon = clipPolygonToHalfPlane(polygon, dx, dy, limit);
        if (!polygon.length) {
          break;
        }
      }

      return polygon;
    });
  }

  function polygonSignedArea(polygon) {
    if (polygon.length < 3) {
      return 0;
    }

    let sum = 0;
    for (let index = 0; index < polygon.length; index += 1) {
      const current = polygon[index];
      const next = polygon[(index + 1) % polygon.length];
      sum += (current.x * next.y) - (next.x * current.y);
    }
    return sum / 2;
  }

  function polygonArea(polygon) {
    return Math.abs(polygonSignedArea(polygon));
  }

  function polygonCentroid(polygon, fallback) {
    if (polygon.length < 3) {
      return fallback ? { x: fallback.x, y: fallback.y } : { x: 0, y: 0 };
    }

    const signedArea = polygonSignedArea(polygon);
    if (Math.abs(signedArea) < EPSILON) {
      return fallback ? { x: fallback.x, y: fallback.y } : { x: 0, y: 0 };
    }

    let xSum = 0;
    let ySum = 0;

    for (let index = 0; index < polygon.length; index += 1) {
      const current = polygon[index];
      const next = polygon[(index + 1) % polygon.length];
      const cross = (current.x * next.y) - (next.x * current.y);
      xSum += (current.x + next.x) * cross;
      ySum += (current.y + next.y) * cross;
    }

    const factor = 1 / (6 * signedArea);
    return {
      x: xSum * factor,
      y: ySum * factor,
    };
  }

  function nearestPoint(points, target, metric) {
    if (!points.length) {
      return null;
    }

    const scaleX = metric && Number.isFinite(metric.xScale) ? metric.xScale : 1;
    const scaleY = metric && Number.isFinite(metric.yScale) ? metric.yScale : 1;
    let nearestIndex = 0;
    let nearestSquaredDistance = Number.POSITIVE_INFINITY;

    points.forEach((point, index) => {
      const dx = (point.x - target.x) * scaleX;
      const dy = (point.y - target.y) * scaleY;
      const squaredDistance = (dx * dx) + (dy * dy);
      if (squaredDistance < nearestSquaredDistance) {
        nearestSquaredDistance = squaredDistance;
        nearestIndex = index;
      }
    });

    return {
      index: nearestIndex,
      point: points[nearestIndex],
      distance: Math.sqrt(nearestSquaredDistance),
    };
  }

  return Object.freeze({
    computeCells,
    polygonArea,
    polygonCentroid,
    nearestPoint,
  });
}));
