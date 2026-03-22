// Voice Mode Variables
let recognition = null;
let isVoiceMode = false;
let isListening = false;
let isSpeaking = false;
let voiceEnabled = false;

// Initialize Voice Recognition
function initializeVoiceRecognition() {
    console.log('Initializing voice recognition...');
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        console.log('Speech recognition API available');
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onstart = function() {
            console.log('Speech recognition started');
            isListening = true;
            updateVoiceStatus('listening', 'Listening...');
            updateCallStatus('🎤 Listening... Speak now');
            document.getElementById('micBtn').classList.add('active');
        };
        
        recognition.onresult = function(event) {
            console.log('Speech recognition result:', event);
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            
            console.log('Transcript:', transcript);
            
            if (event.results[0].isFinal) {
                handleSpeechResult(transcript);
            } else {
                // Show interim transcript
                document.getElementById('voiceTranscript').textContent = `Hearing: "${transcript}"`;
                document.getElementById('voiceTranscript').style.display = 'block';
            }
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            handleVoiceError(event.error);
        };
        
        recognition.onend = function() {
            console.log('Speech recognition ended');
            isListening = false;
            document.getElementById('micBtn').classList.remove('active');
            if (!isSpeaking) {
                updateVoiceStatus('', 'Ready');
                updateCallStatus('🤖 AI Agent Ready');
            }
        };
        
        voiceEnabled = true;
        console.log('Voice recognition initialized successfully');
        document.getElementById('voiceToggle').style.display = 'inline-block';
        
        // Show ready status
        updateCallStatus('🤖 AI Agent Ready');
        
    } else {
        console.warn('Speech recognition not supported in this browser');
        showVoiceError('Voice recognition is not supported in your browser. Please use Chrome for the best experience.');
    }
}

// Toggle Voice Mode
function toggleVoiceMode() {
    console.log('Toggle voice mode clicked. Voice enabled:', voiceEnabled, 'Is listening:', isListening);
    
    if (!voiceEnabled) {
        showVoiceError('Voice features are not available in your browser. Please use Chrome.');
        return;
    }
    
    if (isListening) {
        console.log('Stopping voice recognition');
        stopListening();
    } else {
        console.log('Starting voice recognition');
        startListening();
    }
}

// Start Voice Recognition
function startListening() {
    console.log('Start listening called. Recognition:', recognition, 'Is speaking:', isSpeaking);
    
    if (!recognition || isSpeaking) {
        console.log('Cannot start: recognition not available or AI is speaking');
        return;
    }
    
    try {
        console.log('Starting speech recognition...');
        recognition.start();
        isVoiceMode = true;
        document.getElementById('textInputGroup').style.opacity = '0.5';
        document.getElementById('userInput').disabled = true;
        document.getElementById('callSimulation').classList.add('active');
    } catch (error) {
        console.error('Error starting recognition:', error);
        showVoiceError('Failed to start voice recognition. Please try again.');
    }
}

// Stop Voice Recognition
function stopListening() {
    if (recognition && isListening) {
        recognition.stop();
    }
    isVoiceMode = false;
    document.getElementById('textInputGroup').style.opacity = '1';
    document.getElementById('userInput').disabled = false;
    document.getElementById('voiceTranscript').style.display = 'none';
}

// Handle Speech Recognition Result
function handleSpeechResult(transcript) {
    document.getElementById('voiceTranscript').style.display = 'none';
    
    if (transcript.trim().length > 0) {
        // Display user message in chat
        const chatWindow = document.getElementById('chatWindow');
        const userDiv = document.createElement('div');
        userDiv.className = 'user-msg';
        userDiv.textContent = `You (Voice): ${transcript}`;
        chatWindow.appendChild(userDiv);
        
        // Update status
        updateVoiceStatus('processing', 'Processing...');
        updateCallStatus('🤖 AI is thinking...');
        
        // Send to backend
        sendMessageToBackend(transcript);
    } else {
        updateVoiceStatus('', 'Ready');
        updateCallStatus('🤖 AI Agent Ready');
    }
    
    chatWindow.scrollTop = chatWindow.scrollHeight;
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

// Text-to-Speech Function
function speakResponse(text) {
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onstart = function() {
            isSpeaking = true;
            updateVoiceStatus('speaking', 'AI is speaking...');
            updateCallStatus('🔊 AI is speaking...');
        };
        
        utterance.onend = function() {
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
        
        window.speechSynthesis.speak(utterance);
    } else {
        console.warn('Speech synthesis not supported');
    }
}

// Update Voice Status
function updateVoiceStatus(statusClass, message) {
    const statusElement = document.getElementById('voiceStatus');
    statusElement.className = 'voice-status';
    
    if (statusClass) {
        statusElement.classList.add(statusClass);
        statusElement.textContent = message;
        statusElement.style.display = 'inline-block';
    } else {
        statusElement.style.display = 'none';
    }
}

// Update Call Status
function updateCallStatus(message) {
    document.getElementById('callStatus').textContent = message;
}

// Handle Voice Errors
function handleVoiceError(error) {
    let errorMessage = 'Voice recognition failed';
    
    switch(error) {
        case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
        case 'audio-capture':
            errorMessage = 'Microphone not available. Please check permissions.';
            break;
        case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access.';
            break;
        case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
        default:
            errorMessage = `Voice error: ${error}`;
    }
    
    showVoiceError(errorMessage);
}

// Show Voice Error
function showVoiceError(message) {
    updateVoiceStatus('error', 'Voice Error');
    updateCallStatus(`❌ ${message}`);
    
    // Display error in chat
    const chatWindow = document.getElementById('chatWindow');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bot-msg';
    errorDiv.style.color = '#dc3545';
    errorDiv.textContent = `Voice Error: ${message}`;
    chatWindow.appendChild(errorDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    
    // Reset after 3 seconds
    setTimeout(() => {
        updateVoiceStatus('', 'Ready');
        updateCallStatus('🤖 AI Agent Ready');
    }, 3000);
}

// Initialize on page load
window.addEventListener('load', function() {
    initializeVoiceRecognition();
});

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

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}
