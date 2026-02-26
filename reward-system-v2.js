/**
 * 💎 ОГЭ ЭКОНОМИКА v2.1 - Исправленная версия
 */
(function(global) {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // КОНФИГУРАЦИЯ ЭКОНОМИКИ
    // ═══════════════════════════════════════════════════════════════════════════
    const ECONOMY_CONFIG = {
        CURRENCY: {
            CRYSTALS: { icon: '💎', name: 'кристаллов', max: 1000 },
            XP: { icon: '⭐', name: 'XP' }
        },
        
        REWARDS: {
            TASK_EASY: 5,
            TASK_MEDIUM: 10,
            TASK_HARD: 15,
            VISIT: 20,
            HOMEWORK: 30,
            TEST_EXCELLENT: 40,
            TEST_GOOD: 25,
            STREAK_7: 50,
            STREAK_14: 100,
            STREAK_30: 250,
            CORRECT_STREAK_5: 20,
            CORRECT_STREAK_10: 50,
            HELP_CLASSMATE: 15,
            BREAKTHROUGH: 100,
            NOMINATION_WIN: 100,
            HINT_PENALTY: 3  // При использовании подсказки награда = 3
        },
        
        ANTI_INFLATION: {
            BURN_RATE: 0.20,
            BURN_INTERVAL: 90,
            CAP_CRYSTALS: 1000,
            CAP_BONUS_XP: 0.5
        },
        
        GOOGLE_SHEETS: {
            SCRIPT_URL: 'https://script.google.com/macros/s/ВАШ_СКРИПТ/exec',
            LOG_PURCHASES: true,
            LOG_ECONOMY: true
        },
        
        KEYS: {
            CRYSTALS: 'oge_crystals',
            XP: 'oge_xp',
            STREAK: 'oge_streak',
            LAST_VISIT: 'oge_last_visit',
            CORRECT_STREAK: 'oge_correct_streak',
            STUDENT_NAME: 'oge_student_name',
            PURCHASES: 'oge_purchases',
            AUCTION_BIDS: 'oge_auction_bids',
            LAST_BURN: 'oge_last_burn',
            HINT_USED: 'oge_hint_used'  // Новый ключ для отслеживания подсказок
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // ТОВАРЫ В МАГАЗИНЕ (расширенный список реальных призов)
    // ═══════════════════════════════════════════════════════════════════════════
    const SHOP_ITEMS = [
        // Мелкие призы (до 200 💎)
        {
            id: 'coffee',
            name: '☕ Кофе/печенье',
            description: 'В кофейне рядом со школой',
            price: 150,
            stock: 5,
            realPrice: 300,
            category: 'small',
            limitPerStudent: 2
        },
        {
            id: 'chocolate',
            name: '🍫 Шоколадка',
            description: 'Вкусный батончик на перерыв',
            price: 100,
            stock: 5,
            realPrice: 150,
            category: 'small',
            limitPerStudent: 2
        },
        {
            id: 'stickers',
            name: '🎨 Стикеры',
            description: 'Крутые наклейки для тетради',
            price: 120,
            stock: 5,
            realPrice: 200,
            category: 'small',
            limitPerStudent: 2
        },
        {
            id: 'pen',
            name: '✒️ Ручка',
            description: 'Качественная ручка для письма',
            price: 80,
            stock: 5,
            realPrice: 150,
            category: 'small',
            limitPerStudent: 2
        },
        
        // Средние призы (200-400 💎)
        {
            id: 'music',
            name: '🎵 Подписка на музыку',
            description: 'Яндекс Плюс или Spotify на 3 месяца',
            price: 400,
            stock: 3,
            realPrice: 600,
            category: 'medium',
            limitPerStudent: 1
        },
        {
            id: 'cinema',
            name: '🎬 Билет в кино',
            description: 'Билет на фильм в кинотеатр',
            price: 350,
            stock: 3,
            realPrice: 500,
            category: 'medium',
            limitPerStudent: 1
        },
        {
            id: 'pizza',
            name: '🍕 Пицца',
            description: 'Вкусная пицца на обед',
            price: 300,
            stock: 3,
            realPrice: 450,
            category: 'medium',
            limitPerStudent: 1
        },
        {
            id: 'notebook',
            name: '📓 Красивый блокнот',
            description: 'Стильный блокнот для записей',
            price: 250,
            stock: 4,
            realPrice: 400,
            category: 'medium',
            limitPerStudent: 1
        },
        
        // Крупные призы (500+ 💎)
        {
            id: 'certificate_500',
            name: '🎁 Сертификат 500₽',
            description: 'Ozon, Wildberries или книжный',
            price: 600,
            stock: 2,
            realPrice: 500,
            category: 'large',
            limitPerStudent: 1
        },
        {
            id: 'game',
            name: '🎮 Игра в Steam',
            description: 'Игра на выбор до 700₽',
            price: 700,
            stock: 2,
            realPrice: 700,
            category: 'large',
            limitPerStudent: 1
        },
        
        // Бонусные (виртуальные)
        {
            id: 'skip_hw',
            name: '🎫 Пропуск ДЗ',
            description: 'Освобождение от одного домашнего задания',
            price: 250,
            stock: 5,
            realPrice: 0,
            category: 'bonus',
            limitPerStudent: 2
        },
        {
            id: 'shield',
            name: '🛡️ Щит',
            description: 'Защита от одной ошибки на контрольной',
            price: 350,
            stock: 3,
            realPrice: 0,
            category: 'bonus',
            limitPerStudent: 2
        },
        {
            id: 'hint_pack',
            name: '💡 Пакет подсказок',
            description: '10 дополнительных подсказок для задач',
            price: 200,
            stock: 10,
            realPrice: 0,
            category: 'virtual',
            limitPerStudent: 5
        }
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // АУКЦИОННЫЕ ТОВАРЫ
    // ═══════════════════════════════════════════════════════════════════════════
    const AUCTION_ITEMS = [
        {
            id: 'certificate_1000',
            name: '🎁 Сертификат 1000₽',
            description: 'Ozon, Wildberries или книжный магазин',
            minBid: 800,
            realPrice: 1000,
            month: null
        },
        {
            id: 'certificate_1500',
            name: '🎁 Сертификат 1500₽',
            description: 'На любые покупки',
            minBid: 1200,
            realPrice: 1500,
            month: null
        },
        {
            id: 'math_book',
            name: '📚 Книга по математике',
            description: 'Задачники ОГЭ или история математики',
            minBid: 600,
            realPrice: 800,
            month: null
        },
        {
            id: 'headphones',
            name: '🎧 Наушники',
            description: 'Хорошие наушники для учёбы',
            minBid: 900,
            realPrice: 1200,
            month: null
        }
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // КЛАСС ЭКОНОМИКИ
    // ═══════════════════════════════════════════════════════════════════════════
    class OGEEconomy {
        constructor() {
            this.data = {
                crystals: 0,
                xp: 0,
                streak: 0,
                correctStreak: 0,
                lastVisit: null,
                lastBurn: null,
                purchases: [],
                auctionBids: [],
                studentName: '',
                hintUsed: {}  // Отслеживание использованных подсказок по заданиям
            };
            this.init();
        }

        init() {
            this.loadData();
            this.checkDailyVisit();
            this.checkBurn();
            this.checkCap();
            console.log('💎 OGE Economy инициализирована');
        }

        loadData() {
            this.data.crystals = parseInt(localStorage.getItem(ECONOMY_CONFIG.KEYS.CRYSTALS)) || 0;
            this.data.xp = parseInt(localStorage.getItem(ECONOMY_CONFIG.KEYS.XP)) || 0;
            this.data.streak = parseInt(localStorage.getItem(ECONOMY_CONFIG.KEYS.STREAK)) || 0;
            this.data.correctStreak = parseInt(localStorage.getItem(ECONOMY_CONFIG.KEYS.CORRECT_STREAK)) || 0;
            this.data.lastVisit = localStorage.getItem(ECONOMY_CONFIG.KEYS.LAST_VISIT);
            this.data.lastBurn = localStorage.getItem(ECONOMY_CONFIG.KEYS.LAST_BURN);
            this.data.studentName = localStorage.getItem(ECONOMY_CONFIG.KEYS.STUDENT_NAME) || '';
            
            const savedPurchases = localStorage.getItem(ECONOMY_CONFIG.KEYS.PURCHASES);
            this.data.purchases = savedPurchases ? JSON.parse(savedPurchases) : [];
            
            const savedBids = localStorage.getItem(ECONOMY_CONFIG.KEYS.AUCTION_BIDS);
            this.data.auctionBids = savedBids ? JSON.parse(savedBids) : [];
            
            const savedHints = localStorage.getItem(ECONOMY_CONFIG.KEYS.HINT_USED);
            this.data.hintUsed = savedHints ? JSON.parse(savedHints) : {};
        }

        saveData() {
            localStorage.setItem(ECONOMY_CONFIG.KEYS.CRYSTALS, this.data.crystals);
            localStorage.setItem(ECONOMY_CONFIG.KEYS.XP, this.data.xp);
            localStorage.setItem(ECONOMY_CONFIG.KEYS.STREAK, this.data.streak);
            localStorage.setItem(ECONOMY_CONFIG.KEYS.CORRECT_STREAK, this.data.correctStreak);
            localStorage.setItem(ECONOMY_CONFIG.KEYS.LAST_VISIT, this.data.lastVisit);
            localStorage.setItem(ECONOMY_CONFIG.KEYS.LAST_BURN, this.data.lastBurn);
            localStorage.setItem(ECONOMY_CONFIG.KEYS.STUDENT_NAME, this.data.studentName);
            localStorage.setItem(ECONOMY_CONFIG.KEYS.PURCHASES, JSON.stringify(this.data.purchases));
            localStorage.setItem(ECONOMY_CONFIG.KEYS.AUCTION_BIDS, JSON.stringify(this.data.auctionBids));
            localStorage.setItem(ECONOMY_CONFIG.KEYS.HINT_USED, JSON.stringify(this.data.hintUsed));
        }

        checkDailyVisit() {
            const today = new Date().toDateString();
            
            if (this.data.lastVisit !== today) {
                const lastDate = this.data.lastVisit ? new Date(this.data.lastVisit) : null;
                const diffDays = lastDate ? (new Date() - lastDate) / (1000*60*60*24) : 999;
                
                if (diffDays < 2) {
                    this.data.streak++;
                    this.showNotification(`🔥 Стрик: ${this.data.streak} дней!`, 'success');
                    
                    if (this.data.streak === 7) {
                        this.addCrystals(ECONOMY_CONFIG.REWARDS.STREAK_7, 'Недельный стрик! 🔥');
                    } else if (this.data.streak === 14) {
                        this.addCrystals(ECONOMY_CONFIG.REWARDS.STREAK_14, 'Двухнедельный стрик! 🔥🔥');
                    } else if (this.data.streak === 30) {
                        this.addCrystals(ECONOMY_CONFIG.REWARDS.STREAK_30, 'Месячный стрик! 🎉');
                    }
                } else if (diffDays >= 2) {
                    if (this.data.streak > 0) {
                        this.showNotification(`😢 Стрик оборван! Было: ${this.data.streak} дней`, 'warning');
                    }
                    this.data.streak = 1;
                } else {
                    this.data.streak = 1;
                }
                
                this.data.lastVisit = today;
                this.saveData();
                this.updateUI();
            }
        }

        addCrystals(amount, reason = '', checkCap = true) {
            if (checkCap) {
                const beforeCap = this.data.crystals;
                const afterCap = Math.min(this.data.crystals + amount, ECONOMY_CONFIG.ANTI_INFLATION.CAP_CRYSTALS);
                const overflow = (this.data.crystals + amount) - ECONOMY_CONFIG.ANTI_INFLATION.CAP_CRYSTALS;
                
                this.data.crystals = afterCap;
                
                if (overflow > 0) {
                    const xpBonus = Math.floor(overflow * ECONOMY_CONFIG.ANTI_INFLATION.CAP_BONUS_XP);
                    this.addXP(xpBonus, 'Конвертация излишка кристаллов');
                    this.showNotification(`💎 Достигнут кап! +${xpBonus} XP`, 'info');
                }
            } else {
                this.data.crystals += amount;
            }
            
            this.saveData();
            this.showCrystalNotification(amount, reason);
            this.updateUI();
            return this.data.crystals;
        }

        addXP(amount, reason = '') {
            this.data.xp += amount;
            this.saveData();
            this.updateUI();
            return this.data.xp;
        }

        spendCrystals(amount, reason = '') {
            if (this.data.crystals < amount) {
                this.showNotification('Недостаточно кристаллов! 💎😢', 'error');
                return false;
            }
            
            this.data.crystals -= amount;
            this.saveData();
            this.updateUI();
            this.showNotification(`-${amount} 💎 (${reason})`, 'success');
            return true;
        }

        // ═══════════════════════════════════════════════════════════════════════
        // ЗАДАНИЯ И НАГРАДЫ
        // ═══════════════════════════════════════════════════════════════════════
        completeTask(difficulty, isCorrect, taskId = '') {
            if (isCorrect) {
                // Проверяем, использовалась ли подсказка
                const hintUsed = this.data.hintUsed[taskId] || false;
                
                // Если использовалась подсказка, награда = 3 независимо от сложности
                let reward = hintUsed ? ECONOMY_CONFIG.REWARDS.HINT_PENALTY : 0;
                
                if (!hintUsed) {
                    switch(difficulty) {
                        case 'easy': reward = ECONOMY_CONFIG.REWARDS.TASK_EASY; break;
                        case 'medium': reward = ECONOMY_CONFIG.REWARDS.TASK_MEDIUM; break;
                        case 'hard': reward = ECONOMY_CONFIG.REWARDS.TASK_HARD; break;
                        default: reward = ECONOMY_CONFIG.REWARDS.TASK_EASY;
                    }
                }
                
                this.addCrystals(reward, hintUsed ? 'Задание (с подсказкой)' : `Задание ${difficulty}`);
                this.addXP(reward * 2, hintUsed ? 'Задание (с подсказкой)' : `Задание ${difficulty}`);
                
                // Стрик правильных ответов
                this.data.correctStreak++;
                if (this.data.correctStreak === 5) {
                    this.addCrystals(ECONOMY_CONFIG.REWARDS.CORRECT_STREAK_5, 'Серия x5! 🔥');
                } else if (this.data.correctStreak === 10) {
                    this.addCrystals(ECONOMY_CONFIG.REWARDS.CORRECT_STREAK_10, 'Серия x10! ⚡');
                }
                
                this.saveData();
            } else {
                if (this.data.correctStreak > 0) {
                    this.showNotification(`Серия прервана! Было: ${this.data.correctStreak}`, 'warning');
                    this.data.correctStreak = 0;
                    this.saveData();
                }
            }
            
            this.updateUI();
        }

        // Отметить использование подсказки
        useHint(taskId) {
            this.data.hintUsed[taskId] = true;
            this.saveData();
            this.showNotification('💡 Подсказка открыта! Награда за это задание: 3 💎', 'warning');
        }

        // Проверить, использовалась ли подсказка
        isHintUsed(taskId) {
            return this.data.hintUsed[taskId] || false;
        }

        checkBurn() {
            const now = new Date();
            const lastBurn = this.data.lastBurn ? new Date(this.data.lastBurn) : null;
            const daysSinceBurn = lastBurn ? (now - lastBurn) / (1000*60*60*24) : 999;
            
            if (daysSinceBurn >= ECONOMY_CONFIG.ANTI_INFLATION.BURN_INTERVAL) {
                const burnAmount = Math.floor(this.data.crystals * ECONOMY_CONFIG.ANTI_INFLATION.BURN_RATE);
                
                if (burnAmount > 0) {
                    this.data.crystals -= burnAmount;
                    this.data.lastBurn = now.toISOString();
                    this.saveData();
                    
                    this.showModal(
                        '🔥 Сгорание кристаллов',
                        `Прошло ${ECONOMY_CONFIG.ANTI_INFLATION.BURN_INTERVAL} дней!`,
                        `Сгорело ${burnAmount} кристаллов (20%). Трать быстрее! 💎`
                    );
                }
            }
        }

        checkCap() {
            if (this.data.crystals > ECONOMY_CONFIG.ANTI_INFLATION.CAP_CRYSTALS) {
                const overflow = this.data.crystals - ECONOMY_CONFIG.ANTI_INFLATION.CAP_CRYSTALS;
                this.data.crystals = ECONOMY_CONFIG.ANTI_INFLATION.CAP_CRYSTALS;
                
                const xpBonus = Math.floor(overflow * ECONOMY_CONFIG.ANTI_INFLATION.CAP_BONUS_XP);
                this.addXP(xpBonus, 'Достигнут кап кристаллов');
                
                this.showNotification(`💎 Достигнут максимум! +${xpBonus} XP`, 'info');
                this.saveData();
            }
        }

        buyItem(itemId) {
            const item = SHOP_ITEMS.find(i => i.id === itemId);
            if (!item) return false;
            
            const studentPurchases = this.data.purchases.filter(
                p => p.itemId === itemId && p.month === new Date().getMonth()
            );
            if (studentPurchases.length >= item.limitPerStudent) {
                this.showNotification('Лимит на этот месяц исчерпан! 😢', 'error');
                return false;
            }
            
            const totalBought = this.data.purchases.filter(
                p => p.itemId === itemId && p.month === new Date().getMonth()
            ).length;
            if (totalBought >= item.stock) {
                this.showNotification('Товар распродан! 😢', 'error');
                return false;
            }
            
            if (this.spendCrystals(item.price, item.name)) {
                const purchase = {
                    itemId: item.id,
                    itemName: item.name,
                    price: item.price,
                    date: new Date().toISOString(),
                    month: new Date().getMonth(),
                    status: 'pending',
                    studentName: this.data.studentName
                };
                
                this.data.purchases.push(purchase);
                this.saveData();
                
                this.logToSheets('purchase', purchase);
                
                this.showModal(
                    '🎉 Покупка совершена!',
                    item.name,
                    `Напиши мне в личку для получения приза! 💎 Осталось: ${this.data.crystals}`
                );
                
                return true;
            }
            
            return false;
        }

        placeBid(itemId, amount) {
            const item = AUCTION_ITEMS.find(i => i.id === itemId);
            if (!item) return false;
            
            if (amount < item.minBid) {
                this.showNotification(`Минимальная ставка: ${item.minBid} 💎`, 'error');
                return false;
            }
            
            if (this.data.crystals < amount) {
                this.showNotification('Недостаточно кристаллов! 💎😢', 'error');
                return false;
            }
            
            const bid = {
                itemId: item.id,
                itemName: item.name,
                amount: amount,
                date: new Date().toISOString(),
                month: new Date().getMonth(),
                studentName: this.data.studentName
            };
            
            this.data.auctionBids = this.data.auctionBids.filter(
                b => !(b.itemId === itemId && b.studentName === this.data.studentName && b.month === new Date().getMonth())
            );
            
            this.data.auctionBids.push(bid);
            this.saveData();
            
            this.logToSheets('bid', bid);
            
            this.showNotification(`Ставка ${amount} 💎 принята! 🤫`, 'success');
            return true;
        }

        getAuctionResults() {
            const currentMonth = new Date().getMonth();
            const results = {};
            
            AUCTION_ITEMS.forEach(item => {
                const bids = this.data.auctionBids.filter(
                    b => b.itemId === item.id && b.month === currentMonth
                );
                
                if (bids.length > 0) {
                    const winner = bids.reduce((max, b) => b.amount > max.amount ? b : max);
                    results[item.id] = {
                        item: item,
                        winner: winner,
                        totalBids: bids.length
                    };
                }
            });
            
            return results;
        }

        async logToSheets(type, data) {
            if (!ECONOMY_CONFIG.GOOGLE_SHEETS.SCRIPT_URL.includes('ВАШ_СКРИПТ')) {
                try {
                    await fetch(ECONOMY_CONFIG.GOOGLE_SHEETS.SCRIPT_URL, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type, data, timestamp: new Date().toISOString() })
                    });
                } catch (e) {
                    console.log('Ошибка отправки в Sheets:', e);
                }
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // UI ОБНОВЛЕНИЕ - ВИДЖЕТ СЛЕВА
        // ═══════════════════════════════════════════════════════════════════════
        createEconomyWidget() {
            const widget = document.createElement('div');
            widget.id = 'oge-economy-widget';
            widget.innerHTML = `
                <div style="
                    position: fixed;
                    top: 80px;
                    left: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px 20px;
                    border-radius: 15px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.3);
                    z-index: 9999;
                    min-width: 180px;
                    cursor: pointer;
                    transition: transform 0.2s;
                " onclick="window.open('index.html', '_blank')">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 1.5rem;">💎</span>
                        <span id="crystal-display" style="font-size: 1.8rem; font-weight: bold;">${this.data.crystals}</span>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-size: 1.2rem;">⭐</span>
                        <span id="xp-display" style="font-size: 1.3rem; font-weight: bold;">${this.data.xp}</span>
                    </div>
                    ${this.data.streak > 0 ? `
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.3); text-align: center;">
                        🔥 ${this.data.streak} дней
                    </div>
                    ` : ''}
                </div>
            `;
            document.body.appendChild(widget);
            
            widget.querySelector('div').addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.05)';
            });
            widget.querySelector('div').addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
        }

        updateUI() {
            const crystalDisplay = document.getElementById('crystal-display');
            const xpDisplay = document.getElementById('xp-display');
            
            if (crystalDisplay) crystalDisplay.textContent = this.data.crystals;
            if (xpDisplay) xpDisplay.textContent = this.data.xp;
        }

        showCrystalNotification(amount, reason) {
            const notification = document.createElement('div');
            notification.innerHTML = `
                <div style="
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%);
                    color: white;
                    padding: 15px 25px;
                    border-radius: 12px;
                    box-shadow: 0 5px 20px rgba(0, 210, 255, 0.4);
                    z-index: 10000;
                    font-weight: bold;
                    font-size: 1.1rem;
                    animation: crystalPopup 0.5s ease-out;
                ">
                    💎 +${amount} ${reason ? `(${reason})` : ''}
                </div>
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }

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
            setTimeout(() => notification.remove(), 3000);
        }

        showModal(title, subtitle, text) {
            const modal = document.createElement('div');
            modal.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.7);
                    z-index: 10001;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                " onclick="this.remove()">
                    <div style="
                        background: white;
                        border-radius: 20px;
                        padding: 40px;
                        max-width: 400px;
                        width: 100%;
                        text-align: center;
                        animation: modalPopup 0.3s ease-out;
                    " onclick="event.stopPropagation()">
                        <div style="font-size: 1.5rem; color: #667eea; margin-bottom: 10px;">${title}</div>
                        <div style="font-size: 1.2rem; color: #333; margin-bottom: 15px;">${subtitle}</div>
                        <div style="color: #666; margin-bottom: 25px;">${text}</div>
                        <button onclick="this.closest('.modal').remove()" style="
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border: none;
                            padding: 12px 30px;
                            border-radius: 25px;
                            cursor: pointer;
                            font-weight: bold;
                        ">Отлично!</button>
                    </div>
                </div>
            `;
            modal.className = 'modal';
            document.body.appendChild(modal);
        }

        setStudentName(name) {
            if (name && name.trim()) {
                this.data.studentName = name.trim();
                this.saveData();
                return true;
            }
            return false;
        }

        askStudentName() {
            if (!this.data.studentName) {
                const name = prompt('👋 Привет! Введи своё имя:');
                if (name) {
                    this.setStudentName(name);
                    this.showNotification(`Привет, ${name}! 💎`, 'success');
                }
            }
            return this.data.studentName;
        }

        getStats() {
            return {
                crystals: this.data.crystals,
                xp: this.data.xp,
                streak: this.data.streak,
                correctStreak: this.data.correctStreak,
                studentName: this.data.studentName,
                purchases: this.data.purchases,
                auctionBids: this.data.auctionBids,
                hintUsed: this.data.hintUsed
            };
        }
    }

    const styles = document.createElement('style');
    styles.textContent = `
        @keyframes crystalPopup {
            0% { transform: translateX(-50%) translateY(-50px); opacity: 0; }
            50% { transform: translateX(-50%) translateY(10px); }
            100% { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        
        @keyframes modalPopup {
            0% { transform: scale(0.8); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }
        
        @media (max-width: 768px) {
            #oge-economy-widget > div {
                top: 60px !important;
                left: 10px !important;
                padding: 10px 15px !important;
                min-width: 140px !important;
            }
        }
    `;
    document.head.appendChild(styles);

    const economy = new OGEEconomy();
    global.OGEEconomy = economy;
    global.SHOP_ITEMS = SHOP_ITEMS;
    global.AUCTION_ITEMS = AUCTION_ITEMS;

    document.addEventListener('DOMContentLoaded', function() {
        economy.createEconomyWidget();
        economy.askStudentName();
        console.log('💎 OGE Economy готова!');
    });

})(window);
