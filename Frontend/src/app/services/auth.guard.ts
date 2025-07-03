import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot  } from '@angular/router';
import { AuthService } from './auth.service'; // Asegúrate de que la ruta sea correcta

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate{

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    const userRole: string = this.auth.getRol() || ''; 
    const allowedRoles = route.data['roles'] as string[] | undefined;

    if (allowedRoles && !allowedRoles.includes(userRole)) {
      // No tiene permiso
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }
}
