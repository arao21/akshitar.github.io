/* Talk map — Leaflet, fed from the _talks collection via a JSON script tag.
   Follows the site light/dark theme and degrades to a plain list link if
   Leaflet fails to load. */
(function () {
  'use strict';

  // Key-free OSM tiles; the muted/dark look comes from a CSS filter on the
  // tile pane (see .talkmap in _custom.scss), so no API-keyed provider needed.
  var TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  var ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  function accent() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--accent').trim() || '#1d5c63';
  }

  function init() {
    var host = document.getElementById('talkmap-canvas');
    var dataEl = document.getElementById('talkmap-data');
    if (!host || !dataEl) return;

    if (typeof L === 'undefined') {
      host.parentNode.classList.add('talkmap--failed');
      return;
    }

    var talks;
    try {
      talks = JSON.parse(dataEl.textContent);
    } catch (e) {
      host.parentNode.classList.add('talkmap--failed');
      return;
    }
    if (!talks.length) return;

    var countEl = document.querySelector('[data-talkmap-count]');
    if (countEl) {
      var cities = {};
      talks.forEach(function (t) { cities[t.lat + ',' + t.lon] = true; });
      countEl.textContent =
        talks.length + ' presentations across ' + Object.keys(cities).length + ' locations';
    }

    var map = L.map(host, {
      scrollWheelZoom: false,
      worldCopyJump: true,
      minZoom: 1
    });

    L.tileLayer(TILE_URL, {
      attribution: ATTRIBUTION,
      maxZoom: 12
    }).addTo(map);

    // Recolour markers when the site theme toggle flips data-theme.
    new MutationObserver(function () {
      markers.forEach(function (m) { m.setStyle({ color: accent(), fillColor: accent() }); });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // Group talks that share a location so overlapping pins stay clickable.
    var byPlace = {};
    talks.forEach(function (t) {
      var key = t.lat + ',' + t.lon;
      (byPlace[key] = byPlace[key] || []).push(t);
    });

    var markers = [];
    var bounds = [];

    Object.keys(byPlace).forEach(function (key) {
      var group = byPlace[key];
      var first = group[0];
      var c = accent();

      var marker = L.circleMarker([first.lat, first.lon], {
        radius: 6 + Math.min(group.length - 1, 4) * 1.8,
        color: c,
        fillColor: c,
        fillOpacity: 0.55,
        weight: 2
      }).addTo(map);

      var html = '<div class="talkmap__popup"><p class="talkmap__popup-place">' +
        escapeHtml(first.location) + '</p><ul>';
      group.forEach(function (t) {
        html += '<li><a href="' + escapeHtml(t.url) + '">' + escapeHtml(t.title) + '</a>' +
          '<span>' + escapeHtml(t.venue) + ' &middot; ' + escapeHtml(t.date) + '</span></li>';
      });
      html += '</ul></div>';

      marker.bindPopup(html, { maxWidth: 300 });
      marker.bindTooltip(first.location, { direction: 'top', offset: [0, -6] });
      markers.push(marker);
      bounds.push([first.lat, first.lon]);
    });

    map.fitBounds(bounds, { padding: [42, 42], maxZoom: 5 });

    // Scroll-wheel zoom only once the user has clicked into the map, so the
    // page still scrolls normally when you pass over it.
    map.on('click', function () { map.scrollWheelZoom.enable(); });
    map.on('mouseout', function () { map.scrollWheelZoom.disable(); });
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
