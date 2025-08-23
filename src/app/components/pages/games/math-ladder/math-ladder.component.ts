import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type MathOperation = '+' | '-' | '×' | '÷';

interface MathProblem {
  num1: number;
  num2: number;
  operation: MathOperation;
  answer: number;
  text: string;
  userAnswer?: number | null;
  isCorrect?: boolean;
}

interface GameState {
  currentStep: number;
  score: number;
  totalAttempts: number;
  isGameOver: boolean;
}

@Component({
  selector: 'app-math-ladder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './math-ladder.component.html',
  styleUrls: ['./math-ladder.component.css']
})
export class MathLadderComponent implements OnInit {
  // Game state
  state: GameState = {
    currentStep: 0,
    score: 0,
    totalAttempts: 0,
    isGameOver: false
  };

  // Game settings
  totalSteps = 10;
  minNumber = 1;
  maxNumber = 10;
  operations = new Set<MathOperation>(['+', '-', '×', '÷']);

  // Current problem
  currentProblem: MathProblem = this.generateProblem();
  userInput: number | null = null;
  feedback: string = '';
  showFeedback: boolean = false;
  isClimbing: boolean = false;

  ngOnInit(): void {
    this.startNewGame();
  }

  // Generate a random math problem based on current settings
  private generateProblem(): MathProblem {
    const operation = this.getRandomOperation();
    let num1: number, num2: number, answer: number;
    
    switch (operation) {
      case '+':
        num1 = this.getRandomNumber(this.minNumber, this.maxNumber);
        num2 = this.getRandomNumber(this.minNumber, this.maxNumber);
        answer = num1 + num2;
        break;
      case '-':
        num1 = this.getRandomNumber(this.minNumber, this.maxNumber * 0.7);
        num2 = this.getRandomNumber(0, num1);
        answer = num1 - num2;
        break;
      case '×':
        num1 = this.getRandomNumber(1, Math.min(10, this.maxNumber));
        num2 = this.getRandomNumber(1, Math.min(10, this.maxNumber / num1));
        answer = num1 * num2;
        break;
      case '÷':
        answer = this.getRandomNumber(1, Math.min(10, this.maxNumber));
        num2 = this.getRandomNumber(1, Math.min(10, this.maxNumber / answer));
        num1 = answer * num2;
        break;
    }

    return {
      num1,
      num2,
      operation,
      answer,
      text: `${num1} ${operation} ${num2} = ?`
    };
  }

  // Get a random number between min and max (inclusive)
  private getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Get a random operation
  private getRandomOperation(): MathOperation {
    const operations = Array.from(this.operations);
    return operations[Math.floor(Math.random() * operations.length)];
  }

  // Start a new game
  startNewGame(): void {
    this.state = {
      currentStep: 0,
      score: 0,
      totalAttempts: 0,
      isGameOver: false
    };
    this.currentProblem = this.generateProblem();
    this.userInput = null;
    this.feedback = '';
    this.showFeedback = false;
    this.isClimbing = false;
  }

  // Handle form submission
  async onSubmit(): Promise<void> {
    if (this.userInput === null || this.state.isGameOver) return;

    this.state.totalAttempts++;
    const isCorrect = Math.abs(Number(this.userInput) - this.currentProblem.answer) < 0.01;
    
    if (isCorrect) {
      this.state.score += 10;
      this.feedback = 'إجابة صحيحة! +10 نقاط';
      this.showFeedback = true;
      
      // Climb the ladder
      this.isClimbing = true;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for animation
      
      this.state.currentStep++;
      this.isClimbing = false;
      
      // Check if game is won
      if (this.state.currentStep >= this.totalSteps) {
        this.state.isGameOver = true;
        return;
      }
      
      // Generate new problem after a short delay
      setTimeout(() => {
        this.currentProblem = this.generateProblem();
        this.userInput = null;
        this.showFeedback = false;
      }, 500);
    }
  }

  // Handle incorrect answer
  private handleIncorrectAnswer(): void {
    this.feedback = 'حاول مرة أخرى! ';
    // Optional: Decrease score or add other penalties
  }

  // Get the current problem text for display
  get problemText(): string {
    return this.currentProblem?.text || '';
  }

  // Get the current progress percentage
  get progressPercentage(): number {
    return (this.state.currentStep / this.totalSteps) * 100;
  }

  // Handle keyboard input
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSubmit();
    }
  }
}
