import { Component } from '@angular/core';
@Component({ selector: 'app-art', template: `
<svg viewBox="0 0 360 230" role="img" aria-label="Plants growing in beds of different heights" class="art">
  <circle cx="262" cy="62" r="40" fill="#8cebe0"/>
  <g fill="#2fdccb"><rect x="30" y="140" width="64" height="62" rx="12"/><rect x="108" y="100" width="64" height="102" rx="12"/><rect x="186" y="72" width="64" height="130" rx="12"/></g>
  <g fill="#0b0b6b"><polygon points="262,30 292,202 232,202" transform="translate(40 0)"/>
    <path d="M62 140v-22M62 124c-12 0-18-4-18-12 10-1 18 4 18 12zM140 100V78M140 84c-12 0-18-4-18-12 10-1 18 4 18 12zM218 72V50M218 56c-12 0-18-4-18-12 10-1 18 4 18 12z" stroke="#0b0b6b" stroke-width="5" stroke-linecap="round"/></g>
  <rect x="16" y="202" width="328" height="10" rx="5" fill="#dcf6f2"/>
</svg>` })
export class Art {}
