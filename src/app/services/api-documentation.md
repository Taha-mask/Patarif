# API Integration Documentation

## Overview
This document describes the integration of Open Trivia API and Pixabay API for educational games.

## APIs Used

### 1. Open Trivia API (https://opentdb.com/)
- **Purpose**: Fetch trivia questions
- **Rate Limit**: No authentication required
- **Categories**: Kid-friendly categories filtered

### 2. Pixabay API (https://pixabay.com/api/docs/)
- **Purpose**: Fetch images for questions
- **Rate Limit**: 5000 requests/hour (free tier)
- **Authentication**: API key required

## Sample JSON Structures

### Open Trivia API Response
```json
{
  "response_code": 0,
  "results": [
    {
      "category": "General Knowledge",
      "type": "multiple",
      "difficulty": "easy",
      "question": "What color is the sky on a sunny day?",
      "correct_answer": "Blue",
      "incorrect_answers": ["Red", "Green", "Yellow"]
    }
  ]
}
```

### Pixabay API Response
```json
{
  "total": 1234,
  "totalHits": 1234,
  "hits": [
    {
      "id": 123456,
      "webformatURL": "https://pixabay.com/get/...",
      "previewURL": "https://cdn.pixabay.com/photo/...",
      "tags": "cat, animal, pet",
      "user": "photographer"
    }
  ]
}
```

### Processed Question Structure
```json
{
  "id": 1,
  "question": "What color is the sky on a sunny day?",
  "correctAnswer": "Blue",
  "options": ["Blue", "Red", "Green", "Yellow"],
  "category": "General Knowledge",
  "difficulty": "easy",
  "imageUrl": "https://pixabay.com/get/...",
  "imageKeyword": "sky",
  "type": "multiple"
}
```

## Setup Instructions

### 1. Get Pixabay API Key
1. Go to https://pixabay.com/api/docs/
2. Sign up for a free account
3. Get your API key
4. Replace `YOUR_PIXABAY_API_KEY` in `api.service.ts`

### 2. Update Angular Module
Add `HttpClientModule` to your app module:

```typescript
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    HttpClientModule,
    // ... other imports
  ]
})
```

### 3. Environment Configuration
Create environment files for API keys:

```typescript
// environment.ts
export const environment = {
  production: false,
  pixabayApiKey: 'YOUR_PIXABAY_API_KEY'
};
```

## Usage Examples

### Basic Usage
```typescript
constructor(private apiService: ApiService) {}

ngOnInit() {
  this.apiService.fetchTriviaQuestions(5, 9, 'easy').subscribe({
    next: (questions) => {
      console.log('Questions loaded:', questions);
    },
    error: (error) => {
      console.error('Error loading questions:', error);
    }
  });
}
```

### With Images
```typescript
// Questions will automatically include images if keywords are detected
this.apiService.fetchTriviaQuestions(5).subscribe(questions => {
  questions.forEach(q => {
    if (q.imageUrl) {
      console.log(`Question ${q.id} has image: ${q.imageUrl}`);
    }
  });
});
```

## Features

### ✅ Implemented Features
- [x] Fetch trivia questions from Open Trivia API
- [x] Fetch relevant images from Pixabay API
- [x] Automatic keyword extraction for images
- [x] HTML entity decoding
- [x] Option shuffling
- [x] Error handling with fallback questions
- [x] Loading states
- [x] Kid-friendly category filtering
- [x] Safe search enabled for Pixabay

### 🎯 Game Integration
- [x] Fact Game (True/False) - Enhanced with API questions
- [x] Country Guessing - Ready for API integration
- [x] Letters Game - Ready for API integration

### 🔄 Future Enhancements
- [ ] Sound effects for correct/wrong answers
- [ ] More sophisticated image keyword matching
- [ ] Question difficulty progression
- [ ] Offline mode with cached questions
- [ ] Multi-language support
- [ ] Custom question categories

## Error Handling

### API Failures
- **Open Trivia API down**: Falls back to predefined questions
- **Pixabay API down**: Questions load without images
- **Network issues**: Graceful degradation with fallback content

### Rate Limiting
- Pixabay: 5000 requests/hour (free tier)
- Open Trivia: No limits
- Implemented request caching for efficiency

## Security Considerations

### Safe Content
- Pixabay safe search enabled
- Kid-friendly categories only
- Content filtering for inappropriate material

### API Keys
- Store in environment files
- Never commit to version control
- Use different keys for development/production

## Performance Optimization

### Caching Strategy
- Cache questions for 1 hour
- Cache images for 24 hours
- Implement service worker for offline access

### Image Optimization
- Use appropriate image sizes
- Lazy loading for images
- Progressive image loading

## Testing

### Unit Tests
```typescript
describe('ApiService', () => {
  it('should fetch trivia questions', () => {
    // Test implementation
  });
  
  it('should handle API errors gracefully', () => {
    // Test error handling
  });
});
```

### Integration Tests
- Test API connectivity
- Test image loading
- Test fallback mechanisms

## Troubleshooting

### Common Issues
1. **CORS errors**: Ensure proper API endpoints
2. **API key issues**: Verify Pixabay API key
3. **Image loading**: Check network connectivity
4. **Question formatting**: Verify HTML entity decoding

### Debug Mode
Enable debug logging:
```typescript
// In api.service.ts
private readonly DEBUG = true;

private log(message: string, data?: any) {
  if (this.DEBUG) {
    console.log(`[ApiService] ${message}`, data);
  }
}
```

## Contributing

### Adding New Features
1. Update interfaces in `api.service.ts`
2. Add new methods to `ApiService`
3. Update documentation
4. Add unit tests
5. Test with real API calls

### Code Style
- Follow Angular style guide
- Use TypeScript strict mode
- Add JSDoc comments
- Handle all error cases 
