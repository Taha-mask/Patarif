import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audio: HTMLAudioElement | null = null;
  private correctSound: HTMLAudioElement | null = null;
  private wrongSound: HTMLAudioElement | null = null;

  isMusicPlaying = false;
  isSoundEnabled = true;

  init() {
    if (!this.audio) {
      this.audio = new Audio('/audio/Billie Eilish - WILDFLOWER (Official Lyric Video).mp3');
      this.audio.loop = true;
      this.audio.volume = 0.3;
    }

    if (!this.correctSound) {
      this.correctSound = new Audio('/audio/correct.mp3');
      this.correctSound.volume = 0.7;
    }

    if (!this.wrongSound) {
      this.wrongSound = new Audio('/audio/wrong.mp3');
      this.wrongSound.volume = 0.7;
    }
  }

  toggleMusic() {
    if (!this.audio) return;
    if (this.isMusicPlaying) {
      this.audio.pause();
    } else {
      this.audio.play().catch(e => console.error('Erreur lecture musique:', e));
    }
    this.isMusicPlaying = !this.isMusicPlaying;
  }

  toggleSound() {
    this.isSoundEnabled = !this.isSoundEnabled;
    if (!this.isSoundEnabled) {
      this.correctSound?.pause();
      if (this.correctSound) this.correctSound.currentTime = 0;

      this.wrongSound?.pause();
      if (this.wrongSound) this.wrongSound.currentTime = 0;
    }
  }

  playCorrectSound() {
    if (this.isSoundEnabled && this.correctSound) {
      this.correctSound.currentTime = 0;
      this.correctSound.play().catch(e => console.error('Erreur son correct:', e));
    }
  }

  playWrongSound() {
    if (this.isSoundEnabled && this.wrongSound) {
      this.wrongSound.currentTime = 0;
      this.wrongSound.play().catch(e => console.error('Erreur son incorrect:', e));
    }
  }

  cleanup() {
    this.audio?.pause();
    this.audio = null;

    this.correctSound?.pause();
    this.correctSound = null;

    this.wrongSound?.pause();
    this.wrongSound = null;
  }
}
