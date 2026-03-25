// ============================================
// SupportAI Production Version - Voice Call & Enhanced Features
// ============================================

// Global Variables
let recognition = null;
let isVoiceMode = false;
let isListening = false;
let isSpeaking = false;
let voiceEnabled = false;
let isCallActive = false;
let callTimer = null;
let callDuration = 0;
let conversationHistory = [];
let sessionId = Date.now().toString();
let silenceTimer = null;

// Configuration
const CONFIG = {
    silenceTimeout: 5000,
    speechDelay: 500,
    autoSpeak: true,
    continuousMode: false
};

// ============================================
// Voice Call Mode - Persistent Call Experience
// ============================================

function initializeVoiceRecognition() {
    console.log('🚀 Initializing SupportAI Voice System...');
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        console.warn('❌ Speech recognition not supported');
        showVoiceFallback();
        return;
    }
    
    try {
        recognition = new SpeechRecognition();
        setupRecognitionEvents();
        voiceEnabled = true;
        console.log('✅ Voice system initialized');
        updateCallStatus('🤖 AI Agent Ready - Click "Start Call" to begin');
    } catch (error) {
        console.error('❌ Voice initialization failed:', error);
        showVoiceFallback();
    }
}

function setupRecognitionEvents() {
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    recognition.onstart = function() {
        console.log('🎤 Listening started');
        isListening = true;
        updateVoiceStatus('listening', 'Listening...');
        updateCallStatus('🎤 Listening... Speak now');
        const micBtn = document.getElementById('micBtn');
        if (micBtn) micBtn.classList.add('active');
        const callBtn = document.getElementById('callBtn');
        if (callBtn) callBtn.classList.add('active');
        startSilenceTimer();
    };
    
    recognition.onresult = function(event) {
        resetSilenceTimer();
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        if (interimTranscript) {
            showInterimTranscript(interimTranscript);
        }
        
        if (finalTranscript.trim()) {
            console.log('✅ Final transcript:', finalTranscript);
            handleSpeechResult(finalTranscript);
        }
    };
    
    recognition.onerror = function(event) {
        console.error('❌ Speech error:', event.error);
        if (event.error === 'no-speech') {
            console.log('🔇 No speech detected, continuing...');
            if (isCallActive) restartListening();
        } else if (event.error !== 'aborted') {
            handleVoiceError(event.error);
        }
    };
    
    recognition.onend = function() {
        console.log('🔇 Recognition ended');
        isListening = false;
        const micBtn = document.getElementById('micBtn');
        if (micBtn) micBtn.classList.remove('active');
        if (isCallActive && !isSpeaking) {
            setTimeout(() => restartListening(), 500);
        } else if (!isCallActive) {
            updateVoiceStatus('', 'Ready');
            updateCallStatus('🤖 Call Ended');
        }
    };
}

function startSilenceTimer() {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
        if (isListening && isCallActive && !isSpeaking) {
            console.log('⏰ Silence detected, auto-restarting...');
            restartListening();
        }
    }, CONFIG.silenceTimeout);
}

function resetSilenceTimer() {
    clearTimeout(silenceTimer);
    startSilenceTimer();
}

function restartListening() {
    if (!recognition || !isCallActive) return;
    try {
        recognition.stop();
        setTimeout(() => {
            if (isCallActive && !isSpeaking) recognition.start();
        }, 300);
    } catch (error) {
        console.error('Restart error:', error);
    }
}

function showInterimTranscript(text) {
    const transcriptDiv = document.getElementById('voiceTranscript');
    if (transcriptDiv) {
        transcriptDiv.textContent = `Hearing: "${text}"`;
        transcriptDiv.style.display = 'block';
    }
}

// ============================================
// Call Mode Controls
// ============================================

function toggleCallMode() {
    if (!voiceEnabled) {
        alert('Voice recognition not available. Please use Chrome.');
        return;
    }
    if (isCallActive) endCall();
    else startCall();
}

function startCall() {
    console.log('📞 Starting call...');
    isCallActive = true;
    callDuration = 0;
    
    const callBtn = document.getElementById('callBtn');
    if (callBtn) {
        callBtn.innerHTML = '🔴 End Call';
        callBtn.classList.add('active');
    }
    const callSim = document.getElementById('callSimulation');
    if (callSim) callSim.classList.add('active');
    updateCallStatus('📞 Call Active - Speak now');
    
    startCallTimer();
    
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            stream.getTracks().forEach(track => track.stop());
            try { recognition.start(); }
            catch (e) { console.error('Start error:', e); }
        })
        .catch(err => {
            alert('Please allow microphone access.');
            endCall();
        });
}

function endCall() {
    console.log('📞 Ending call...');
    isCallActive = false;
    
    if (recognition && isListening) {
        try { recognition.stop(); } catch (e) {}
    }
    
    clearInterval(callTimer);
    clearTimeout(silenceTimer);
    
    const callBtn = document.getElementById('callBtn');
    if (callBtn) {
        callBtn.innerHTML = '📞 Start Call';
        callBtn.classList.remove('active');
    }
    const callSim = document.getElementById('callSimulation');
    if (callSim) callSim.classList.remove('active');
    const voiceTrans = document.getElementById('voiceTranscript');
    if (voiceTrans) voiceTrans.style.display = 'none';
    
    updateCallStatus(`🤖 Call Ended (${formatDuration(callDuration)})`);
    updateVoiceStatus('', 'Ready');
    
    if (conversationHistory.length > 0) showSaveChatDialog();
}

function startCallTimer() {
    const timerDiv = document.getElementById('callTimer');
    callTimer = setInterval(() => {
        callDuration++;
        if (timerDiv) timerDiv.textContent = formatDuration(callDuration);
    }, 1000);
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

// ============================================
// Speech Handling & TTS (Enhanced)
// ============================================

function handleSpeechResult(transcript) {
    if (!transcript || transcript.trim().length === 0) return;
    const voiceTrans = document.getElementById('voiceTranscript');
    if (voiceTrans) voiceTrans.style.display = 'none';
    updateVoiceStatus('processing', 'Processing...');
    updateCallStatus('🤖 AI is thinking...');
    addToConversation('You', transcript);
    displayMessage('You', transcript, 'user-msg');
    sendMessageToBackend(transcript);
}

function handleVoiceError(error) {
    const messages = {
        'not-allowed': '❌ Microphone access denied',
        'audio-capture': '❌ No microphone found',
        'network': '❌ Network error'
    };
    const msg = messages[error] || `❌ Error: ${error}`;
    updateCallStatus(msg);
    displayMessage('System', msg, 'bot-msg error');
}

function speakResponse(text, priority = false) {
    if (!CONFIG.autoSpeak || !('speechSynthesis' in window)) return;
    if (priority || isSpeaking) window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    utterance.lang = 'en-US';
    
    const voices = window.speechSynthesis.getVoices();
    const femaleVoices = ['Google UK English Female', 'Microsoft Zira', 'Samantha', 'Victoria'];
    const voice = voices.find(v => femaleVoices.some(fv => v.name.includes(fv)));
    if (voice) utterance.voice = voice;
    
    utterance.onstart = () => {
        isSpeaking = true;
        updateVoiceStatus('speaking', 'AI Speaking...');
        updateCallStatus('🔊 AI is speaking...');
    };
    
    utterance.onend = () => {
        isSpeaking = false;
        updateVoiceStatus('', 'Ready');
        if (isCallActive) {
            updateCallStatus('🎤 Listening... Speak now');
            setTimeout(() => restartListening(), 300);
        } else {
            updateCallStatus('🤖 AI Agent Ready');
        }
    };
    
    setTimeout(() => window.speechSynthesis.speak(utterance), CONFIG.speechDelay);
}

// ============================================
// Backend Communication (Enhanced)
// ============================================

async function sendMessageToBackend(message) {
    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message,
                conversation_history: conversationHistory,
                session_id: sessionId
            })
        });

        const data = await response.json();
        
        if (data.source === 'knowledge_base') {
            console.log('📚 Answer from knowledge base');
        }
        
        displayMessage('SupportAI', data.response, 'bot-msg');
        addToConversation('SupportAI', data.response);
        updateAnalysisDisplay(data);
        speakResponse(data.response, true);
        
        if (data.escalation === 'Yes') {
            showEscalationDialog(data);
        }
        
        return data;
    } catch (error) {
        console.error('❌ Backend error:', error);
        displayMessage('System', 'Error connecting to server.', 'bot-msg error');
    }
}

function addToConversation(sender, text) {
    conversationHistory.push({
        sender, text,
        time: new Date().toLocaleTimeString()
    });
}

function displayMessage(sender, text, className) {
    const chatWindow = document.getElementById('chatWindow');
    if (!chatWindow) return;
    const div = document.createElement('div');
    div.className = `${className} msg`;
    
    // Add icon based on sender
    let icon = '';
    if (sender === 'You' || className.includes('user-msg')) {
        icon = '<i class="fas fa-user"></i> ';
    } else if (sender === 'SupportAI' || className.includes('bot-msg')) {
        icon = '<i class="fas fa-robot"></i> ';
    } else if (className.includes('error')) {
        icon = '<i class="fas fa-exclamation-triangle"></i> ';
    }
    
    div.innerHTML = `<strong>${icon}${sender}:</strong> ${text}`;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function updateAnalysisDisplay(data) {
    const aiDetails = document.getElementById('aiDetails');
    if (aiDetails) {
        aiDetails.style.display = 'block';
        
        // Display summary at the top if available
        const summaryDiv = document.getElementById('resSummary');
        if (summaryDiv) summaryDiv.textContent = data.summary || 'N/A';
        
        // Update existing fields
        document.getElementById('resCategory').textContent = data.category || 'N/A';
        document.getElementById('resService').textContent = data.service || 'N/A';
        document.getElementById('resSentiment').textContent = data.sentiment || 'N/A';
        document.getElementById('resConfidence').textContent = (data.confidence || 0) + '%';
        document.getElementById('resEscalation').textContent = data.escalation || 'No';
        document.getElementById('resDecisionTrace').textContent = data.decision_trace || 'N/A';
        
        // Display new fields
        const resConfidenceReason = document.getElementById('resConfidenceReason');
        if (resConfidenceReason) resConfidenceReason.textContent = data.confidence_reason || 'N/A';
        
        const resResponseTime = document.getElementById('resResponseTime');
        if (resResponseTime) resResponseTime.textContent = data.response_time || 'N/A';
        
        const resEscalationPriority = document.getElementById('resEscalationPriority');
        if (resEscalationPriority) {
            resEscalationPriority.textContent = data.escalation_priority || 'Low';
            // Highlight if High priority
            resEscalationPriority.className = data.escalation_priority === 'High' ? 'priority-high' : 
                                              data.escalation_priority === 'Medium' ? 'priority-medium' : 'priority-low';
        }
        
        // Display suggested actions as bullet points
        const resSuggestedActions = document.getElementById('resSuggestedActions');
        if (resSuggestedActions && data.suggested_actions) {
            resSuggestedActions.innerHTML = data.suggested_actions
                .map(action => `<li>${action}</li>`)
                .join('');
        }
        
        const resService = document.getElementById('resService');
        if (resService) resService.textContent = data.service || 'N/A';
    }
}

// ============================================
// Escalation Dialog
// ============================================

function showEscalationDialog(data) {
    let modal = document.getElementById('escalationModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'escalationModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>⚠️ Escalation Required</h3>
                <p>This issue requires human agent attention.</p>
                <div class="escalation-form">
                    <label>Contact Method:</label>
                    <select id="escalationType">
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                    </select>
                    <input type="text" id="escalationContact" placeholder="Enter email or phone" />
                    <button onclick="submitEscalation()">Submit Escalation</button>
                    <button onclick="closeEscalationModal()">Cancel</button>
                </div>
                <div id="escalationResult"></div>
            </div>`;
        document.body.appendChild(modal);
    }
    modal.style.display = 'block';
    modal.dataset.category = data.category;
    modal.dataset.sentiment = data.sentiment;
    modal.dataset.issue = data.issue;
}

function closeEscalationModal() {
    const modal = document.getElementById('escalationModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Simple Contact Collection Functions
function showContactModal() {
    let modal = document.getElementById('contactModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'contactModal';
        modal.className = 'modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>📞 Provide Contact Information</h3>
                <p style="margin-bottom: 15px; color: #666;">Please enter your email or phone number so we can contact you.</p>
                <div class="escalation-form">
                    <input type="text" id="simpleContact" placeholder="Enter your email or phone number" style="width: 100%; margin-bottom: 10px;">
                    <button onclick="submitSimpleContact()">Submit Contact</button>
                    <button onclick="closeContactModal()">Skip</button>
                </div>
                <div id="contactResult" style="margin-top: 15px;"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.style.display = 'block';
}

function closeContactModal() {
    const modal = document.getElementById('contactModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function submitSimpleContact() {
    const contactInput = document.getElementById('simpleContact');
    const resultDiv = document.getElementById('contactResult');
    
    if (!contactInput || !resultDiv) {
        console.error('Contact form elements not found');
        return;
    }
    
    const contact = contactInput.value.trim();
    
    if (!contact) {
        resultDiv.innerHTML = '<div class="error">❌ Please enter your email or phone number</div>';
        return;
    }
    
    try {
        const response = await fetch('/collect-contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contact: contact })
        });
        
        const data = await response.json();
        if (data.success) {
            resultDiv.innerHTML = `<div class="success">✅ ${data.message}</div>`;
            
            // Clear input
            contactInput.value = '';
            
            // Close modal after delay
            setTimeout(() => {
                closeContactModal();
            }, 2000);
        } else {
            resultDiv.innerHTML = `<div class="error">❌ ${data.error || 'Failed to save contact'}</div>`;
        }
    } catch (error) {
        console.error('Contact submission error:', error);
        resultDiv.innerHTML = '<div class="error">❌ Failed to save contact. Please try again.</div>';
    }
}

function updateContactPlaceholder() {
    const typeSelect = document.getElementById('escalationType');
    const contactInput = document.getElementById('escalationContact');
    
    if (!typeSelect || !contactInput) {
        console.error('Contact form elements not found');
        return;
    }
    
    const type = typeSelect.value;
    
    if (type === 'phone') {
        contactInput.placeholder = 'Enter phone number with country code (e.g., +1234567890)';
    } else {
        contactInput.placeholder = 'Enter your email address';
    }
}

function validatePhoneNumber(phone) {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's a valid phone number (10-15 digits)
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
}

async function submitEscalation() {
    const modal = document.getElementById('escalationModal');
    const nameInput = document.getElementById('escalationName');
    const typeSelect = document.getElementById('escalationType');
    const contactInput = document.getElementById('escalationContact');
    
    if (!modal || !nameInput || !typeSelect || !contactInput) {
        console.error('Escalation form elements not found');
        alert('Form error. Please refresh the page and try again.');
        return;
    }
    
    const name = nameInput.value.trim();
    const type = typeSelect.value;
    const contact = contactInput.value.trim();
    
    if (!name) { 
        alert('Please enter your full name'); 
        return; 
    }
    
    if (!contact) { 
        alert('Please enter contact information'); 
        return; 
    }
    
    // Validate contact based on type
    if (type === 'email') {
        if (!contact.includes('@') || !contact.includes('.')) {
            alert('Please enter a valid email address');
            return;
        }
    } else if (type === 'phone') {
        if (!validatePhoneNumber(contact)) {
            alert('Please enter a valid phone number with country code (e.g., +1234567890)');
            return;
        }
    }
    
    // Get the last message for query
    const lastMessage = conversationHistory[conversationHistory.length - 1];
    const queryText = lastMessage ? lastMessage.text : '';
    
    try {
        const response = await fetch('/escalate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: queryText,
                category: modal.dataset.category,
                sentiment: modal.dataset.sentiment,
                issue: modal.dataset.issue,
                conversation: conversationHistory,
                user_name: name,
                contact_type: type,
                contact_value: contact
            })
        });
        
        const data = await response.json();
        if (data.success) {
            let resultHTML = `<div class="success">✅ ${data.message}</div>`;
            resultHTML += `<div style="margin-top: 10px;"><strong>Ticket ID:</strong> ${data.ticket_id}</div>`;
            resultHTML += `<div style="margin-top: 5px;"><strong>Name:</strong> ${name}</div>`;
            resultHTML += `<div style="margin-top: 5px;"><strong>Contact:</strong> ${contact}</div>`;
            
            // Add WhatsApp link if available
            if (data.whatsapp_url) {
                resultHTML += `<br><a href="${data.whatsapp_url}" target="_blank" class="whatsapp-link">📱 Open WhatsApp to Contact Support</a>`;
            }
            
            const resultElement = document.getElementById('escalationResult');
            const formElement = document.getElementById('escalationForm');
            
            if (resultElement) {
                resultElement.innerHTML = resultHTML;
            }
            
            if (formElement) {
                formElement.style.display = 'none';
            }
            
            // Close modal after delay
            setTimeout(() => {
                closeEscalationModal();
            }, 5000);
        } else {
            const resultElement = document.getElementById('escalationResult');
            if (resultElement) {
                resultElement.innerHTML = `<div class="error">❌ ${data.error || 'Escalation failed'}</div>`;
            }
        }
    } catch (error) {
        console.error('Escalation error:', error);
        const resultElement = document.getElementById('escalationResult');
        if (resultElement) {
            resultElement.innerHTML = '<div class="error">❌ Failed to create escalation ticket. Please try again.</div>';
        }
    }
}

// ============================================
// Save Chat Dialog
// ============================================

function showSaveChatDialog() {
    let modal = document.getElementById('saveChatModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'saveChatModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>💾 Save Chat Transcript?</h3>
                <p>Would you like to save this conversation?</p>
                <div class="save-options">
                    <button onclick="saveChat('email')">📧 Email</button>
                    <button onclick="saveChat('whatsapp')">💬 WhatsApp</button>
                    <button onclick="closeSaveChatModal()">❌ Skip</button>
                </div>
                <div id="saveChatForm" style="display:none;">
                    <input type="text" id="saveContact" placeholder="Enter email or phone" />
                    <button onclick="submitSaveChat()">Send</button>
                </div>
                <div id="saveChatResult"></div>
            </div>`;
        document.body.appendChild(modal);
    }
    modal.style.display = 'block';
    modal.dataset.method = '';
}

let currentSaveMethod = '';

function saveChat(method) {
    currentSaveMethod = method;
    document.getElementById('saveChatForm').style.display = 'block';
    document.getElementById('saveContact').placeholder = method === 'email' ? 'Enter your email' : 'Enter your phone';
}

function closeSaveChatModal() {
    document.getElementById('saveChatModal').style.display = 'none';
}

async function submitSaveChat() {
    const contact = document.getElementById('saveContact').value;
    if (!contact) { 
        alert('Please enter contact information'); 
        return; 
    }
    
    try {
        const response = await fetch('/save-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sessionId,
                conversation: conversationHistory,
                method: currentSaveMethod,
                contact_value: contact
            })
        });
        
        const data = await response.json();
        if (data.success) {
            let resultHTML = `<div class="success">✅ ${data.message}</div>`;
            
            if (currentSaveMethod === 'whatsapp' && data.whatsapp_url) {
                resultHTML += `<br><a href="${data.whatsapp_url}" target="_blank" class="whatsapp-link">📱 Open WhatsApp to Share</a>`;
            }
            
            document.getElementById('saveChatResult').innerHTML = resultHTML;
            
            // If email was sent, show confirmation
            if (currentSaveMethod === 'email') {
                setTimeout(() => {
                    alert('Chat transcript sent successfully!');
                }, 1000);
            }
        } else {
            // Show error message
            const errorMsg = data.error || 'Failed to save chat';
            document.getElementById('saveChatResult').innerHTML = `<div class="error">❌ ${errorMsg}</div>`;
            alert(errorMsg);
        }
    } catch (error) {
        console.error('Save chat error:', error);
        document.getElementById('saveChatResult').innerHTML = '<div class="error">❌ Failed to save chat. Please try again.</div>';
        alert('Failed to save chat. Please try again.');
    }
}

// ============================================
// UI Update Functions
// ============================================

function updateVoiceStatus(statusClass, message) {
    const el = document.getElementById('voiceStatus');
    if (el) {
        el.className = 'voice-status';
        if (statusClass) {
            el.classList.add(statusClass);
            el.textContent = message;
            el.style.display = 'inline-block';
        } else {
            el.style.display = 'none';
        }
    }
}

function updateCallStatus(message) {
    const el = document.getElementById('callStatus');
    if (el) el.textContent = message;
}

function showVoiceFallback() {
    voiceEnabled = false;
    const micBtn = document.getElementById('micBtn');
    if (micBtn) micBtn.style.display = 'none';
    const callBtn = document.getElementById('callBtn');
    if (callBtn) callBtn.style.display = 'none';
    displayMessage('System', 'Voice mode not available. Please type your message.', 'bot-msg');
}

// ============================================
// Regular Text Chat
// ============================================

async function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input ? input.value.trim() : '';
    if (!message) return;

    if (isSpeaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
    }

    displayMessage('You', message, 'user-msg');
    addToConversation('You', message);
    input.value = '';
    input.focus();
    await sendMessageToBackend(message);
}

function handleKeyPress(event) {
    if (event.key === 'Enter') sendMessage();
}

async function viewStats() {
    try {
        const response = await fetch('/stats');
        const data = await response.json();
        const statsBox = document.getElementById('statsBox');
        if (statsBox) {
            statsBox.style.display = 'block';
            statsBox.innerHTML = `
                <h3>📊 Statistics</h3>
                <div>Total Queries: ${data.total_queries}</div>
                <div>Escalations: ${data.escalation_count}</div>
                <ul>${Object.entries(data.category_counts).map(([cat, count]) => `<li>${cat}: ${count}</li>`).join('')}</ul>`;
        }
    } catch (error) {
        console.error('Stats error:', error);
    }
}

// ============================================
// Initialization
// ============================================

window.addEventListener('load', function() {
    console.log('🚀 SupportAI Production Version Loading...');
    initializeVoiceRecognition();
    
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => console.log('🔊 TTS voices loaded');
    }
    
    const callBtn = document.getElementById('callBtn');
    if (callBtn) callBtn.addEventListener('click', toggleCallMode);
    const micBtn = document.getElementById('micBtn');
    if (micBtn) micBtn.addEventListener('click', toggleVoiceMode);
    
    // Check for initial query from landing page
    checkInitialQuery();
    
    console.log('✅ SupportAI initialized');
});

// Check for initial query from landing page
function checkInitialQuery() {
    // Try to get initial query from session storage or URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('query') || sessionStorage.getItem('initialQuery');
    
    if (initialQuery) {
        console.log('🎯 Initial query detected:', initialQuery);
        
        // Clear the stored query
        sessionStorage.removeItem('initialQuery');
        
        // Auto-fill the input and send message after a short delay
        const userInput = document.getElementById('userInput');
        if (userInput) {
            userInput.value = initialQuery;
            setTimeout(() => {
                sendMessage();
            }, 1000);
        }
    }
}
