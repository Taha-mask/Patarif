# Celebration Component

A reusable celebration modal component for all games to celebrate user achievements and level completion.

## Features

- 🎉 Beautiful celebration modal with animations
- 📊 Performance statistics display
- 🏆 Score visualization with progress bars
- ⏱️ Time tracking and bonus points
- 🎮 Multiple action options (continue, restart, main menu)
- 📱 Fully responsive design
- 🎨 Customizable difficulty colors and messages

## Usage

### 1. Import the Component

```typescript
import { CelebrationComponent, CelebrationData } from './celebration/celebration.component';
```

### 2. Add to Your Game Component

```typescript
export class YourGameComponent {
  showCelebration = false;
  celebrationData: CelebrationData = {
    level: 1,
    questionsCorrect: 4,
    totalQuestions: 5,
    bonusPoints: 25,
    timeElapsed: 120,
    difficulty: 'medium',
    gameType: 'Math Game'
  };

  onLevelComplete() {
    this.showCelebration = true;
  }

  onContinueToNextLevel() {
    this.showCelebration = false;
    // Your logic to move to next level
    this.nextLevel();
  }

  onRestartLevel() {
    this.showCelebration = false;
    // Your logic to restart level
    this.restartLevel();
  }

  onGoToMainMenu() {
    this.showCelebration = false;
    // Your logic to go to main menu
    this.navigateToMainMenu();
  }
}
```

### 3. Add to Your Template

```html
<app-celebration
  [data]="celebrationData"
  [isVisible]="showCelebration"
  (continueToNextLevel)="onContinueToNextLevel()"
  (restartLevel)="onRestartLevel()"
  (goToMainMenu)="onGoToMainMenu()">
</app-celebration>
```

## Input Properties

| Property | Type | Description |
|----------|------|-------------|
| `data` | `CelebrationData` | Celebration data including level, score, time, etc. |
| `isVisible` | `boolean` | Controls modal visibility |

## Output Events

| Event | Description |
|-------|-------------|
| `continueToNextLevel` | Emitted when user clicks continue button |
| `restartLevel` | Emitted when user clicks restart button |
| `goToMainMenu` | Emitted when user clicks main menu button |

## CelebrationData Interface

```typescript
interface CelebrationData {
  level: number;                    // Current level completed
  questionsCorrect: number;         // Number of correct answers
  totalQuestions: number;           // Total questions in level
  bonusPoints: number;              // Bonus points earned
  timeElapsed: number;              // Time taken in seconds
  difficulty: 'easy' | 'medium' | 'hard'; // Level difficulty
  gameType?: string;                // Optional game type identifier
}
```

## Styling

The component includes:
- Beautiful gradient backgrounds
- Smooth animations and transitions
- Responsive design for all screen sizes
- Custom difficulty-based color schemes
- Glassmorphism effects with backdrop blur

## Customization

You can customize:
- Colors and themes
- Animation timing
- Button text and icons
- Layout and spacing
- Responsive breakpoints

## Browser Support

- Modern browsers with CSS Grid and Flexbox support
- Backdrop-filter support for glassmorphism effects
- CSS animations and transitions

## Dependencies

- Angular Common Module
- Font Awesome icons (fas)
- CSS custom properties for theming
