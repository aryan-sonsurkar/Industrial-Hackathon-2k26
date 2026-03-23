// Voice Mode Variables
let recognition = null;
let isVoiceMode = false;
let isListening = false;
let isSpeaking = false;
let voiceEnabled = false;

// Initialize Voice Recognition
function initializeVoiceRecognition() {
    console.log('Initializing voice recognition...');
    
    // Cross-browser support check
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        console.warn('Speech recognition not supported in this browser');
        showVoiceFallback();
        return;
    }
    
    try {
        recognition = new SpeechRecognition();
        setupRecognitionEvents();
        voiceEnabled = true;
        console.log('✅ Voice recognition initialized successfully');
        
        // Show ready status
        updateCallStatus('🤖 AI Agent Ready');
        document.getElementById('voiceToggle').style.display = 'inline-block';
        
    } catch (error) {
        console.error('Failed to initialize speech recognition:', error);
        showVoiceFallback();
    }
}

// Setup Recognition Events
function setupRecognitionEvents() {
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    recognition.onstart = function() {
        console.log('🎤 Speech recognition started');
        isListening = true;
        updateVoiceStatus('listening', 'Listening...');
        updateCallStatus('🎤 Listening... Speak now');
        document.getElementById('micBtn').classList.add('active');
    };
    
    recognition.onresult = function(event) {
        console.log('📝 Speech recognition result:', event);
        
        const result = event.results[event.resultIndex];
        if (!result) return;
        
        const transcript = result[0].transcript;
        const confidence = Math.round((result[0].confidence || 0) * 100);
        
        console.log(`Transcript: "${transcript}" (Confidence: ${confidence}%)`);
        
        // Show interim results
        if (!result.isFinal) {
            document.getElementById('voiceTranscript').textContent = `Hearing: "${transcript}"`;
            document.getElementById('voiceTranscript').style.display = 'block';
            return;
        }
        
        // Handle final result
        handleSpeechResult(transcript);
    };
    
    recognition.onerror = function(event) {
        console.error('❌ Speech recognition error:', event.error);
        handleVoiceError(event.error);
    };
    
    recognition.onend = function() {
        console.log('🔇 Speech recognition ended');
        isListening = false;
        document.getElementById('micBtn').classList.remove('active');
        document.getElementById('voiceTranscript').style.display = 'none';
        
        if (!isSpeaking) {
            updateVoiceStatus('', 'Ready');
            updateCallStatus('🤖 AI Agent Ready');
        }
    };
}

// Handle Speech Result
function handleSpeechResult(transcript) {
    if (!transcript || transcript.trim().length === 0) {
        console.log('Empty transcript received');
        return;
    }
    
    console.log('✅ Final speech result:', transcript);
    
    // Hide interim transcript
    document.getElementById('voiceTranscript').style.display = 'none';
    
    // Update status
    updateVoiceStatus('processing', 'Processing...');
    updateCallStatus('🤖 AI is thinking...');
    
    // Display user message in chat
    const chatWindow = document.getElementById('chatWindow');
    const userDiv = document.createElement('div');
    userDiv.className = 'user-msg';
    userDiv.textContent = `You (Voice): ${transcript}`;
    chatWindow.appendChild(userDiv);
    
    // Send to backend
    sendMessageToBackend(transcript);
    
    // Scroll to bottom
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Handle Voice Errors
function handleVoiceError(error) {
    let errorMessage = 'Voice recognition failed';
    let userMessage = '';
    
    switch(error) {
        case 'no-speech':
            errorMessage = 'No speech detected';
            userMessage = '🔇 No speech detected. Please speak louder or check your microphone.';
            break;
        case 'not-allowed':
            errorMessage = 'Microphone permission denied';
            userMessage = '❌ Microphone access denied. Please click the 🔒 icon in your browser and allow microphone access.';
            break;
        case 'audio-capture':
            errorMessage = 'No microphone found';
            userMessage = '❌ No microphone found. Please connect a microphone.';
            break;
        case 'network':
            errorMessage = 'Network error';
            userMessage = '❌ Network error. Please check your internet connection.';
            break;
        case 'service-not-allowed':
            errorMessage = 'Speech recognition service not allowed';
            userMessage = '❌ Speech recognition service is not available. Please try text mode.';
            break;
        default:
            errorMessage = `Speech recognition error: ${error}`;
            userMessage = `❌ Voice error: ${error}. Please try again.`;
    }
    
    console.error('Voice Error:', errorMessage);
    updateVoiceStatus('error', 'Voice Error');
    updateCallStatus(`❌ ${errorMessage}`);
    
    // Show error in chat
    const chatWindow = document.getElementById('chatWindow');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bot-msg';
    errorDiv.style.color = '#dc3545';
    errorDiv.textContent = userMessage;
    chatWindow.appendChild(errorDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    
    // Reset status after delay
    setTimeout(() => {
        updateVoiceStatus('', 'Ready');
        updateCallStatus('🤖 AI Agent Ready');
    }, 3000);
}

// Show Voice Fallback
function showVoiceFallback() {
    voiceEnabled = false;
    updateVoiceStatus('error', 'Not Supported');
    updateCallStatus('❌ Voice not supported');
    
    const chatWindow = document.getElementById('chatWindow');
    const fallbackDiv = document.createElement('div');
    fallbackDiv.className = 'bot-msg';
    fallbackDiv.style.color = '#ffc107';
    fallbackDiv.textContent = '🔇 Voice recognition is not supported in your browser. Please use text input below.';
    chatWindow.appendChild(fallbackDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    
    // Hide voice button
    document.getElementById('micBtn').style.display = 'none';
}

// Toggle Voice Mode
function toggleVoiceMode() {
    console.log('🎤 Voice mode toggled. Voice enabled:', voiceEnabled, 'Is listening:', isListening);
    
    if (!voiceEnabled) {
        showVoiceFallback();
        return;
    }
    
    if (isListening) {
        stopVoiceRecognition();
    } else {
        startVoiceRecognition();
    }
}

// Start Voice Recognition
function startVoiceRecognition() {
    if (!recognition) {
        console.error('Recognition not initialized');
        return;
    }
    
    if (isSpeaking) {
        console.log('Cannot start: AI is currently speaking');
        return;
    }
    
    // Request microphone permission first
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            console.log('✅ Microphone permission granted');
            stream.getTracks().forEach(track => track.stop());
            
            try {
                recognition.start();
                isVoiceMode = true;
                document.getElementById('textInputGroup').style.opacity = '0.5';
                document.getElementById('userInput').disabled = true;
                document.getElementById('callSimulation').classList.add('active');
            } catch (error) {
                console.error('Failed to start recognition:', error);
                handleVoiceError('start-failed');
            }
        })
        .catch(err => {
            console.error('Microphone permission error:', err);
            if (err.name === 'NotAllowedError') {
                handleVoiceError('not-allowed');
            } else if (err.name === 'NotFoundError') {
                handleVoiceError('audio-capture');
            } else {
                handleVoiceError('permission-error');
            }
        });
}

// Stop Voice Recognition
function stopVoiceRecognition() {
    if (recognition && isListening) {
        try {
            recognition.stop();
        } catch (error) {
            console.error('Error stopping recognition:', error);
        }
    }
    
    isVoiceMode = false;
    document.getElementById('textInputGroup').style.opacity = '1';
    document.getElementById('userInput').disabled = false;
    document.getElementById('callSimulation').classList.remove('active');
}

// Text-to-Speech Function - Female Voice
function speakResponse(text) {
    if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported');
        return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;  // Slightly higher pitch for female-like voice
    utterance.volume = 1;
    utterance.lang = 'en-US';
    
    // Get available voices and select a female one
    function getFemaleVoice() {
        const voices = window.speechSynthesis.getVoices();
        
        // Look for female voice names (common patterns)
        const femaleVoicePatterns = [
            'female', 'woman', 'girl', 'samantha', 'victoria', 
            'karen', 'moira', 'tessa', 'serena', 'zira',
            'Google UK English Female', 'Microsoft Zira', 
            'Microsoft Hazel', 'Google US English'
        ];
        
        // Try to find a female voice
        for (let pattern of femaleVoicePatterns) {
            const voice = voices.find(v => 
                v.name.toLowerCase().includes(pattern.toLowerCase()) ||
                v.name.includes('Female')
            );
            if (voice) {
                console.log(`✅ Selected female voice: ${voice.name}`);
                return voice;
            }
        }
        
        // Fallback to any English voice
        const englishVoice = voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) {
            console.log(`ℹ️ Using voice: ${englishVoice.name}`);
            return englishVoice;
        }
        
        // Default voice
        return null;
    }
    
    // Set voice if available
    const selectedVoice = getFemaleVoice();
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }
    
    utterance.onstart = function() {
        console.log('🔊 AI started speaking');
        isSpeaking = true;
        updateVoiceStatus('speaking', 'AI is speaking...');
        updateCallStatus('🔊 AI is speaking...');
    };
    
    utterance.onend = function() {
        console.log('🔊 AI finished speaking');
        isSpeaking = false;
        updateVoiceStatus('', 'Ready');
        updateCallStatus('🤖 AI Agent Ready');
    };
    
    utterance.onerror = function(event) {
        console.error('Speech synthesis error:', event.error);
        isSpeaking = false;
        updateVoiceStatus('', 'Ready');
        updateCallStatus('🤖 AI Agent Ready');
    };
    
    try {
        // Ensure voices are loaded before speaking
        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = function() {
                const voice = getFemaleVoice();
                if (voice) utterance.voice = voice;
                window.speechSynthesis.speak(utterance);
            };
        } else {
            window.speechSynthesis.speak(utterance);
        }
    } catch (error) {
        console.error('Failed to speak:', error);
    }
}

// Update Voice Status
function updateVoiceStatus(statusClass, message) {
    const statusElement = document.getElementById('voiceStatus');
    statusElement.className = 'voice-status';
    
    if (statusClass && message) {
        statusElement.classList.add(statusClass);
        statusElement.textContent = message;
        statusElement.style.display = 'inline-block';
    } else {
        statusElement.style.display = 'none';
    }
}

// Update Call Status
function updateCallStatus(message) {
    const callStatus = document.getElementById('callStatus');
    if (callStatus) {
        callStatus.textContent = message;
    }
}

// Send Message to Backend (Enhanced for Voice)
async function sendMessageToBackend(message) {
    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        // Display bot response
        const chatWindow = document.getElementById('chatWindow');
        const botDiv = document.createElement('div');
        botDiv.className = 'bot-msg';
        botDiv.textContent = `SupportAI: ${data.response}`;
        chatWindow.appendChild(botDiv);
        
        // Update AI Analysis Breakdown
        document.getElementById('aiDetails').style.display = 'block';
        document.getElementById('resCategory').textContent = data.category;
        document.getElementById('resSentiment').textContent = data.sentiment;
        document.getElementById('resConfidence').textContent = data.confidence;
        document.getElementById('resEscalation').textContent = data.escalation;
        
        // Handle new fields
        if (data.escalation_level) {
            document.getElementById('resEscalationLevel').textContent = data.escalation_level;
        }
        if (data.decision_trace) {
            document.getElementById('resDecisionTrace').textContent = data.decision_trace;
        }
        
        const escalation = document.getElementById('resEscalation');
        escalation.textContent = data.escalation;
        escalation.className = data.escalation === 'Yes' ? 'escalation-yes' : 'escalation-no';

        // Speak response if in voice mode
        if (isVoiceMode || voiceEnabled) {
            speakResponse(data.response);
        }

        // Scroll to bottom
        chatWindow.scrollTop = chatWindow.scrollHeight;
        
        // Update call status
        updateCallStatus('🤖 AI Agent Ready');
        updateVoiceStatus('', 'Ready');

    } catch (error) {
        console.error('Error fetching chat response:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bot-msg';
        errorDiv.textContent = 'Error: Could not reach the server.';
        document.getElementById('chatWindow').appendChild(errorDiv);
        
        updateVoiceStatus('error', 'Connection Error');
        updateCallStatus('❌ Connection Error');
    }
}

// Regular text message function
async function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    if (!message) return;

    // Cancel any ongoing speech when user types
    if (isSpeaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
    }

    // Display user message in chat
    const chatWindow = document.getElementById('chatWindow');
    const userDiv = document.createElement('div');
    userDiv.className = 'user-msg';
    userDiv.textContent = `You: ${message}`;
    chatWindow.appendChild(userDiv);
    
    // Clear input
    input.value = '';
    input.focus();

    // Send to backend using enhanced function
    await sendMessageToBackend(message);
}

// View Stats
async function viewStats() {
    try {
        const response = await fetch('/stats');
        const data = await response.json();
        const statsBox = document.getElementById('statsBox');
        
        statsBox.style.display = 'block';
        statsBox.innerHTML = `
            <h3>Session Statistics</h3>
            <div><strong>Total Queries:</strong> ${data.total_queries}</div>
            <div><strong>Escalation Count:</strong> ${data.escalation_count}</div>
            <div><strong>Category Breakdown:</strong><br>
                <ul>
                    ${Object.entries(data.category_counts).map(([cat, count]) => `<li>${cat}: ${count}</li>`).join('')}
                </ul>
            </div>
            <div style="margin-top: 10px; font-size: 0.85em; color: #666;">
                <strong>Voice Mode:</strong> ${voiceEnabled ? 'Available' : 'Not Supported'}<br>
                <strong>Browser:</strong> ${navigator.userAgent.split(' ')[0]}
            </div>
        `;
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

// Handle Enter key
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Initialize on page load
window.addEventListener('load', function() {
    console.log('🚀 SupportAI Voice Chat loading...');
    
    // Debug: Check if button exists
    const micBtn = document.getElementById('micBtn');
    if (micBtn) {
        console.log('✅ Microphone button found');
        
        // Add click listener as backup
        micBtn.addEventListener('click', function() {
            console.log('🎤 Microphone button clicked!');
            toggleVoiceMode();
        });
    } else {
        console.error('❌ Microphone button not found!');
    }
    
    initializeVoiceRecognition();
});
