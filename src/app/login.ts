import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Art } from './art';
import {environment} from '../environments/environment';
export const API = environment.apiUrl;
export class Auth { static get token() { return sessionStorage.getItem('t'); } }
@Component({ selector: 'app-login', imports: [FormsModule, Art], template: `
  <div class="narrow center">
    <app-art/><h1 class="title">Gardeners</h1><p class="tag">Meet your unit. Drag. Drop. Grow.</p>
    <input aria-label="Username" placeholder="Username" [(ngModel)]="u">
    <input aria-label="Password" type="password" placeholder="Password" [(ngModel)]="p" (keyup.enter)="go()">
    <button class="btn navy" (click)="go()">Sign in</button><p class="err" role="alert">{{err}}</p>
  </div>` })
export class Login {
  u = ''; p = ''; err = ''; http = inject(HttpClient); r = inject(Router);
  go() {
    sessionStorage.setItem('t', 'Basic ' + btoa(this.u + ':' + this.p));
    this.http.get<any>(API + '/me').subscribe({
      next: m => this.r.navigate([m.role === 'admin' ? 'admin' : 'me']),
      error: () => { sessionStorage.removeItem('t'); this.err = 'Wrong username or password.'; } });
  }
}
