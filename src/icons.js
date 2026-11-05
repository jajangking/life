const paths = {
  film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m10 8 6 4-6 4ZM3 8h3m-3 8h3M18 8h3m-3 8h3"/>',
  rain: '<path d="M5 15a4 4 0 0 1-1-7.8 6 6 0 0 1 11.5-1A4.5 4.5 0 1 1 19 15M7 18l-1 3m6-3-1 3m6-3-1 3"/>',
  bus: '<rect x="4" y="3" width="16" height="16" rx="3"/><path d="M4 11h16M9 3v8m6-8v8M7 19v2m10-2v2M7 15h1m8 0h1"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  sunrise: '<path d="M3 17h18M5 21h14M7 17a5 5 0 0 1 10 0M12 3v5m-3-2 3-3 3 3M3 11l2 2m14 0 2-2"/>',
  sunset: '<path d="M3 17h18M5 21h14M7 17a5 5 0 0 1 10 0M12 3v5m-3-3 3 3 3-3M3 11l2 2m14 0 2-2"/>',
  moon: '<path d="M20.5 13A8.6 8.6 0 0 1 11 3.5 8.7 8.7 0 1 0 20.5 13Z"/><path d="m18 3 .5 1.5L20 5l-1.5.5L18 7l-.5-1.5L16 5l1.5-.5Z"/>',
  explore: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/>',
  people: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.9M15 3.1a4 4 0 0 1 0 7.8"/><circle cx="9" cy="7" r="4"/>',
  person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
  leaf: '<path d="M20 4c1 11-3 16-9 15a7 7 0 0 1-6-9c2-5 8-2 15-6Z"/><path d="m4 21 11-11"/>',
  coffee: '<path d="M4 8h13v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Zm13 1h1a3 3 0 0 1 0 6h-1M7 2v2m4-2v2m4-2v2M2 22h18"/>',
  shop: '<path d="m3 9 2-6h14l2 6M3 9v2a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0V9ZM5 14v7h14v-7M9 21v-6h6v6"/>',
  house: '<path d="m3 10 9-7 9 7v11H3Zm6 11v-8h6v8"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2.7 8.4M3 4v6h6"/>',
  rotate: '<path d="M20 7a9 5 0 1 0 1 6M20 2v5h-5"/><path d="M12 8v9m-3-3 3 3 3-3"/>',
  view: '<path d="m12 3 9 5-9 5-9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  camera: '<path d="M4 7h4l2-3h4l2 3h4a1 1 0 0 1 1 1v12H3V8a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="4"/>',
  volume: '<path d="m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="m11 4-6 5H2v6h3l6 5Zm6 5 5 6m0-6-5 6"/>',
  pause: '<path d="M8 5v14M16 5v14" stroke-width="3"/>',
  play: '<path d="m8 4 12 8-12 8Z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 1 1 5 2.3c-1 .5-2.1 1-2.1 2.7m0 3v.1"/>',
  mouse: '<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 6v4"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  spark: '<path d="m12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  flag: '<path d="M5 22V3c5-4 9 4 14 0v11c-5 4-9-4-14 0"/>',
  full: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
};

export function icon(name, size = 20) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
}

export const logo = `<svg class="brand-mark" width="42" height="42" viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect width="48" height="48" rx="14" fill="#315344"/><path d="m9 26 15-8 15 8-15 8z" fill="#ecd3a4"/><path d="m9 26 15 8 15-8v6l-15 8-15-8z" fill="#cf9b72"/><path d="m17 16 7-4 7 4v13l-7 4-7-4z" fill="#f7eed8"/><path d="m24 12 7 4-7 4-7-4z" fill="#d39770"/><path d="M24 20v13l7-4V16z" fill="#b8cbb7"/></svg>`;
