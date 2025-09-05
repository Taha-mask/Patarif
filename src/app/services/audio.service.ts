import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private isSoundEnabled = true;

  private correctSound = new Audio('/audio/correct.mp3');
  private wrongSound = new Audio('/audio/wrong.mp3');

  constructor() {
    this.correctSound.volume = 0.7;
    this.wrongSound.volume = 0.7;
  }

  // Activer / désactiver les sons
  toggleSound() {
    this.isSoundEnabled = !this.isSoundEnabled;

    if (!this.isSoundEnabled) {
      this.correctSound.pause();
      this.correctSound.currentTime = 0;
      this.wrongSound.pause();
      this.wrongSound.currentTime = 0;
    }
  }

  // Jouer le son "correct"
  playCorrect() {
    if (this.isSoundEnabled) {
      this.correctSound.currentTime = 0;
      this.correctSound.play().catch(() => {});
    }
  }

  // Jouer le son "faux"
  playWrong() {
    if (this.isSoundEnabled) {
      this.wrongSound.currentTime = 0;
      this.wrongSound.play().catch(() => {});
    }
  }

  // Vérifier si le son est activé
  get soundEnabled() {
    return this.isSoundEnabled;
  }
}
