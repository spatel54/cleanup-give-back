/** Inline MapLibre GL JS helpers shared by Expo Go WebView map components. */
export function buildWebViewMapHelpers(
  primaryColor: string,
  startColor: string,
  startBorderColor = '#ffffff',
) {
  return `
  const EARTH_RADIUS_MILES = 3958.8;
  const DISPLAY_SIMPLIFY_TOLERANCE_METERS = 4;
  const LIVE_DISPLAY_SIMPLIFY_TOLERANCE_METERS = 0.55;
  const LIVE_DISPLAY_TAIL_RAW_POINTS = 28;

  function toRadians(degrees) {
    return (degrees * Math.PI) / 180;
  }

  function haversineMiles(lat1, lon1, lat2, lon2) {
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const startLat = toRadians(lat1);
    const endLat = toRadians(lat2);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(startLat) * Math.cos(endLat) * Math.sin(dLon / 2) ** 2;
    return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function deltaMetersBetween(from, to) {
    return haversineMiles(from[1], from[0], to[1], to[0]) * 1609.344;
  }

  function computeBearingDegrees(from, to) {
    const lat1 = (from[1] * Math.PI) / 180;
    const lat2 = (to[1] * Math.PI) / 180;
    const dLng = ((to[0] - from[0]) * Math.PI) / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
  }

  function bearingDifferenceDegrees(a, b) {
    const diff = Math.abs(a - b) % 360;
    return diff > 180 ? 360 - diff : diff;
  }

  function isSharpReversal(prevRoutePoint, lastRoutePoint, candidate) {
    const segmentMeters = deltaMetersBetween(lastRoutePoint, candidate);
    if (segmentMeters > 12) return false;
    const inboundBearing = computeBearingDegrees(prevRoutePoint, lastRoutePoint);
    const outboundBearing = computeBearingDegrees(lastRoutePoint, candidate);
    return bearingDifferenceDegrees(inboundBearing, outboundBearing) >= 120;
  }

  function perpendicularDistanceMeters(point, lineStart, lineEnd) {
    const lineLengthMeters = deltaMetersBetween(lineStart, lineEnd);
    if (lineLengthMeters === 0) {
      return deltaMetersBetween(point, lineStart);
    }
    const px = point[0];
    const py = point[1];
    const x1 = lineStart[0];
    const y1 = lineStart[1];
    const x2 = lineEnd[0];
    const y2 = lineEnd[1];
    const t = Math.max(
      0,
      Math.min(
        1,
        ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) /
          ((x2 - x1) ** 2 + (y2 - y1) ** 2),
      ),
    );
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return deltaMetersBetween(point, [projX, projY]);
  }

  function douglasPeucker(coordinates, toleranceMeters) {
    if (coordinates.length < 3) return coordinates;
    let maxDistance = 0;
    let maxIndex = 0;
    const endIndex = coordinates.length - 1;
    for (let index = 1; index < endIndex; index += 1) {
      const distance = perpendicularDistanceMeters(
        coordinates[index],
        coordinates[0],
        coordinates[endIndex],
      );
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = index;
      }
    }
    if (maxDistance > toleranceMeters) {
      const left = douglasPeucker(coordinates.slice(0, maxIndex + 1), toleranceMeters);
      const right = douglasPeucker(coordinates.slice(maxIndex), toleranceMeters);
      return left.slice(0, -1).concat(right);
    }
    return [coordinates[0], coordinates[endIndex]];
  }

  function removeDisplayOutliers(coordinates) {
    if (coordinates.length < 3) return coordinates;
    const filtered = [coordinates[0]];
    for (let index = 1; index < coordinates.length - 1; index += 1) {
      const prevRoutePoint = filtered[filtered.length - 1];
      const prevRoutePoint2 = filtered.length >= 2 ? filtered[filtered.length - 2] : null;
      const current = coordinates[index];
      const next = coordinates[index + 1];
      if (prevRoutePoint2 && isSharpReversal(prevRoutePoint2, prevRoutePoint, current)) {
        continue;
      }
      const deviation = perpendicularDistanceMeters(current, prevRoutePoint, next);
      if (deviation > DISPLAY_SIMPLIFY_TOLERANCE_METERS * 2) {
        continue;
      }
      filtered.push(current);
    }
    filtered.push(coordinates[coordinates.length - 1]);
    return filtered;
  }

  function smoothRouteForDisplay(coords) {
    if (!coords || coords.length < 3) return coords || [];
    const smoothed = [coords[0]];
    for (let i = 1; i < coords.length - 1; i++) {
      smoothed.push([
        coords[i - 1][0] * 0.25 + coords[i][0] * 0.5 + coords[i + 1][0] * 0.25,
        coords[i - 1][1] * 0.25 + coords[i][1] * 0.5 + coords[i + 1][1] * 0.25,
      ]);
    }
    smoothed.push(coords[coords.length - 1]);
    return smoothed;
  }

  function simplifyRouteForDisplay(coords, toleranceMeters) {
    if (!coords || coords.length < 2) return coords || [];
    const tolerance = toleranceMeters != null ? toleranceMeters : DISPLAY_SIMPLIFY_TOLERANCE_METERS;
    const withoutOutliers = removeDisplayOutliers(coords);
    const simplified =
      withoutOutliers.length >= 3
        ? douglasPeucker(withoutOutliers, tolerance)
        : withoutOutliers;
    return smoothRouteForDisplay(simplified);
  }

  function simplifyRouteForLiveDisplay(coords) {
    if (!coords || coords.length < 2) return coords || [];
    if (coords.length <= LIVE_DISPLAY_TAIL_RAW_POINTS + 2) {
      return simplifyRouteForDisplay(coords, LIVE_DISPLAY_SIMPLIFY_TOLERANCE_METERS);
    }
    const splitIndex = coords.length - LIVE_DISPLAY_TAIL_RAW_POINTS;
    const head = coords.slice(0, splitIndex);
    const tail = coords.slice(splitIndex);
    const simplifiedHead = simplifyRouteForDisplay(head, LIVE_DISPLAY_SIMPLIFY_TOLERANCE_METERS);
    if (simplifiedHead.length === 0) {
      return tail;
    }
    const lastHead = simplifiedHead[simplifiedHead.length - 1];
    const firstTail = tail[0];
    if (deltaMetersBetween(lastHead, firstTail) < 1) {
      return simplifiedHead.slice(0, -1).concat(tail);
    }
    return simplifiedHead.concat(tail);
  }

  function sliceRouteByDistanceProgress(coords, progress) {
    if (!coords || coords.length < 2) return coords || [];
    const clamped = Math.max(0, Math.min(1, progress));
    if (clamped <= 0) return [coords[0]];
    if (clamped >= 1) return coords;

    const cumulative = [0];
    for (let index = 1; index < coords.length; index += 1) {
      cumulative.push(
        cumulative[index - 1] + deltaMetersBetween(coords[index - 1], coords[index]),
      );
    }

    const totalMeters = cumulative[cumulative.length - 1];
    if (totalMeters <= 0) return [coords[0]];

    const targetMeters = clamped * totalMeters;
    let segmentIndex = 1;
    while (segmentIndex < cumulative.length && cumulative[segmentIndex] < targetMeters) {
      segmentIndex += 1;
    }

    if (segmentIndex >= coords.length) return coords;

    const segmentStart = segmentIndex - 1;
    const segmentLength = cumulative[segmentIndex] - cumulative[segmentStart];
    const segmentT =
      segmentLength > 0
        ? (targetMeters - cumulative[segmentStart]) / segmentLength
        : 0;
    const from = coords[segmentStart];
    const to = coords[segmentIndex];
    const tip = [
      from[0] + (to[0] - from[0]) * segmentT,
      from[1] + (to[1] - from[1]) * segmentT,
    ];

    return coords.slice(0, segmentIndex).concat([tip]);
  }

  function createStartMarkerElement() {
    const el = document.createElement('div');
    el.style.width = '14px';
    el.style.height = '14px';
    el.style.borderRadius = '7px';
    el.style.backgroundColor = window.__startMarkerFill || '${startColor}';
    el.style.border = '2px solid ' + (window.__startMarkerBorder || '${startBorderColor}');
    el.style.boxSizing = 'border-box';
    return el;
  }

  function applyStartMarkerColors(fill, border) {
    if (typeof fill === 'string') {
      window.__startMarkerFill = fill;
    }
    if (typeof border === 'string') {
      window.__startMarkerBorder = border;
    }
  }

  function paintStartMarkerElement(el) {
    if (!el) return;
    var fill = window.__startMarkerFill || '${startColor}';
    var border = window.__startMarkerBorder || '${startBorderColor}';
    el.style.backgroundColor = fill;
    el.style.border = '2px solid ' + border;
  }

  var HEADING_MARKER_SIZE = 100;
  var HEADING_MARKER_CENTER = HEADING_MARKER_SIZE / 2;
  var HEADING_DOT_OUTER_RADIUS = 11;
  var HEADING_DOT_INNER_RADIUS = 7;
  // Flared cone-cylinder beam (matches SessionMapMarkers).
  var HEADING_BEAM_LENGTH = 66;
  var HEADING_BEAM_INNER_HALF_WIDTH = 11;
  var HEADING_BEAM_OUTER_HALF_WIDTH = 30;
  var HEADING_BEAM_LAYER_COUNT = 14;
  var HEADING_BEAM_MAX_OPACITY = 0.24;

  function beamHalfWidthAt(progress) {
    return HEADING_BEAM_INNER_HALF_WIDTH +
      (HEADING_BEAM_OUTER_HALF_WIDTH - HEADING_BEAM_INNER_HALF_WIDTH) * progress;
  }

  function beamOpacityAt(progress) {
    return HEADING_BEAM_MAX_OPACITY * (1 - progress);
  }

  function buildBeamSlicePath(cx, cy, t0, t1, innerCapRadius) {
    var length0 = HEADING_BEAM_LENGTH * t0;
    var length1 = HEADING_BEAM_LENGTH * t1;
    var w0 = beamHalfWidthAt(t0);
    var w1 = beamHalfWidthAt(t1);
    var atTip = t1 >= 1;

    if (t0 === 0) {
      var innerCapOffsetY = Math.sqrt(Math.max(0, innerCapRadius * innerCapRadius - w0 * w0));
      var innerLeft = { x: cx - w0, y: cy - innerCapOffsetY };
      var innerRight = { x: cx + w0, y: cy - innerCapOffsetY };
      var outerLeft = { x: cx - w1, y: cy - length1 };
      var outerRight = { x: cx + w1, y: cy - length1 };
      return (
        'M ' + innerLeft.x + ' ' + innerLeft.y +
        ' A ' + innerCapRadius + ' ' + innerCapRadius + ' 0 0 1 ' + innerRight.x + ' ' + innerRight.y +
        ' L ' + outerRight.x + ' ' + outerRight.y +
        (atTip
          ? ' A ' + w1 + ' ' + w1 + ' 0 0 0 ' + outerLeft.x + ' ' + outerLeft.y
          : ' L ' + outerLeft.x + ' ' + outerLeft.y) +
        ' L ' + innerLeft.x + ' ' + innerLeft.y +
        ' Z'
      );
    }

    var innerLeft2 = { x: cx - w0, y: cy - length0 };
    var innerRight2 = { x: cx + w0, y: cy - length0 };
    var outerLeft2 = { x: cx - w1, y: cy - length1 };
    var outerRight2 = { x: cx + w1, y: cy - length1 };
    return (
      'M ' + innerLeft2.x + ' ' + innerLeft2.y +
      ' L ' + innerRight2.x + ' ' + innerRight2.y +
      ' L ' + outerRight2.x + ' ' + outerRight2.y +
      (atTip
        ? ' A ' + w1 + ' ' + w1 + ' 0 0 0 ' + outerLeft2.x + ' ' + outerLeft2.y
        : ' L ' + outerLeft2.x + ' ' + outerLeft2.y) +
      ' L ' + innerLeft2.x + ' ' + innerLeft2.y +
      ' Z'
    );
  }

  function buildBeamLayers(cx, cy, innerCapRadius) {
    var layers = [];
    for (var i = 0; i < HEADING_BEAM_LAYER_COUNT; i++) {
      var t0 = i / HEADING_BEAM_LAYER_COUNT;
      var t1 = (i + 1) / HEADING_BEAM_LAYER_COUNT;
      var opacity = beamOpacityAt(t1);
      if (opacity <= 0) continue;
      layers.push({
        path: buildBeamSlicePath(cx, cy, t0, t1, innerCapRadius),
        opacity: opacity,
      });
    }
    return layers;
  }

  function buildHeadingMarkerSvg(hasHeading) {
    var beam = '';
    if (hasHeading) {
      var paths = buildBeamLayers(
        HEADING_MARKER_CENTER,
        HEADING_MARKER_CENTER,
        HEADING_DOT_OUTER_RADIUS
      ).map(function(layer) {
        return '<path d="' + layer.path + '" fill="${primaryColor}" fill-opacity="' + layer.opacity + '"></path>';
      }).join('');
      beam =
        '<defs><filter id="heading-beam-blur" x="-20%" y="-20%" width="140%" height="140%">' +
        '<feGaussianBlur stdDeviation="1.4"></feGaussianBlur></filter></defs>' +
        '<g filter="url(#heading-beam-blur)">' + paths + '</g>';
    }
    return (
      '<svg width="' + HEADING_MARKER_SIZE + '" height="' + HEADING_MARKER_SIZE + '" viewBox="0 0 ' + HEADING_MARKER_SIZE + ' ' + HEADING_MARKER_SIZE + '">' +
      beam +
      '<circle cx="' + HEADING_MARKER_CENTER + '" cy="' + HEADING_MARKER_CENTER + '" r="' + HEADING_DOT_OUTER_RADIUS + '" fill="#ffffff"></circle>' +
      '<circle cx="' + HEADING_MARKER_CENTER + '" cy="' + HEADING_MARKER_CENTER + '" r="' + HEADING_DOT_INNER_RADIUS + '" fill="${primaryColor}"></circle>' +
      '</svg>'
    );
  }

  // NOTE: the outer element passed to new maplibregl.Marker() has its
  // transform style overwritten by MapLibre on every setLngLat/move, since
  // MapLibre uses that same style property to translate the marker to its
  // screen position. Rotation must therefore be applied to an inner wrapper
  // div instead, or it will clobber MapLibre's positioning transform and the
  // marker will jump to the container's top-left corner.
  function createArrowMarkerElement(heading) {
    var el = document.createElement('div');
    el.style.width = HEADING_MARKER_SIZE + 'px';
    el.style.height = HEADING_MARKER_SIZE + 'px';
    var rotator = document.createElement('div');
    rotator.style.width = HEADING_MARKER_SIZE + 'px';
    rotator.style.height = HEADING_MARKER_SIZE + 'px';
    rotator.style.filter = 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))';
    var hasHeading = heading != null && Number.isFinite(heading);
    el.dataset.heading = hasHeading ? String(heading) : '';
    if (hasHeading) {
      rotator.style.transform = 'rotate(' + heading + 'deg)';
    }
    rotator.innerHTML = buildHeadingMarkerSvg(hasHeading);
    el.appendChild(rotator);
    return el;
  }

  function updateArrowMarkerElement(el, heading) {
    var rotator = el.firstElementChild;
    if (!rotator) return;
    var hasHeading = heading != null && Number.isFinite(heading);
    var hadHeading = el.dataset.heading === '' ? false : el.dataset.heading != null && el.dataset.heading !== '';
    if (hasHeading) {
      rotator.style.transform = 'rotate(' + heading + 'deg)';
      el.dataset.heading = String(heading);
    } else {
      rotator.style.transform = '';
    }
    if (hasHeading !== hadHeading) {
      rotator.innerHTML = buildHeadingMarkerSvg(hasHeading);
    }
  }

  function createEndMarkerElement() {
    const el = document.createElement('div');
    el.style.width = '22px';
    el.style.height = '22px';
    el.style.borderRadius = '11px';
    el.style.backgroundColor = '${primaryColor}';
    el.style.border = '2px solid #ffffff';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.boxSizing = 'border-box';
    el.innerHTML = '<div style="width:8px;height:8px;border-radius:4px;background:#ffffff;"></div>';
    return el;
  }

  function lonLatToTileXY(lon, lat, zoom) {
    var latRad = (lat * Math.PI) / 180;
    var n = Math.pow(2, zoom);
    return {
      x: Math.floor(((lon + 180) / 360) * n),
      y: Math.floor(
        ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
      ),
    };
  }

  /**
   * Warms the HTTP cache for a raster style's tile sources around the
   * current viewport, without adding it to the map. Esri's free tile
   * servers are noticeably slower than the standard basemap's CDN, and
   * Hybrid alone layers three separate raster sources (imagery,
   * transportation, labels) on top of each other — switching to it "cold"
   * means waiting on all three fetches at once. Called ahead of time (see
   * \`window.prefetchLayerTiles\`) so that by the time the user actually
   * picks the layer, most tiles are already cached and \`setStyle\` just
   * has to repaint from cache instead of hitting the network.
   */
  function prefetchRasterStyleTiles(stylePayload) {
    if (!stylePayload || stylePayload.type !== 'json' || !stylePayload.value.sources) return;
    var center = map.getCenter();
    var zoom = Math.max(0, Math.round(map.getZoom()));
    var tile = lonLatToTileXY(center.lng, center.lat, zoom);
    var sources = stylePayload.value.sources;
    Object.keys(sources).forEach(function (key) {
      var source = sources[key];
      if (source.type !== 'raster' || !source.tiles || !source.tiles[0]) return;
      var z = source.maxzoom != null ? Math.min(zoom, source.maxzoom) : zoom;
      var template = source.tiles[0];
      for (var dx = -1; dx <= 1; dx += 1) {
        for (var dy = -1; dy <= 1; dy += 1) {
          var url = template
            .replace('{z}', String(z))
            .replace('{x}', String(tile.x + dx))
            .replace('{y}', String(tile.y + dy));
          fetch(url).catch(function () {});
        }
      }
    });
  }
  `;
}
