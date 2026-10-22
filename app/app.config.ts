import { ApplicationConfig } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Login, Auth } from './login';
import { Admin } from './admin';
import { Player } from './player';
import { Game } from './game';

const auth = (req: any, next: any) => Auth.token ? next(req.clone({ setHeaders: { Authorization: Auth.token } })) : next(req);
export const routes: Routes = [
  { path: '', component: Login }, { path: 'admin', component: Admin },
  { path: 'me', component: Player }, { path: 'game/:id', component: Game }];
export const appConfig: ApplicationConfig = { providers: [provideRouter(routes), provideHttpClient(withInterceptors([auth]))] };
