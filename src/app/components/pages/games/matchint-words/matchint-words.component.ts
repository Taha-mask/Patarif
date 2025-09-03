import { Component, AfterViewInit, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameTemplateComponent } from '../../../game-template/game-template.component';
interface MatchItem {
  id: number;
  word: string;
  emoji: string;
  matched: boolean;
}

interface Connection {
  wordId: number;
  emojiId: number;
  word: string;
  emoji: string;
}

@Component({
  selector: 'app-matchint-words',
  standalone: true,
  imports: [CommonModule, GameTemplateComponent],
  templateUrl: './matchint-words.component.html',
  styleUrls: ['./matchint-words.component.css']
})
export class MatchintWordsComponent implements OnInit {
  items: MatchItem[] = [];
  words: MatchItem[] = [];
  emojis: MatchItem[] = [];
  selectedWord: MatchItem | null = null;
  connections: Connection[] = [];
  feedback: string | null = null;
  isCorrect: boolean | null = null;
  score: number = 0;
  gameComplete: boolean = false;
  
  // Game template properties
  questionsCorrectInLevel: number = 0;
  timeElapsed: number = 0;
  currentWord = { correct: '' }; // Simplified type inference
  bonusPoints: number = 0;
  currentDifficulty: 'easy' | 'medium' | 'hard' = 'medium';

  // Audio for correct and wrong answers
  private correctAudio: HTMLAudioElement;
  private wrongAudio: HTMLAudioElement;

  constructor() {
    this.correctAudio = new Audio('/audio/correct.mp3');
    this.wrongAudio = new Audio('/audio/wrong.mp3');
    this.initializeGame();
  }

  ngOnInit() {
    this.initializeGame();
  }

  initializeGame() {
    // Sample data - you can expand this list
    const gameItems = [
      { id: 1, word: 'Cat', emoji: '🐱', matched: false },
      { id: 2, word: 'Dog', emoji: '🐶', matched: false },
      { id: 3, word: 'Apple', emoji: '🍎', matched: false },
      { id: 4, word: 'Car', emoji: '🚗', matched: false },
      { id: 5, word: 'Book', emoji: '📚', matched: false },
      { id: 6, word: 'Sun', emoji: '☀️', matched: false },
    ];

    // Shuffle the items
    this.items = this.shuffleArray([...gameItems]);
    
    // Split into words and emojis
    this.words = this.shuffleArray([...this.items]);
    this.emojis = this.shuffleArray([...this.items]);
  }

  private shuffleArray(array: any[]): any[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  selectWord(item: MatchItem) {
    if (item.matched) return;
    
    // If already selected, deselect
    if (this.selectedWord === item) {
      this.selectedWord = null;
      return;
    }
    
    this.selectedWord = item;
    this.checkForMatch();
  }

  selectEmoji(item: MatchItem) {
    if (item.matched || !this.selectedWord) return;
    
    // Check if this is a match
    if (this.selectedWord.word === item.word && this.selectedWord.emoji === item.emoji) {
      // It's a match!
      this.selectedWord.matched = true;
      item.matched = true;
      
      this.connections.push({
        wordId: this.selectedWord.id,
        emojiId: item.id,
        word: this.selectedWord.word,
        emoji: item.emoji
      });
      
      this.score += 10;
      this.playCorrectSound(); // Play correct sound
      this.checkGameComplete();
    } else {
      // Wrong match
      this.feedback = 'Try again!';
      this.playWrongSound(); // Play wrong sound
      setTimeout(() => {
        this.feedback = null;
      }, 1000);
      this.score = Math.max(0, this.score - 2);
    }
    
    this.selectedWord = null;
  }

  private checkForMatch() {
    // This can be enhanced with visual feedback
  }

  private checkGameComplete() {
    if (this.items.every(item => item.matched)) {
      this.gameComplete = true;
      this.feedback = '🎉 Congratulations! You matched everything correctly!';
    } else {
      this.feedback = 'Good job! Keep going!';
      setTimeout(() => {
        this.feedback = null;
      }, 1000);
    }
  }

  resetGame() {
    this.connections = [];
    this.feedback = null;
    this.isCorrect = null;
    this.selectedWord = null;
    this.score = 0;
    this.gameComplete = false;
    this.initializeGame();
  }

  // Play correct sound
  private playCorrectSound() {
    this.correctAudio.currentTime = 0;
    this.correctAudio.play().catch(error => {
      console.log('Audio playback failed:', error);
    });
  }

  // Play wrong sound
  private playWrongSound() {
    this.wrongAudio.currentTime = 0;
    this.wrongAudio.play().catch(error => {
      console.log('Audio playback failed:', error);
    });
  }
  }
  