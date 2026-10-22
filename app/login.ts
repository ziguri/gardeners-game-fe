import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
export const API = 'http://localhost:8080/api';
export class Auth { static get token() { return sessionStorage.getItem('t'); } }
@Component({ selector: 'app-login', imports: [FormsModule], template: `
  <h1>Welcome to the Gardeners</h1>
  <input placeholder="Username" [(ngModel)]="u"><input type="password" placeholder="Password" [(ngModel)]="p">
  <button (click)="go()">Sign in</button><p class="err">{{err}}</p>` })
export class Login {
  u = ''; p = ''; err = ''; http = inject(HttpClient); r = inject(Router);
  go() {
    sessionStorage.setItem('t', 'Basic ' + btoa(this.u + ':' + this.p));
    this.http.get<any>(API + '/me').subscribe({
      next: m => this.r.navigate([m.role === 'admin' ? 'admin' : 'me']),
      error: () => { sessionStorage.removeItem('t'); this.err = 'Wrong username or password.'; } });
  }
}
