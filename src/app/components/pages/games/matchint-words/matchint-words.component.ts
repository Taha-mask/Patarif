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
  // <-- set this to your DB game_id
  private readonly GAME_ID = 6;

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

  constructor(private supabaseService: SupabaseService, private audioService: AudioService) {}

  async ngOnInit() {
    // Try to restore saved progress first
    try {
      const progress = await this.supabaseService.getPlayerProgress(this.GAME_ID);

      if (progress && typeof progress.level === 'number' && progress.level >= 1) {
        this.level = Math.max(1, progress.level);
      } else {
        this.level = 1;
      }

      // load items for the resolved level
      await this.loadGameItems(this.level);

      // restore matched pairs approximately if question_num > 1
      if (progress && typeof progress.question_num === 'number' && progress.question_num > 1) {
        const toRestore = Math.max(0, progress.question_num - 1); // number of already-correct matches
        this.markRandomMatches(toRestore);
        this.currentQuestion = Math.min(progress.question_num, this.questionsInLevel + 1);
      } else {
        // no saved progress -> create initial db row (best-effort)
        this.currentQuestion = 1;
        try {
          await this.supabaseService.savePlayerProgress(this.GAME_ID, 1, 1);
        } catch (err) { /* ignore */ }
      }
    } catch (err) {
      console.error('Error restoring progress:', err);
      // fallback to defaults
      this.level = 1;
      await this.loadGameItems(this.level);
      this.currentQuestion = 1;
      try { await this.supabaseService.savePlayerProgress(this.GAME_ID, 1, 1); } catch (_) {}
    }

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

      // Save progress: best-effort, non-blocking (player is now at currentQuestion)
      try {
        this.supabaseService.savePlayerProgress(this.GAME_ID, this.level, this.currentQuestion)
          .then(saved => { if (!saved) console.warn('Failed to save progress (match)'); })
          .catch(err => console.warn('savePlayerProgress error (match):', err));
      } catch (err) {
        console.warn('Error saving progress after match:', err);
      }
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

    // Save progress: move player to next level with question_num = 1
    try {
      const nextLevel = this.level + 1;
      this.supabaseService.savePlayerProgress(this.GAME_ID, nextLevel, 1)
        .then(() => {})
        .catch(err => console.warn('Failed to save progress on level completion:', err));
    } catch (err) {
      console.warn('Failed to save progress on level completion:', err);
    }
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

  /**
   * Approximate restoration: mark `count` distinct random pairs as already matched.
   * Updates items/words/emojis arrays, connections, score and questionsCorrectInLevel.
   */
  private markRandomMatches(count: number) {
    if (!this.items || this.items.length === 0 || count <= 0) return;

    const totalPairs = this.items.length;
    const toPick = Math.min(count, totalPairs);

    // build array of ids
    const ids = this.items.map(i => i.id);
    // shuffle ids
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    const chosen = ids.slice(0, toPick);

    // mark chosen ids as matched across items, words and emojis arrays
    chosen.forEach(chosenId => {
      // mark in this.items
      this.items.forEach(it => { if (it.id === chosenId) it.matched = true; });
      // mark in words and emojis arrays (they hold same objects/ids)
      this.words.forEach(w => { if (w.id === chosenId) w.matched = true; });
      this.emojis.forEach(e => { if (e.id === chosenId) e.matched = true; });

      // add connection if not present
      const first = this.items.find(it => it.id === chosenId);
      if (first) {
        const exists = this.connections.find(c => c.wordId === chosenId && c.emojiId === chosenId);
        if (!exists) {
          this.connections.push({
            wordId: chosenId,
            emojiId: chosenId,
            word: first.word,
            emoji: first.emoji
          });
        }
      }
    });

    // update counters
    this.questionsCorrectInLevel = Math.min(this.questionsInLevel, this.questionsCorrectInLevel + toPick);
    this.score += toPick * 10;
    this.currentQuestion = Math.min(this.questionsInLevel + 1, this.currentQuestion + toPick);

    // if all matched, mark gameComplete
    if (this.items.every(i => i.matched)) {
      this.gameComplete = true;
    }
  }

  getProgress(): { level: number; question: number } {
    return { level: this.level, question: this.currentQuestion };
  }

  getQuestionCounterText(): string {
    return `${Math.min(this.currentQuestion - 1, this.questionsInLevel)}/${this.questionsInLevel}`;
  }
}
