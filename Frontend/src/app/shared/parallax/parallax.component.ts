import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-parallax',
  standalone: true,
  imports: [],
  templateUrl: './parallax.component.html',
  styleUrls: ['./parallax.component.css']
})
export class ParallaxComponent {
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollY = window.scrollY;

    const layerBg = document.querySelector('.layer-bg') as HTMLElement;
    const layerMiddle = document.querySelector('.layer-middle') as HTMLElement;
    const layerContent = document.querySelector('.layer-content') as HTMLElement;

    if (layerBg) {
      layerBg.style.transform = `translateY(${scrollY * 0.3}px)`;
    }
    if (layerMiddle) {
      layerMiddle.style.transform = `translateY(${scrollY * 0.5}px)`;
    }
    if (layerContent) {
      layerContent.style.transform = `translateY(${scrollY * 0.8}px)`;
    }
  }
}
