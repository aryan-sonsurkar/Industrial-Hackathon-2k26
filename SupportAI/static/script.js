async function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    if (!message) return;

    // Display user message in chat
    const chatWindow = document.getElementById('chatWindow');
    const userDiv = document.createElement('div');
    userDiv.className = 'user-msg';
    userDiv.textContent = `You: ${message}`;
    chatWindow.appendChild(userDiv);
    
    // Clear input
    input.value = '';
    input.focus();

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        // Display bot response
        const botDiv = document.createElement('div');
        botDiv.className = 'bot-msg';
        botDiv.textContent = `SupportAI: ${data.response}`;
        chatWindow.appendChild(botDiv);
        
        // Show AI Analysis Breakdown
        document.getElementById('aiDetails').style.display = 'block';
        document.getElementById('resCategory').textContent = data.category;
        document.getElementById('resSentiment').textContent = data.sentiment;
        document.getElementById('resConfidence').textContent = data.confidence;
        
        const escalation = document.getElementById('resEscalation');
        escalation.textContent = data.escalation;
        escalation.className = data.escalation === 'Yes' ? 'escalation-yes' : 'escalation-no';

        // Scroll to bottom
        chatWindow.scrollTop = chatWindow.scrollHeight;

    } catch (error) {
        console.error('Error fetching chat response:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bot-msg';
        errorDiv.textContent = 'Error: Could not reach the server.';
        chatWindow.appendChild(errorDiv);
    }
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
