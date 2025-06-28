import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgIf],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  localStorage = localStorage;
  nombre: string | null = null;

  ngOnInit() {
    this.nombre = localStorage.getItem('nombreUsuario');
  }
}
