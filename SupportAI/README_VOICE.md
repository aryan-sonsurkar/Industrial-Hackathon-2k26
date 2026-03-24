z# SupportAI Voice Mode - Usage Guide

## 🎤 Voice Agent Mode Features

The SupportAI system now includes a **voice-based AI interaction** feature that simulates a real customer support call experience.

### How to Use Voice Mode

1. **Start the Application**
   ```bash
   python app.py
   ```
   Open http://127.0.0.1:5000 in Chrome browser

2. **Enable Voice Mode**
   - Click the 🎤 microphone button
   - Grant microphone permissions when prompted
   - The system will start listening

3. **Voice Interaction Flow**
   - 🎤 **Listening**: Speak your query clearly
   - 🤖 **Processing**: AI analyzes your request
   - 🔊 **AI Speaking**: Hear the AI response
   - 🤖 **Ready**: System ready for next query

### Voice Controls

| Button | Status | Action |
|--------|--------|--------|
| 🎤 (inactive) | Ready to start voice | Click to begin voice interaction |
| 🎤 (red, pulsing) | Listening actively | Click to stop listening |
| 🎤 (disabled) | AI speaking or error | Wait for completion |

### Status Indicators

- **🟢 Listening...** - System is capturing your speech
- **🟡 Processing...** - AI is analyzing your request
- **🔵 AI is speaking...** - AI response is being played
- **🔴 Voice Error** - Microphone or network issue

### Browser Compatibility

**✅ Recommended**: Chrome/Edge (full support)
**⚠️ Limited**: Firefox, Safari (partial support)
**❌ Not Supported**: Older browsers

### Voice Commands

You can use natural language for all support queries:

- "My invoice is incorrect and I was charged twice!"
- "I need help with web development for my startup"
- "This is not helpful, I want to speak to a human agent"
- "My website is down and I can't access the dashboard"

### Call Simulation UI

The interface includes a **call simulation** that displays:
- 🤖 Connecting to AI Agent...
- 🎤 Listening... Speak now
- 🤖 AI is thinking...
- 🔊 AI is speaking...
- 🤖 AI Agent Ready

### Error Handling

The system automatically handles:
- **Microphone denied**: Shows permission guide
- **No speech detected**: Prompts to try again
- **Network errors**: Displays connection issues
- **Browser incompatibility**: Falls back to text mode

### Fallback Options

If voice mode fails:
1. **Text Mode**: Type messages manually (always available)
2. **Refresh Page**: Restart voice recognition
3. **Check Permissions**: Ensure microphone access is granted
4. **Use Chrome**: Best compatibility guaranteed

### Features Integration

Voice mode works seamlessly with:
- ✅ Enhanced AI decision tracing
- ✅ Escalation level detection
- ✅ Service mapping
- ✅ Confidence scoring
- ✅ Memory system for repeated issues
- ✅ Session statistics

### Technical Details

**Speech Recognition**: Web Speech API (webkitSpeechRecognition)
**Text-to-Speech**: Speech Synthesis API
**Language**: English (US)
**Audio Quality**: Optimized for clear speech recognition

### Privacy & Security

- Voice data is processed locally in browser
- No voice recordings stored on server
- Real-time processing only
- Standard HTTPS security for API calls

---

**Tip**: For best results, speak clearly and minimize background noise. The system works best in quiet environments with a good microphone.
