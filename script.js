document.addEventListener('DOMContentLoaded', function() {
            // Your API key - stored securely
            const API_KEY = "";
            
            // DOM Elements
            const generateBtn = document.getElementById('generate-btn');
            const topicSelect = document.getElementById('topic');
            const levelSelect = document.getElementById('level');
            const countSelect = document.getElementById('count');
            const customTopicInput = document.getElementById('custom-topic');
            const useCustomTopicBtn = document.getElementById('use-custom-topic');
            const wordsContainer = document.getElementById('words-container');
            const statusArea = document.getElementById('status-area');
            const darkModeToggle = document.getElementById('dark-mode-toggle');
            
            // Flashcards elements
            const flashcard = document.getElementById('flashcard');
            const flashcardWord = document.getElementById('flashcard-word');
            const flashcardContent = document.getElementById('flashcard-content');
            const prevFlashcardBtn = document.getElementById('prev-flashcard');
            const nextFlashcardBtn = document.getElementById('next-flashcard');
            const flipFlashcardBtn = document.getElementById('flip-flashcard');
            
            // Quiz elements
            const quizQuestion = document.getElementById('quiz-question');
            const quizOptions = document.getElementById('quiz-options');
            const prevQuestionBtn = document.getElementById('prev-question');
            const nextQuestionBtn = document.getElementById('next-question');
            const submitQuizBtn = document.getElementById('submit-quiz');
            
            // App State
            let currentWords = [];
            let currentFlashcardIndex = 0;
            let quizQuestions = [];
            let currentQuizIndex = 0;
            let userAnswers = {};
            
            // Initialize with sample words
            generateWordCards(generateSampleWords("web development", "intermediate", 5));
            updateFlashcard();
            generateQuizQuestions();
            
            // Event Listeners
            generateBtn.addEventListener('click', generateWordsWithAPI);
            useCustomTopicBtn.addEventListener('click', setCustomTopic);
            darkModeToggle.addEventListener('change', toggleDarkMode);
            
            // Flashcards event listeners
            prevFlashcardBtn.addEventListener('click', showPrevFlashcard);
            nextFlashcardBtn.addEventListener('click', showNextFlashcard);
            flipFlashcardBtn.addEventListener('click', flipFlashcard);
            flashcard.addEventListener('click', flipFlashcard);
            
            // Quiz event listeners
            prevQuestionBtn.addEventListener('click', showPrevQuestion);
            nextQuestionBtn.addEventListener('click', showNextQuestion);
            submitQuizBtn.addEventListener('click', submitAnswer);
            
            // Check for saved dark mode preference
            if (localStorage.getItem('darkMode') === 'enabled') {
                document.body.classList.add('dark-mode');
                darkModeToggle.checked = true;
            }
            
            // Functions
            function setCustomTopic() {
                const customTopic = customTopicInput.value.trim();
                if (customTopic) {
                    statusArea.innerHTML = `<div class="success-message">Custom topic set: <strong>${customTopic}</strong></div>`;
                    topicSelect.value = "custom";
                } else {
                    statusArea.innerHTML = `<div class="error-message">Please enter a custom topic</div>`;
                }
            }
            
            function toggleDarkMode() {
                document.body.classList.toggle('dark-mode');
                
                // Save preference
                if (document.body.classList.contains('dark-mode')) {
                    localStorage.setItem('darkMode', 'enabled');
                } else {
                    localStorage.setItem('darkMode', 'disabled');
                }
            }
            
            function generateWordCards(words) {
                wordsContainer.innerHTML = '';
                currentWords = words;
                
                words.forEach((word, index) => {
                    const card = document.createElement('div');
                    card.className = 'word-card';
                    card.style.animationDelay = `${index * 0.1}s`;
                    card.innerHTML = `
                        <div class="card-header">
                            <div class="word">${word.word}</div>
                            <div class="phonetic">${word.phonetic}</div>
                            <div class="difficulty">${word.difficulty}</div>
                        </div>
                        <div class="card-body">
                            <div class="definition">
                                <div class="section-title"><i class="fas fa-book"></i> Definition</div>
                                ${word.definition}
                            </div>
                            <div class="example">
                                <div class="section-title"><i class="fas fa-code"></i> CS Usage</div>
                                ${word.csExample}
                            </div>
                            <div class="interview-example">
                                <div class="section-title"><i class="fas fa-comments"></i> Interview Usage</div>
                                ${word.interviewExample}
                            </div>
                        </div>
                        <div class="card-footer">
                            <button class="action-btn" title="Hear pronunciation">
                                <i class="fas fa-volume-up"></i>
                            </button>
                        </div>
                    `;
                    wordsContainer.appendChild(card);
                    
                    // Add click event for pronunciation
                    const pronunciationBtn = card.querySelector('.fa-volume-up').closest('.action-btn');
                    pronunciationBtn.addEventListener('click', () => {
                        speakWord(word.word);
                    });
                });
                
                // Update flashcards and quiz
                updateFlashcard();
                generateQuizQuestions();
            }
            
            function speakWord(word) {
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(word);
                    utterance.rate = 0.8;
                    utterance.pitch = 1.2;
                    speechSynthesis.speak(utterance);
                } else {
                    showMessage('Text-to-speech not supported in your browser', true);
                }
            }
            
            function showLoading() {
                statusArea.innerHTML = `
                    <div class="loading">
                        <div class="spinner"></div>
                    </div>
                `;
                wordsContainer.innerHTML = '';
                generateBtn.disabled = true;
                generateBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Generating...`;
            }
            
            function showMessage(message, isError = false) {
                if (isError) {
                    statusArea.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i> ${message}</div>`;
                } else {
                    statusArea.innerHTML = `<div class="status-message">${message}</div>`;
                }
                generateBtn.disabled = false;
                generateBtn.innerHTML = `<i class="fas fa-bolt"></i> Generate Vocabulary Words`;
            }
            
            function showSuccess(message) {
                statusArea.innerHTML = `<div class="success-message"><i class="fas fa-check-circle"></i> ${message}</div>`;
                generateBtn.disabled = false;
                generateBtn.innerHTML = `<i class="fas fa-bolt"></i> Generate Vocabulary Words`;
            }
            
            async function generateWordsWithAPI() {
                const level = levelSelect.value;
                const count = parseInt(countSelect.value);
                let topic = topicSelect.value;
                
                // If custom topic is set, use it
                if (topic === "custom" && customTopicInput.value.trim()) {
                    topic = customTopicInput.value.trim();
                } else if (topic === "custom" && !customTopicInput.value.trim()) {
                    showMessage("Please enter a custom topic first", true);
                    return;
                }
                
                showLoading();
                
                try {
                    // Construct the prompt
                    const prompt = `Generate exactly ${count} vocabulary words for a computer science student. 
                    Topic: ${topic}
                    Difficulty: ${level}
                    
                    For each word, provide:
                    - word: the vocabulary word
                    - phonetic: phonetic spelling in /slashes/ notation
                    - definition: concise definition
                    - csExample: example sentence in a computer science context
                    - interviewExample: example sentence in a technical interview context
                    - difficulty: ${level}
                    
                    Format the response as a JSON array of objects. Do not include any additional text or explanations.`;
                    
                    // Make API request to OpenRouter
                    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${API_KEY}`,
                            'HTTP-Referer': 'https://wordwings-app.com',
                            'X-Title': 'WordWings Vocabulary Builder',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: "deepseek/deepseek-r1-0528:free",
                            messages: [
                                { role: "user", content: prompt }
                            ],
                            temperature: 0.7,
                            max_tokens: 2000
                        })
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error?.message || 'API request failed');
                    }
                    
                    const data = await response.json();
                    const content = data.choices[0].message.content;
                    
                    // Extract JSON from the response
                    const jsonStart = content.indexOf('[');
                    const jsonEnd = content.lastIndexOf(']') + 1;
                    const jsonContent = content.substring(jsonStart, jsonEnd);
                    
                    const words = JSON.parse(jsonContent);
                    
                    if (!Array.isArray(words) || words.length === 0) {
                        throw new Error('Invalid response format from API');
                    }
                    
                    showSuccess(`Generated ${words.length} ${level} vocabulary words about ${topic}`);
                    generateWordCards(words);
                    
                } catch (error) {
                    console.error('API Error:', error);
                    showMessage(`Error: ${error.message || 'Failed to generate words'}`, true);
                    
                    // Fallback to sample data if API fails
                    setTimeout(() => {
                        showMessage('Showing sample vocabulary words');
                        generateWordCards(generateSampleWords(topic, level, count));
                    }, 1000);
                }
            }
            
            function generateSampleWords(topic, level, count) {
                const sampleWords = [];
                
                // If it's a custom topic, generate words related to that topic
                if (topic === "custom" && customTopicInput.value.trim()) {
                    const customTopic = customTopicInput.value.trim();
                    for (let i = 1; i <= count; i++) {
                        sampleWords.push({
                            word: `${customTopic} term ${i}`,
                            phonetic: "/fəʊˈnetɪk/",
                            definition: `Definition of ${customTopic} term ${i}`,
                            csExample: `Computer science usage example for ${customTopic} term ${i}`,
                            interviewExample: `Interview context example for ${customTopic} term ${i}`,
                            difficulty: level
                        });
                    }
                    return sampleWords;
                }
                
                // Otherwise generate multiple words
                const sampleData = {
                    "computer science fundamentals": [
                        {word: "algorithm", phonetic: "/ˈælɡəˌrɪðəm/", definition: "A set of step-by-step instructions to solve a problem", csExample: "The sorting algorithm efficiently organized the data in O(n log n) time.", interviewExample: "When optimizing our search feature, I implemented a binary search algorithm to reduce lookup times.", difficulty: level},
                        {word: "syntax", phonetic: "/ˈsɪntæks/", definition: "The set of rules that defines the structure of statements in a programming language", csExample: "Python uses indentation as part of its syntax to define code blocks.", interviewExample: "During code reviews, I pay close attention to syntax to prevent runtime errors.", difficulty: level},
                        {word: "recursion", phonetic: "/rɪˈkɜːrʒən/", definition: "A programming technique where a function calls itself to solve smaller instances of the same problem", csExample: "The Fibonacci sequence is often implemented using recursion to demonstrate the concept.", interviewExample: "I used recursion to traverse the nested directory structure efficiently.", difficulty: level}
                    ],
                    "data structures and algorithms": [
                        {word: "heuristic", phonetic: "/hjʊˈrɪstɪk/", definition: "A practical approach to problem solving that may not be perfect but is sufficient for immediate goals", csExample: "The A* algorithm uses a heuristic to estimate the cost to reach the goal.", interviewExample: "When faced with an NP-hard problem, I developed a heuristic solution that provided near-optimal results.", difficulty: level},
                        {word: "complexity", phonetic: "/kəmˈplɛksɪti/", definition: "A measure of the resources (time or space) required by an algorithm", csExample: "We analyzed the time complexity of our solution to ensure it scaled efficiently.", interviewExample: "When discussing algorithm choices, I always consider both time and space complexity.", difficulty: level},
                        {word: "graph", phonetic: "/ɡræf/", definition: "A non-linear data structure consisting of nodes and edges", csExample: "We represented the social network as a graph to implement friend recommendations.", interviewExample: "I explained how a graph data structure would be optimal for modeling the transportation network.", difficulty: level}
                    ],
                    "web development": [
                        {word: "responsive", phonetic: "/rɪˈspɒnsɪv/", definition: "Designing websites to provide an optimal viewing experience across different devices", csExample: "The framework provides responsive layouts that adapt to various screen sizes.", interviewExample: "I emphasized how our responsive design approach increased mobile conversion rates by 25%.", difficulty: level},
                        {word: "asynchronous", phonetic: "/eɪˈsɪŋkrənəs/", definition: "Operations that can run independently of the main program flow", csExample: "JavaScript uses asynchronous programming to handle network requests without blocking the UI.", interviewExample: "To improve performance, I implemented asynchronous processing for our image upload feature.", difficulty: level},
                        {word: "middleware", phonetic: "/ˈmɪdəlwɛər/", definition: "Software that provides common services and capabilities to applications outside of what's offered by the operating system", csExample: "We implemented authentication middleware to secure our API endpoints.", interviewExample: "I designed custom middleware to handle request logging and error tracking.", difficulty: level}
                    ]
                };
                
                const wordsForTopic = sampleData[topic.toLowerCase()] || sampleData["web development"];
                
                for (let i = 0; i < count && i < wordsForTopic.length; i++) {
                    sampleWords.push(wordsForTopic[i]);
                }
                
                return sampleWords;
            }
            
            // Flashcards functions
            function updateFlashcard() {
                if (currentWords.length === 0) return;
                
                const word = currentWords[currentFlashcardIndex];
                flashcardWord.textContent = word.word;
                
                flashcardContent.innerHTML = `
                    <div class="definition" style="margin-bottom: 15px;">
                        <strong>Definition:</strong> ${word.definition}
                    </div>
                    <div class="example" style="margin-bottom: 15px;">
                        <strong>CS Example:</strong> ${word.csExample}
                    </div>
                    <div class="interview-example">
                        <strong>Interview Example:</strong> ${word.interviewExample}
                    </div>
                `;
                
                // Reset flip state
                flashcard.classList.remove('flipped');
            }
            
            function flipFlashcard() {
                flashcard.classList.toggle('flipped');
            }
            
            function showPrevFlashcard() {
                if (currentWords.length === 0) return;
                currentFlashcardIndex = (currentFlashcardIndex - 1 + currentWords.length) % currentWords.length;
                updateFlashcard();
            }
            
            function showNextFlashcard() {
                if (currentWords.length === 0) return;
                currentFlashcardIndex = (currentFlashcardIndex + 1) % currentWords.length;
                updateFlashcard();
            }
            
            // Quiz functions
            function generateQuizQuestions() {
                quizQuestions = [];
                
                if (currentWords.length === 0) return;
                
                // Create definition questions
                currentWords.forEach(word => {
                    // Get 3 random wrong answers
                    const wrongAnswers = currentWords
                        .filter(w => w.word !== word.word)
                        .sort(() => 0.5 - Math.random())
                        .slice(0, 3)
                        .map(w => w.definition);
                    
                    quizQuestions.push({
                        type: "definition",
                        word: word.word,
                        question: `What does "${word.word}" mean?`,
                        correctAnswer: word.definition,
                        options: [word.definition, ...wrongAnswers].sort(() => 0.5 - Math.random())
                    });
                });
                
                // Create example questions
                currentWords.forEach(word => {
                    const context = Math.random() > 0.5 ? "CS" : "interview";
                    const example = context === "CS" ? word.csExample : word.interviewExample;
                    
                    // Remove the word from the example
                    const blankExample = example.replace(new RegExp(word.word, 'gi'), '__________');
                    
                    // Get 3 random wrong words
                    const wrongWords = currentWords
                        .filter(w => w.word !== word.word)
                        .sort(() => 0.5 - Math.random())
                        .slice(0, 3)
                        .map(w => w.word);
                    
                    quizQuestions.push({
                        type: "example",
                        word: word.word,
                        question: `Which word best completes this ${context} context?<br>"${blankExample}"`,
                        correctAnswer: word.word,
                        options: [word.word, ...wrongWords].sort(() => 0.5 - Math.random())
                    });
                });
                
                // Shuffle all questions
                quizQuestions = quizQuestions.sort(() => 0.5 - Math.random());
                currentQuizIndex = 0;
                userAnswers = {};
                showQuestion();
            }
            
            function showQuestion() {
                if (quizQuestions.length === 0) return;
                
                const question = quizQuestions[currentQuizIndex];
                quizQuestion.innerHTML = question.question;
                
                quizOptions.innerHTML = '';
                question.options.forEach((option, index) => {
                    const optionElem = document.createElement('div');
                    optionElem.className = 'quiz-option';
                    if (userAnswers[currentQuizIndex] === index) {
                        optionElem.classList.add('selected');
                    }
                    optionElem.textContent = option;
                    optionElem.dataset.index = index;
                    
                    optionElem.addEventListener('click', () => {
                        // Remove selection from all options
                        document.querySelectorAll('.quiz-option').forEach(opt => {
                            opt.classList.remove('selected');
                        });
                        // Select clicked option
                        optionElem.classList.add('selected');
                        userAnswers[currentQuizIndex] = index;
                    });
                    
                    quizOptions.appendChild(optionElem);
                });
                
                // Update navigation buttons
                prevQuestionBtn.disabled = currentQuizIndex === 0;
                nextQuestionBtn.disabled = currentQuizIndex === quizQuestions.length - 1;
            }
            
            function showPrevQuestion() {
                if (quizQuestions.length === 0) return;
                if (currentQuizIndex > 0) {
                    currentQuizIndex--;
                    showQuestion();
                }
            }
            
            function showNextQuestion() {
                if (quizQuestions.length === 0) return;
                if (currentQuizIndex < quizQuestions.length - 1) {
                    currentQuizIndex++;
                    showQuestion();
                }
            }
            
            function submitAnswer() {
                if (quizQuestions.length === 0) return;
                
                const question = quizQuestions[currentQuizIndex];
                const selectedOptionIndex = userAnswers[currentQuizIndex];
                
                if (selectedOptionIndex === undefined) {
                    showMessage("Please select an answer", true);
                    return;
                }
                
                const selectedOption = document.querySelector(`.quiz-option[data-index="${selectedOptionIndex}"]`);
                const isCorrect = question.options[selectedOptionIndex] === question.correctAnswer;
                
                // Mark options
                document.querySelectorAll('.quiz-option').forEach(option => {
                    option.classList.remove('correct', 'incorrect');
                    if (question.options[option.dataset.index] === question.correctAnswer) {
                        option.classList.add('correct');
                    }
                    if (option === selectedOption && !isCorrect) {
                        option.classList.add('incorrect');
                    }
                });
                
                // Disable further selection
                document.querySelectorAll('.quiz-option').forEach(option => {
                    option.style.pointerEvents = 'none';
                });
                
                // Update UI
                submitQuizBtn.textContent = isCorrect ? "Correct!" : "Incorrect";
                submitQuizBtn.style.backgroundColor = isCorrect ? "#38a169" : "#e53e3e";
                
                // Move to next question after delay
                setTimeout(() => {
                    if (currentQuizIndex < quizQuestions.length - 1) {
                        currentQuizIndex++;
                        showQuestion();
                        submitQuizBtn.textContent = "Submit Answer";
                        submitQuizBtn.style.backgroundColor = "";
                    } else {
                        finishQuiz();
                    }
                }, 1500);
            }
            
            function finishQuiz() {
                // Calculate score
                let correctCount = 0;
                for (let i = 0; i < quizQuestions.length; i++) {
                    if (userAnswers[i] !== undefined && 
                        quizQuestions[i].options[userAnswers[i]] === quizQuestions[i].correctAnswer) {
                        correctCount++;
                    }
                }
                
                const score = Math.round((correctCount / quizQuestions.length) * 100);
                
                // Show results
                quizQuestion.innerHTML = `Quiz Complete! Your Score: ${score}%`;
                quizOptions.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 2rem; font-weight: bold; color: ${score > 70 ? '#38a169' : '#e53e3e'}; margin-bottom: 20px;">
                            ${score}%
                        </div>
                        <p>You got ${correctCount} out of ${quizQuestions.length} questions correct.</p>
                    </div>
                `;
                
                // Hide navigation
                prevQuestionBtn.classList.add('hidden');
                nextQuestionBtn.classList.add('hidden');
                submitQuizBtn.classList.add('hidden');
            }
        });