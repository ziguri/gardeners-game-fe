import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Auth } from './login';
@Component({ selector: 'app-root', imports: [RouterOutlet], template: `
<header><span class="pill">CTW · Gardeners</span>@if (signedIn()) { <button class="out" (click)="out()">Sign out</button> }</header><main><router-outlet/></main>` })
export class App {
  r = inject(Router); signedIn() { return !!Auth.token; }
  out() { sessionStorage.removeItem('t'); this.r.navigate(['']); }
}
