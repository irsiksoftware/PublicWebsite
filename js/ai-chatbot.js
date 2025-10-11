/**
 * AI Chatbot Assistant
 * Provides intelligent visitor assistance with contextual help
 */

class AIChatbot {
    constructor() {
        this.widget = null;
        this.chatWindow = null;
        this.messagesContainer = null;
        this.input = null;
        this.isOpen = false;
        this.messages = [];
        this.initialized = false;

        // AI response patterns for common queries
        this.knowledgeBase = {
            greeting: [
                'Hello! I\'m your AI assistant. How can I help you today?',
                'Hi there! I\'m here to assist you. What can I help you with?',
                'Welcome! I\'m your virtual assistant. Feel free to ask me anything about our services.'
            ],
            services: {
                patterns: ['service', 'what do you do', 'capabilities', 'offerings'],
                response: 'We offer a wide range of software development services including:\n- Custom Software Development\n- AI & Machine Learning Solutions\n- Cloud Architecture & DevOps\n- Unity Game Development\n- Enterprise Solutions\n\nWould you like to know more about any specific service?'
            },
            ai: {
                patterns: ['ai', 'artificial intelligence', 'machine learning', 'ml'],
                response: 'Our AI solutions include:\n- Custom AI model development\n- Natural Language Processing\n- Computer Vision\n- Predictive Analytics\n- AI-powered automation\n\nWe can help you leverage AI to transform your business. Would you like to discuss a specific AI project?'
            },
            games: {
                patterns: ['game', 'unity', 'gaming', 'multiplayer'],
                response: 'We specialize in Unity game development:\n- 2D/3D game development\n- Multiplayer games\n- AR/VR experiences\n- Mobile and browser games\n- Game optimization\n\nCheck out our portfolio to see examples of games we\'ve created!'
            },
            contact: {
                patterns: ['contact', 'reach', 'email', 'phone', 'get in touch'],
                response: 'You can reach us through:\n- Contact form: /pages/contact.html\n- Email: info@irsiksoftware.com\n- Or use the live chat feature\n\nOur team typically responds within 24 hours!'
            },
            pricing: {
                patterns: ['price', 'cost', 'pricing', 'budget', 'quote'],
                response: 'Pricing varies based on project scope and requirements. We offer:\n- Hourly rates for ongoing work\n- Fixed-price projects\n- Retainer agreements\n\nI recommend contacting us for a free consultation and custom quote for your specific needs.'
            },
            portfolio: {
                patterns: ['portfolio', 'projects', 'work', 'examples', 'case studies'],
                response: 'We have extensive experience across multiple domains:\n- Enterprise ERP Systems\n- Financial Analytics Platforms\n- Fleet Management Solutions\n- AI Customer Service\n- Game Development\n\nVisit our portfolio section to see detailed case studies of our work!'
            },
            help: {
                patterns: ['help', 'support', 'assist', 'how to'],
                response: 'I can help you with:\n- Information about our services\n- Portfolio and case studies\n- Contact information\n- General questions about software development\n- Navigation around the website\n\nWhat would you like to know more about?'
            }
        };
    }

    /**
     * Initialize the chatbot
     */
    init() {
        if (this.initialized) return;

        this.createWidget();
        this.attachEventListeners();
        this.loadChatHistory();
        this.initialized = true;
        console.log('AI Chatbot initialized');
    }

    /**
     * Create the chatbot widget HTML
     */
    createWidget() {
        // Create widget container
        const widget = document.createElement('div');
        widget.className = 'ai-chatbot-widget';
        widget.innerHTML = `
            <div class="ai-chatbot-toggle" id="ai-chatbot-toggle" aria-label="Open AI Assistant">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
                </svg>
                <span class="ai-chatbot-badge" id="ai-chatbot-badge"></span>
            </div>
            <div class="ai-chatbot-window" id="ai-chatbot-window" style="display: none;">
                <div class="ai-chatbot-header">
                    <div class="ai-chatbot-header-content">
                        <h3>AI Assistant</h3>
                        <p class="ai-chatbot-status">
                            <span class="ai-status-dot"></span>
                            Online
                        </p>
                    </div>
                    <button class="ai-chatbot-close" id="ai-chatbot-close" aria-label="Close AI Assistant">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
                <div class="ai-chatbot-messages" id="ai-chatbot-messages">
                    <!-- Messages will be added here -->
                </div>
                <div class="ai-chatbot-input-container">
                    <input
                        type="text"
                        id="ai-chatbot-input"
                        class="ai-chatbot-input"
                        placeholder="Type your message..."
                        aria-label="Chat message input"
                    />
                    <button
                        id="ai-chatbot-send"
                        class="ai-chatbot-send"
                        aria-label="Send message"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 10L18 2L10 18L8 11L2 10Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
                <div class="ai-chatbot-suggestions">
                    <button class="ai-suggestion-btn" data-suggestion="What services do you offer?">What services do you offer?</button>
                    <button class="ai-suggestion-btn" data-suggestion="Tell me about AI solutions">AI solutions</button>
                    <button class="ai-suggestion-btn" data-suggestion="How can I contact you?">Contact info</button>
                </div>
            </div>
        `;

        document.body.appendChild(widget);

        // Store references
        this.widget = widget;
        this.chatWindow = document.getElementById('ai-chatbot-window');
        this.messagesContainer = document.getElementById('ai-chatbot-messages');
        this.input = document.getElementById('ai-chatbot-input');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Toggle button
        const toggleBtn = document.getElementById('ai-chatbot-toggle');
        toggleBtn.addEventListener('click', () => this.toggleChat());

        // Close button
        const closeBtn = document.getElementById('ai-chatbot-close');
        closeBtn.addEventListener('click', () => this.closeChat());

        // Send button
        const sendBtn = document.getElementById('ai-chatbot-send');
        sendBtn.addEventListener('click', () => this.sendMessage());

        // Input enter key
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Suggestion buttons
        const suggestionBtns = document.querySelectorAll('.ai-suggestion-btn');
        suggestionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const suggestion = e.target.getAttribute('data-suggestion');
                this.input.value = suggestion;
                this.sendMessage();
            });
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeChat();
            }
        });
    }

    /**
     * Toggle chat window
     */
    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    /**
     * Open chat window
     */
    openChat() {
        this.chatWindow.style.display = 'flex';
        this.isOpen = true;

        // Add welcome message if no messages yet
        if (this.messages.length === 0) {
            this.addMessage('bot', this.getRandomGreeting());
        }

        this.input.focus();

        // Hide badge
        const badge = document.getElementById('ai-chatbot-badge');
        if (badge) {
            badge.style.display = 'none';
        }
    }

    /**
     * Close chat window
     */
    closeChat() {
        this.chatWindow.style.display = 'none';
        this.isOpen = false;
    }

    /**
     * Send a message
     */
    sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;

        // Add user message
        this.addMessage('user', message);
        this.input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        // Get AI response after a short delay
        setTimeout(() => {
            this.hideTypingIndicator();
            const response = this.getAIResponse(message);
            this.addMessage('bot', response);
        }, 1000);
    }

    /**
     * Add a message to the chat
     */
    addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-chat-message ai-chat-message-${sender}`;

        const avatar = document.createElement('div');
        avatar.className = 'ai-message-avatar';
        avatar.innerHTML = sender === 'bot'
            ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/></svg>'
            : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/></svg>';

        const content = document.createElement('div');
        content.className = 'ai-message-content';
        content.textContent = text;

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);

        this.messagesContainer.appendChild(messageDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

        // Store message
        this.messages.push({ sender, text, timestamp: Date.now() });
        this.saveChatHistory();
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'ai-typing-indicator';
        indicator.id = 'ai-typing-indicator';
        indicator.innerHTML = `
            <div class="ai-message-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/></svg>
            </div>
            <div class="ai-typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        this.messagesContainer.appendChild(indicator);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        const indicator = document.getElementById('ai-typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * Get AI response based on message
     */
    getAIResponse(message) {
        const lowerMessage = message.toLowerCase();

        // Check for greeting
        if (this.isGreeting(lowerMessage)) {
            return this.getRandomGreeting();
        }

        // Check knowledge base
        for (const [key, data] of Object.entries(this.knowledgeBase)) {
            if (key === 'greeting') continue;

            if (data.patterns && data.patterns.some(pattern => lowerMessage.includes(pattern))) {
                return data.response;
            }
        }

        // Default response
        return 'I\'m here to help! I can assist you with information about our services, portfolio, pricing, and more. You can also:\n- Ask about specific services (AI, games, cloud, etc.)\n- Request contact information\n- Learn about our past projects\n\nWhat would you like to know?';
    }

    /**
     * Check if message is a greeting
     */
    isGreeting(message) {
        const greetings = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'];
        return greetings.some(greeting => message.includes(greeting));
    }

    /**
     * Get random greeting
     */
    getRandomGreeting() {
        const greetings = this.knowledgeBase.greeting;
        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    /**
     * Save chat history to localStorage
     */
    saveChatHistory() {
        try {
            localStorage.setItem('ai_chatbot_history', JSON.stringify(this.messages));
        } catch (e) {
            console.warn('Could not save chat history:', e);
        }
    }

    /**
     * Load chat history from localStorage
     */
    loadChatHistory() {
        try {
            const history = localStorage.getItem('ai_chatbot_history');
            if (history) {
                this.messages = JSON.parse(history);
                // Restore messages to UI
                this.messages.forEach(msg => {
                    this.addMessageToUI(msg.sender, msg.text);
                });
            }
        } catch (e) {
            console.warn('Could not load chat history:', e);
        }
    }

    /**
     * Add message to UI only (without saving)
     */
    addMessageToUI(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-chat-message ai-chat-message-${sender}`;

        const avatar = document.createElement('div');
        avatar.className = 'ai-message-avatar';
        avatar.innerHTML = sender === 'bot'
            ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/></svg>'
            : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/></svg>';

        const content = document.createElement('div');
        content.className = 'ai-message-content';
        content.textContent = text;

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);

        this.messagesContainer.appendChild(messageDiv);
    }

    /**
     * Clear chat history
     */
    clearHistory() {
        this.messages = [];
        this.messagesContainer.innerHTML = '';
        this.saveChatHistory();
        this.addMessage('bot', this.getRandomGreeting());
    }
}

// Initialize on page load
if (typeof window !== 'undefined') {
    window.aiChatbot = new AIChatbot();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.aiChatbot.init();
        });
    } else {
        window.aiChatbot.init();
    }
}

export default AIChatbot;
