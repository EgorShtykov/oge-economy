/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🎮 ЕДИНАЯ СИСТЕМА ПООЩРЕНИЯ УЧЕНИКОВ ОГЭ ПО МАТЕМАТИКЕ
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Версия: 1.0.0
 * Описание: Система игровой валюты, отслеживания прогресса и отправки результатов
 * 
 * Возможности:
 * - Начисление монет за правильные ответы
 * - Отслеживание прогресса по всем заданиям
 * - Отправка результатов учителю через Google Forms
 * - Единый баланс валюты across all sites
 * - Система достижений и уровней
 */

(function(global) {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // КОНФИГУРАЦИЯ
    // ═══════════════════════════════════════════════════════════════════════════
    const CONFIG = {
        // Настройки валюты
        CURRENCY_NAME: 'математических монет',
        CURRENCY_ICON: '🪙',
        
        // Награды за задания
        REWARDS: {
            EASY: 5,      // Лёгкое задание
            MEDIUM: 10,   // Среднее задание
            HARD: 15,     // Сложное задание
            BONUS: 20     // Бонус за серию
        },
        
        // Настройки Google Forms (ЗАПОЛНИТЕ ПРИ НАСТРОЙКЕ)
        GOOGLE_FORM_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSc23XeX8M6Cbku_2LYz7wvlW0RFQ4h-GlV18k_5ImJpmNcMmQ/formResponse',
        FORM_FIELDS: {
            name: 'entry.853692191',      // Имя ученика
            task: 'entry.145846187',      // Номер задания
            result: 'entry.737084295',    // Результат
            coins: 'entry.123456789',     // Получено монет (добавьте поле)
            timestamp: 'entry.941158920'  // Время
        },
        
        // Ключи localStorage
        STORAGE_KEYS: {
            BALANCE: 'oge_reward_balance',
            PROGRESS: 'oge_reward_progress',
            STUDENT_NAME: 'oge_reward_student_name',
            ACHIEVEMENTS: 'oge_reward_achievements',
            STATS: 'oge_reward_stats',
            LAST_VISIT: 'oge_reward_last_visit'
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // КЛАСС СИСТЕМЫ ПООЩРЕНИЯ
    // ═══════════════════════════════════════════════════════════════════════════
    class RewardSystem {
        constructor() {
            this.initialized = false;
            this.currentTaskId = null;
            this.solvedTasks = new Set();
            this.init();
        }

        // ───────────────────────────────────────────────────────────────────────
        // ИНИЦИАЛИЗАЦИЯ
        // ───────────────────────────────────────────────────────────────────────
        init() {
            if (this.initialized) return;
            
            // Загружаем сохранённые данные
            this.loadData();
            
            // Проверяем ежедневный бонус
            this.checkDailyBonus();
            
            this.initialized = true;
            console.log('🎮 RewardSystem инициализирована');
        }

        loadData() {
            // Баланс
            this.balance = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.BALANCE)) || 0;
            
            // Прогресс по заданиям
            const savedProgress = localStorage.getItem(CONFIG.STORAGE_KEYS.PROGRESS);
            this.progress = savedProgress ? JSON.parse(savedProgress) : {};
            
            // Имя ученика
            this.studentName = localStorage.getItem(CONFIG.STORAGE_KEYS.STUDENT_NAME) || '';
            
            // Достижения
            const savedAchievements = localStorage.getItem(CONFIG.STORAGE_KEYS.ACHIEVEMENTS);
            this.achievements = savedAchievements ? JSON.parse(savedAchievements) : [];
            
            // Статистика
            const savedStats = localStorage.getItem(CONFIG.STORAGE_KEYS.STATS);
            this.stats = savedStats ? JSON.parse(savedStats) : {
                totalSolved: 0,
                correctAnswers: 0,
                wrongAnswers: 0,
                streak: 0,
                maxStreak: 0,
                tasksByType: {}
            };
        }

        saveData() {
            localStorage.setItem(CONFIG.STORAGE_KEYS.BALANCE, this.balance);
            localStorage.setItem(CONFIG.STORAGE_KEYS.PROGRESS, JSON.stringify(this.progress));
            localStorage.setItem(CONFIG.STORAGE_KEYS.STUDENT_NAME, this.studentName);
            localStorage.setItem(CONFIG.STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(this.achievements));
            localStorage.setItem(CONFIG.STORAGE_KEYS.STATS, JSON.stringify(this.stats));
        }

        // ───────────────────────────────────────────────────────────────────────
        // УПРАВЛЕНИЕ ВАЛЮТОЙ
        // ───────────────────────────────────────────────────────────────────────
        
        /**
         * Получить текущий баланс
         */
        getBalance() {
            return this.balance;
        }

        /**
         * Начислить монеты
         * @param {number} amount - Количество монет
         * @param {string} reason - Причина начисления
         */
        addCoins(amount, reason = '') {
            this.balance += amount;
            this.saveData();
            
            // Показываем уведомление
            this.showCoinNotification(amount, reason);
            
            // Обновляем отображение баланса
            this.updateBalanceDisplay();
            
            console.log(`💰 +${amount} монет (${reason}). Баланс: ${this.balance}`);
            return this.balance;
        }

        /**
         * Списать монеты
         * @param {number} amount - Количество монет
         * @param {string} reason - Причина списания
         * @returns {boolean} - Успешно ли списание
         */
        spendCoins(amount, reason = '') {
            if (this.balance < amount) {
                this.showNotification('Недостаточно монет! 😢', 'error');
                return false;
            }
            
            this.balance -= amount;
            this.saveData();
            this.updateBalanceDisplay();
            
            this.showNotification(`-${amount} ${CONFIG.CURRENCY_NAME} (${reason})`, 'success');
            console.log(`💸 -${amount} монет (${reason}). Баланс: ${this.balance}`);
            return true;
        }

        /**
         * Начислить награду за задание
         * @param {string} difficulty - Сложность: 'easy', 'medium', 'hard'
         * @param {string} taskId - ID задания
         */
        rewardForTask(difficulty = 'easy', taskId = '') {
            const reward = CONFIG.REWARDS[difficulty.toUpperCase()] || CONFIG.REWARDS.EASY;
            
            // Проверяем, не решалось ли уже это задание
            if (taskId && this.isTaskSolved(taskId)) {
                return 0; // Уже решено, не начисляем
            }
            
            // Начисляем монеты
            this.addCoins(reward, `Задание ${difficulty}`);
            
            // Отмечаем задание как решённое
            if (taskId) {
                this.markTaskSolved(taskId, reward);
            }
            
            // Обновляем статистику
            this.stats.correctAnswers++;
            this.stats.streak++;
            if (this.stats.streak > this.stats.maxStreak) {
                this.stats.maxStreak = this.stats.streak;
            }
            
            // Проверяем бонус за серию
            if (this.stats.streak >= 5) {
                this.addCoins(CONFIG.REWARDS.BONUS, 'Бонус за серию из 5! 🔥');
                this.stats.streak = 0; // Сбрасываем серию
            }
            
            this.saveData();
            return reward;
        }

        /**
         * Обработать неправильный ответ
         */
        penalizeWrongAnswer() {
            this.stats.wrongAnswers++;
            this.stats.streak = 0; // Сбрасываем серию
            this.saveData();
        }

        // ───────────────────────────────────────────────────────────────────────
        // ОТСЛЕЖИВАНИЕ ПРОГРЕССА
        // ───────────────────────────────────────────────────────────────────────
        
        /**
         * Отметить задание как решённое
         * @param {string} taskId - ID задания (например: 'task15_1')
         * @param {number} coins - Получено монет
         */
        markTaskSolved(taskId, coins = 0) {
            if (!this.progress[taskId]) {
                this.progress[taskId] = {
                    solved: true,
                    firstSolved: new Date().toISOString(),
                    coinsEarned: coins,
                    attempts: 1
                };
                this.stats.totalSolved++;
                this.solvedTasks.add(taskId);
                this.saveData();
            } else {
                this.progress[taskId].attempts++;
                this.saveData();
            }
        }

        /**
         * Проверить, решено ли задание
         * @param {string} taskId - ID задания
         */
        isTaskSolved(taskId) {
            return this.progress[taskId] && this.progress[taskId].solved;
        }

        /**
         * Получить общий прогресс
         * @param {number} totalTasks - Общее количество заданий
         */
        getProgress(totalTasks = 0) {
            const solved = Object.keys(this.progress).filter(k => this.progress[k].solved).length;
            const percent = totalTasks > 0 ? Math.round((solved / totalTasks) * 100) : 0;
            
            return {
                solved,
                total: totalTasks,
                percent,
                balance: this.balance
            };
        }

        /**
         * Получить прогресс по конкретному заданию ОГЭ
         * @param {string} taskType - Тип задания (15, 16, 17, 18, 19)
         */
        getProgressByTaskType(taskType) {
            const tasks = Object.keys(this.progress).filter(k => k.startsWith(`task${taskType}_`));
            const solved = tasks.filter(k => this.progress[k].solved).length;
            return { solved, total: tasks.length };
        }

        // ───────────────────────────────────────────────────────────────────────
        // УПРАВЛЕНИЕ ИМЕНЕМ УЧЕНИКА
        // ───────────────────────────────────────────────────────────────────────
        
        /**
         * Установить/изменить имя ученика
         */
        setStudentName(name) {
            if (name && name.trim()) {
                this.studentName = name.trim();
                localStorage.setItem(CONFIG.STORAGE_KEYS.STUDENT_NAME, this.studentName);
                this.updateStudentNameDisplay();
                return true;
            }
            return false;
        }

        /**
         * Получить имя ученика
         */
        getStudentName() {
            return this.studentName;
        }

        /**
         * Запросить имя при первом использовании
         */
        askStudentName() {
            if (!this.studentName) {
                const name = prompt('👋 Привет! Введи своё имя, чтобы я мог отслеживать твой прогресс:');
                if (name) {
                    this.setStudentName(name);
                    this.showNotification(`Привет, ${name}! 🎉`, 'success');
                }
            }
            return this.studentName;
        }

        // ───────────────────────────────────────────────────────────────────────
        // ОТПРАВКА В GOOGLE FORMS
        // ───────────────────────────────────────────────────────────────────────
        
        /**
         * Отправить результаты в Google Forms
         * @param {Object} data - Данные для отправки
         */
        async submitToGoogleForms(data = {}) {
            if (!this.studentName) {
                this.askStudentName();
                return false;
            }

            const formData = new FormData();
            formData.append(CONFIG.FORM_FIELDS.name, this.studentName);
            formData.append(CONFIG.FORM_FIELDS.task, data.task || 'Не указано');
            formData.append(CONFIG.FORM_FIELDS.result, data.result || 'Выполнено');
            formData.append(CONFIG.FORM_FIELDS.coins, data.coins || 0);
            formData.append(CONFIG.FORM_FIELDS.timestamp, new Date().toLocaleString('ru-RU'));

            try {
                await fetch(CONFIG.GOOGLE_FORM_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: formData
                });
                
                this.showNotification('✅ Результат отправлен учителю!', 'success');
                return true;
            } catch (error) {
                console.error('Ошибка отправки:', error);
                this.showNotification('❌ Ошибка отправки', 'error');
                return false;
            }
        }

        /**
         * Отправить все результаты
         */
        async submitAllResults() {
            if (!this.studentName) {
                this.askStudentName();
                return;
            }

            const solvedTasksList = Object.keys(this.progress).filter(k => this.progress[k].solved);
            
            if (solvedTasksList.length === 0) {
                this.showNotification('Реши хотя бы одно задание! 📚', 'warning');
                return;
            }

            const btn = document.getElementById('send-results-btn');
            if (btn) {
                btn.textContent = '⏳ Отправка...';
                btn.disabled = true;
            }

            // Отправляем каждое задание
            const promises = solvedTasksList.map(taskId => {
                return this.submitToGoogleForms({
                    task: taskId,
                    result: '✓ Верно',
                    coins: this.progress[taskId].coinsEarned || 0
                });
            });

            await Promise.all(promises);
            
            if (btn) {
                btn.textContent = '✅ Отправлено!';
                btn.style.background = '#4caf50';
                setTimeout(() => {
                    btn.textContent = '📤 Отправить учителю';
                    btn.disabled = false;
                    btn.style.background = '';
                }, 3000);
            }
        }

        // ───────────────────────────────────────────────────────────────────────
        // БОНУСЫ И ДОСТИЖЕНИЯ
        // ───────────────────────────────────────────────────────────────────────
        
        /**
         * Проверить ежедневный бонус
         */
        checkDailyBonus() {
            const lastVisit = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_VISIT);
            const today = new Date().toDateString();
            
            if (lastVisit !== today) {
                // Новый день - начисляем бонус
                if (lastVisit) {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    
                    if (lastVisit === yesterday.toDateString()) {
                        // Последовательное посещение
                        this.addCoins(10, 'Ежедневный бонус! 📅');
                    } else {
                        // Пропущен день
                        this.addCoins(5, 'С возвращением! 👋');
                    }
                } else {
                    // Первое посещение
                    this.addCoins(20, 'Приветственный бонус! 🎁');
                }
                
                localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_VISIT, today);
            }
        }

        /**
         * Проверить достижения
         */
        checkAchievements() {
            const achievements = [];
            
            if (this.stats.totalSolved >= 1) achievements.push('first_step');
            if (this.stats.totalSolved >= 10) achievements.push('solver_10');
            if (this.stats.totalSolved >= 50) achievements.push('solver_50');
            if (this.stats.totalSolved >= 100) achievements.push('solver_100');
            if (this.stats.maxStreak >= 5) achievements.push('streak_5');
            if (this.stats.maxStreak >= 10) achievements.push('streak_10');
            if (this.balance >= 100) achievements.push('rich_100');
            if (this.balance >= 500) achievements.push('rich_500');
            
            // Проверяем новые достижения
            achievements.forEach(id => {
                if (!this.achievements.includes(id)) {
                    this.achievements.push(id);
                    this.showAchievement(id);
                }
            });
            
            this.saveData();
        }

        // ───────────────────────────────────────────────────────────────────────
        // UI ИНТЕГРАЦИЯ
        // ───────────────────────────────────────────────────────────────────────
        
        /**
         * Создать виджет баланса
         */
        createBalanceWidget() {
            const widget = document.createElement('div');
            widget.id = 'reward-balance-widget';
            widget.innerHTML = `
                <div style="
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 12px 20px;
                    border-radius: 25px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    z-index: 9999;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: transform 0.2s;
                " onclick="window.open('index.html', '_blank')">
                    <span style="font-size: 1.2rem;">${CONFIG.CURRENCY_ICON}</span>
                    <span id="reward-balance-display">${this.balance}</span>
                </div>
            `;
            document.body.appendChild(widget);
            
            // Hover эффект
            widget.querySelector('div').addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.05)';
            });
            widget.querySelector('div').addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
        }

        /**
         * Обновить отображение баланса
         */
        updateBalanceDisplay() {
            const display = document.getElementById('reward-balance-display');
            if (display) {
                display.textContent = this.balance;
                // Анимация
                display.parentElement.style.animation = 'pulse 0.3s';
                setTimeout(() => {
                    display.parentElement.style.animation = '';
                }, 300);
            }
        }

        /**
         * Создать трекер прогресса
         * @param {number} totalTasks - Общее количество заданий
         */
        createProgressTracker(totalTasks) {
            const tracker = document.createElement('div');
            tracker.id = 'reward-progress-tracker';
            
            const progress = this.getProgress(totalTasks);
            
            tracker.innerHTML = `
                <div style="
                    position: fixed;
                    top: 140px;
                    right: 20px;
                    background: white;
                    padding: 15px;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    z-index: 9998;
                    min-width: 200px;
                    border: 2px solid #667eea;
                ">
                    <div style="font-weight: bold; color: #667eea; margin-bottom: 10px;">
                        📊 Прогресс: <span id="progress-percent">${progress.percent}%</span>
                    </div>
                    <div style="
                        width: 100%;
                        height: 10px;
                        background: #e0e0e0;
                        border-radius: 5px;
                        overflow: hidden;
                        margin-bottom: 10px;
                    ">
                        <div id="progress-bar-fill" style="
                            height: 100%;
                            background: linear-gradient(90deg, #667eea, #764ba2);
                            width: ${progress.percent}%;
                            transition: width 0.4s ease;
                        "></div>
                    </div>
                    <div style="font-size: 0.9rem; color: #666; margin-bottom: 10px;">
                        Решено: <span id="solved-count">${progress.solved}</span> из ${totalTasks}
                    </div>
                    <div id="student-name-display" style="
                        font-size: 0.9rem;
                        color: #667eea;
                        margin: 8px 0;
                        padding: 5px;
                        background: #f0f0f0;
                        border-radius: 6px;
                        text-align: center;
                        display: ${this.studentName ? 'block' : 'none'};
                    ">
                        👤 <span id="current-student-name">${this.studentName}</span>
                    </div>
                    <button id="send-results-btn" onclick="RewardSystem.submitAllResults()" style="
                        width: 100%;
                        padding: 8px;
                        background: #4caf50;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: bold;
                        margin-top: 10px;
                        display: ${progress.solved > 0 ? 'block' : 'none'};
                    ">📤 Отправить учителю</button>
                    <div style="display: flex; gap: 8px; margin-top: 10px;">
                        <button onclick="RewardSystem.askStudentName()" style="
                            flex: 1;
                            padding: 6px;
                            background: #e3f2fd;
                            color: #1976d2;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 0.85rem;
                        ">✏️ Имя</button>
                        <button onclick="RewardSystem.resetAllProgress()" style="
                            flex: 1;
                            padding: 6px;
                            background: #ffebee;
                            color: #c62828;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 0.85rem;
                        ">🗑️ Сброс</button>
                    </div>
                </div>
            `;
            document.body.appendChild(tracker);
        }

        /**
         * Обновить трекер прогресса
         * @param {number} totalTasks - Общее количество заданий
         */
        updateProgressTracker(totalTasks) {
            const progress = this.getProgress(totalTasks);
            
            const percentEl = document.getElementById('progress-percent');
            const barEl = document.getElementById('progress-bar-fill');
            const solvedEl = document.getElementById('solved-count');
            const sendBtn = document.getElementById('send-results-btn');
            
            if (percentEl) percentEl.textContent = progress.percent + '%';
            if (barEl) barEl.style.width = progress.percent + '%';
            if (solvedEl) solvedEl.textContent = progress.solved;
            if (sendBtn) sendBtn.style.display = progress.solved > 0 ? 'block' : 'none';
        }

        /**
         * Обновить отображение имени
         */
        updateStudentNameDisplay() {
            const nameDisplay = document.getElementById('student-name-display');
            const nameSpan = document.getElementById('current-student-name');
            
            if (nameDisplay && nameSpan) {
                if (this.studentName) {
                    nameSpan.textContent = this.studentName;
                    nameDisplay.style.display = 'block';
                } else {
                    nameDisplay.style.display = 'none';
                }
            }
        }

        // ───────────────────────────────────────────────────────────────────────
        // УВЕДОМЛЕНИЯ
        // ───────────────────────────────────────────────────────────────────────
        
        /**
         * Показать уведомление о получении монет
         */
        showCoinNotification(amount, reason) {
            const notification = document.createElement('div');
            notification.innerHTML = `
                <div style="
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
                    color: #333;
                    padding: 15px 25px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(255, 215, 0, 0.5);
                    z-index: 10000;
                    font-weight: bold;
                    font-size: 1.1rem;
                    animation: coinPopup 0.5s ease-out;
                ">
                    🪙 +${amount} ${reason ? `(${reason})` : ''}
                </div>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        /**
         * Показать обычное уведомление
         */
        showNotification(message, type = 'info') {
            const colors = {
                success: '#4caf50',
                error: '#f44336',
                warning: '#ff9800',
                info: '#2196f3'
            };
            
            const notification = document.createElement('div');
            notification.innerHTML = `
                <div style="
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: ${colors[type] || colors.info};
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    z-index: 10000;
                    font-weight: 500;
                ">
                    ${message}
                </div>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        /**
         * Показать достижение
         */
        showAchievement(achievementId) {
            const achievements = {
                'first_step': { icon: '🎯', name: 'Первый шаг', desc: 'Реши первое задание' },
                'solver_10': { icon: '📚', name: 'Ученик', desc: 'Реши 10 заданий' },
                'solver_50': { icon: '🎓', name: 'Эксперт', desc: 'Реши 50 заданий' },
                'solver_100': { icon: '🏆', name: 'Мастер ОГЭ', desc: 'Реши 100 заданий' },
                'streak_5': { icon: '🔥', name: 'Серия!', desc: '5 правильных подряд' },
                'streak_10': { icon: '⚡', name: 'Легенда!', desc: '10 правильных подряд' },
                'rich_100': { icon: '💰', name: 'Богач', desc: 'Накопи 100 монет' },
                'rich_500': { icon: '👑', name: 'Миллионер', desc: 'Накопи 500 монет' }
            };
            
            const ach = achievements[achievementId];
            if (!ach) return;
            
            const popup = document.createElement('div');
            popup.innerHTML = `
                <div style="
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 20px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
                    z-index: 10001;
                    text-align: center;
                    animation: achievementPopup 0.5s ease-out;
                ">
                    <div style="font-size: 4rem; margin-bottom: 15px;">${ach.icon}</div>
                    <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 10px;">Достижение разблокировано!</div>
                    <div style="font-size: 1.2rem; margin-bottom: 5px;">${ach.name}</div>
                    <div style="opacity: 0.8;">${ach.desc}</div>
                    <button onclick="this.parentElement.parentElement.remove()" style="
                        margin-top: 20px;
                        padding: 10px 20px;
                        background: white;
                        color: #667eea;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                    ">Круто! 🎉</button>
                </div>
            `;
            document.body.appendChild(popup);
            
            // Бонус за достижение
            this.addCoins(25, `Достижение: ${ach.name}`);
        }

        // ───────────────────────────────────────────────────────────────────────
        // СБРОС И ОЧИСТКА
        // ───────────────────────────────────────────────────────────────────────
        
        /**
         * Сбросить весь прогресс
         */
        resetAllProgress() {
            const confirmed = confirm(`⚠️ ВНИМАНИЕ!

Вы уверены, что хотите сбросить ВЕСЬ прогресс?

Будет удалено:
• Имя ученика: ${this.studentName || '(не задано)'}
• Баланс: ${this.balance} монет
• Решённых заданий: ${this.stats.totalSolved}
• Все достижения

Это действие нельзя отменить!`);

            if (confirmed) {
                // Очищаем localStorage
                Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
                    localStorage.removeItem(key);
                });
                
                // Сбрасываем переменные
                this.balance = 0;
                this.progress = {};
                this.studentName = '';
                this.achievements = [];
                this.stats = {
                    totalSolved: 0,
                    correctAnswers: 0,
                    wrongAnswers: 0,
                    streak: 0,
                    maxStreak: 0,
                    tasksByType: {}
                };
                this.solvedTasks.clear();
                
                // Обновляем UI
                this.updateBalanceDisplay();
                this.updateStudentNameDisplay();
                
                this.showNotification('✅ Прогресс полностью сброшен!', 'success');
                
                // Перезагружаем страницу
                setTimeout(() => location.reload(), 1500);
            }
        }

        /**
         * Получить полную статистику
         */
        getFullStats() {
            return {
                balance: this.balance,
                studentName: this.studentName,
                totalSolved: this.stats.totalSolved,
                correctAnswers: this.stats.correctAnswers,
                wrongAnswers: this.stats.wrongAnswers,
                accuracy: this.stats.correctAnswers + this.stats.wrongAnswers > 0 
                    ? Math.round((this.stats.correctAnswers / (this.stats.correctAnswers + this.stats.wrongAnswers)) * 100)
                    : 0,
                maxStreak: this.stats.maxStreak,
                achievements: this.achievements,
                progress: this.progress
            };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // СТИЛИ ДЛЯ АНИМАЦИЙ
    // ═══════════════════════════════════════════════════════════════════════════
    const styles = document.createElement('style');
    styles.textContent = `
        @keyframes coinPopup {
            0% { transform: translateX(-50%) translateY(-50px); opacity: 0; }
            50% { transform: translateX(-50%) translateY(10px); }
            100% { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        
        @keyframes achievementPopup {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            70% { transform: translate(-50%, -50%) scale(1.1); }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        /* Адаптивность для мобильных */
        @media (max-width: 768px) {
            #reward-balance-widget > div {
                top: 60px !important;
                right: 10px !important;
                padding: 8px 15px !important;
                font-size: 0.9rem !important;
            }
            
            #reward-progress-tracker > div {
                top: 110px !important;
                right: 10px !important;
                min-width: 150px !important;
                padding: 10px !important;
            }
        }
    `;
    document.head.appendChild(styles);

    // ═══════════════════════════════════════════════════════════════════════════
    // СОЗДАНИЕ ГЛОБАЛЬНОГО ЭКЗЕМПЛЯРА
    // ═══════════════════════════════════════════════════════════════════════════
    const rewardSystem = new RewardSystem();

    // Делаем доступным глобально
    global.RewardSystem = rewardSystem;

    // Автоматическая инициализация виджетов при загрузке
    document.addEventListener('DOMContentLoaded', function() {
        // Создаём виджет баланса
        rewardSystem.createBalanceWidget();
        
        console.log('🎮 RewardSystem готова к работе!');
    });

})(window);
