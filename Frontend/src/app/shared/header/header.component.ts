// import { Component } from '@angular/core';
// import { AuthService } from '../../services/auth.service';
// import { Router, RouterModule } from '@angular/router';
// import { NgIf } from '@angular/common';

// @Component({
//   selector: 'app-header',
//   templateUrl: './header.component.html',
//   styleUrls: ['./header.component.css'],
//   standalone: true,
//   imports: [NgIf, RouterModule],
// })
// export class HeaderComponent {
//   constructor(public auth: AuthService, private router: Router) {}

//   logout() {
//     this.auth.logout();
//     this.router.navigate(['/login']);
//   }
// }
import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {}

