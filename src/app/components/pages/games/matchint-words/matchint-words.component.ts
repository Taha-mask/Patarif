import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameTemplateComponent } from '../../../game-template/game-template.component';
import { SupabaseService, MatchEmojiItem } from '../../../../supabase.service';
import { CelebrationComponent } from '../../../game-template/celebration/celebration.component';
import { AudioService } from '../../../../services/audio.service';
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
  imports: [CommonModule, GameTemplateComponent, CelebrationComponent],
  templateUrl: './matchint-words.component.html',
  styleUrls: ['./matchint-words.component.css']
})
export class MatchintWordsComponent implements OnInit {
  // Game items
  items: MatchItem[] = [];
  words: MatchItem[] = [];
  emojis: MatchItem[] = [];
  selectedWord: MatchItem | null = null;
  connections: Connection[] = [];
  feedback: string | null = null;
  score: number = 0;
  gameComplete: boolean = false;
  questionsCorrectInLevel: number = 0; // عدد الأسئلة الصحيحة في المستوى
  
  // Game template properties
  level: number = 1;
  questionsInLevel: number = 6; // total questions per level
  currentQuestion: number = 1;
  currentWord = { correct: '', difficulty: 'facile' as 'facile' | 'moyen' | 'difficile' };
  timeElapsed: number = 0;
  showCelebration: boolean = false;
  celebrationData: any = null;
  timerInterval: any;

 

  constructor(private supabaseService: SupabaseService, private audioService: AudioService) {
   
  }

  async ngOnInit() {
    await this.loadGameItems(this.level);
    this.startTimer();
  }

  private startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeElapsed++;
    }, 1000);
  }

  private stopTimer() {
    clearInterval(this.timerInterval);
  }

  private async loadGameItems(level: number) {
    const matchItems: MatchEmojiItem[] = await this.supabaseService.getMatchItems(level);
    if (!matchItems || matchItems.length === 0) return;

    const items: MatchItem[] = [];
    matchItems.forEach((item, itemIndex) => {
      item.emojis.forEach((e, index) => {
        items.push({
          id: itemIndex * 100 + index,
          word: e.word,
          emoji: e.emoji,
          matched: false
        });
      });
    });

    this.items = this.shuffleArray(items);
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
    this.selectedWord = this.selectedWord === item ? null : item;
  }

  selectEmoji(item: MatchItem) {
    if (!this.selectedWord || item.matched) return;

    if (this.selectedWord.word === item.word && this.selectedWord.emoji === item.emoji) {
      this.selectedWord.matched = true;
      item.matched = true;
      this.questionsCorrectInLevel++; // ← أضف هذا السطر

      this.connections.push({
        wordId: this.selectedWord.id,
        emojiId: item.id,
        word: this.selectedWord.word,
        emoji: item.emoji
      });

      this.score += 10;
      this.currentQuestion++;
      this.playCorrectSound();
      this.checkGameComplete();
    } else {
      this.feedback = 'Try again!';
      this.playWrongSound();
      setTimeout(() => { this.feedback = null; }, 1000);
      this.score = Math.max(0, this.score - 2);
    }

    this.selectedWord = null;
  }

  private checkGameComplete() {
    if (this.items.every(i => i.matched)) {
      this.gameComplete = true;
    }
  }

    resetGame() {
      this.stopTimer();
      this.connections = [];
      this.feedback = null;
      this.selectedWord = null;
      this.score = 0;
      this.gameComplete = false;
      this.timeElapsed = 0;
      this.currentQuestion = 1;
      this.questionsCorrectInLevel = 0; // ← يبدأ من جديد
      this.loadGameItems(this.level);
      this.startTimer();
    
  }

  openCelebration() {
    this.stopTimer();
    this.celebrationData = {
      level: this.level,
      questionsCorrect: this.currentQuestion - 1,
      totalQuestions: this.questionsInLevel,
      timeElapsed: this.timeElapsed,
      difficulty: this.currentWord.difficulty
    };
    this.showCelebration = true;
  }

  onCloseCelebration() {
    this.showCelebration = false;
  }

  onNextLevel() {
    this.level++;
    this.resetGame();
    this.showCelebration = false;
  }


  private playCorrectSound() {
    this.audioService.playCorrectSound();
  }

  private playWrongSound() {
    this.audioService.playWrongSound();
  }
}
