// ─── VIEWPORT INSTANT HEIGHT SYNC ─────────────────────
const syncAppViewportHeight = () => {
    const height = (window.visualViewport && window.visualViewport.height) || window.innerHeight || document.documentElement.clientHeight;
    document.documentElement.style.setProperty('--app-height', `${height}px`);
};
syncAppViewportHeight();
window.addEventListener('resize', syncAppViewportHeight);
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncAppViewportHeight);
    window.visualViewport.addEventListener('scroll', syncAppViewportHeight);
}

const isTelegramWebView = () => /Telegram|TelegramBot|tgWebApp|TWebView/i.test(navigator.userAgent || '') || !!(window.Telegram && window.Telegram.WebApp);
const isApplication = () => isTelegramWebView() || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator && window.navigator.standalone) || new URLSearchParams(window.location.search).has('app') || localStorage.getItem('force_app_mode') === 'true';

// ─── INDEXEDDB OFFLINE STORAGE ─────────────────────────
const DB_NAME = 'codextrms_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'downloaded_videos';

function openOfflineDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

async function saveVideoBlob(videoId, blob) {
    try {
        const db = await openOfflineDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.put({ id: videoId, blob: blob, savedAt: Date.now() });
            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.error('IndexedDB save error:', err);
        return false;
    }
}

async function getVideoBlob(videoId) {
    try {
        const db = await openOfflineDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(videoId);
            request.onsuccess = (e) => {
                const res = e.target.result;
                resolve(res ? res.blob : null);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.error('IndexedDB get error:', err);
        return null;
    }
}

async function deleteVideoBlob(videoId) {
    try {
        const db = await openOfflineDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.delete(videoId);
            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.error('IndexedDB delete error:', err);
        return false;
    }
}

        function safeOpenExternal(url) {
            const opened = isTelegramWebView() ? null : window.open(url, '_blank');
            if (!opened) window.location.href = url;
        }
        window.safeOpenExternal = safeOpenExternal;
        const isCompactVideoViewport = () => (window.innerWidth || 0) <= 820;
        const shouldUseCleanVideoMode = () => isTelegramWebView() || isCompactVideoViewport();
        const setTelegramPlayerMode = (active) => {
            document.body.classList.toggle('telegram-player-mode', active && shouldUseCleanVideoMode());
            if (!active) {
                document.body.classList.remove('telegram-settings-open');
                const telegramSettingsSheet = document.getElementById('telegramSettingsSheet');
                const telegramSpeedChoices = document.getElementById('telegramSpeedChoices');
                if (telegramSettingsSheet) telegramSettingsSheet.setAttribute('aria-hidden', 'true');
                if (telegramSpeedChoices) telegramSpeedChoices.classList.remove('open');
            }
        };
        window.addEventListener('resize', () => {
            const modal = document.getElementById('videoModal');
            if (modal && modal.style.display === 'flex') {
                setTelegramPlayerMode(true);
            }
        });
        
        // DOM Elements
        const notificationIcon = document.getElementById('notificationIcon');
        const notificationsPanel = document.getElementById('notificationsPanel');
        const closeNotifications = document.getElementById('closeNotifications');
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        const progressMenuBtn = document.getElementById('progressMenuBtn');
        const progressMenu = document.getElementById('progressMenu');
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.section');
        const continueItems = document.querySelectorAll('.continue-item');
        const videoModal = document.getElementById('videoModal');
        const videoPlayer = document.getElementById('videoPlayer');
        const offlineIndicator = document.getElementById('offlineIndicator');
        const overlay = document.getElementById('overlay');
        const swipeArea = document.getElementById('swipeArea');
        const gatewayBatchCard = document.getElementById('gatewayBatchCard');
        const apnaCollegeBatchCard = document.getElementById('apnaCollegeBatchCard');
        const chaiaurcodeBatchCard = document.getElementById('chaiaurcodeBatchCard');
        const codewithharryBatchCard = document.getElementById('codewithharryBatchCard');
        const batchDataModal = document.getElementById('batchDataModal');
        const closeBatchData = document.getElementById('closeBatchData');
        const batchDataTitle = document.getElementById('batchDataTitle');
        const batchDataContent = document.getElementById('batchDataContent');
        const backToSubjectsBtn = document.getElementById('backToSubjectsBtn');
        const subjectSearchInput = document.getElementById('subjectSearchInput');
        const subjectControls = document.getElementById('subjectControls');
        const allSubjectsTabBtn = document.getElementById('allSubjectsTabBtn');
        const favoriteSubjectsTabBtn = document.getElementById('favoriteSubjectsTabBtn');
        const modalBatchBackBtn = document.getElementById('modalBatchBackBtn');
        const subjectPathLabel = document.getElementById('subjectPathLabel');
        const popularBatchSearch = document.getElementById('popularBatchSearch');
        const getPopularBatchCards = () => document.querySelectorAll('.batch-grid .batch-card');
        const popularBatchNoResults = document.getElementById('popularBatchNoResults');
        const progressDetailsBtn = document.getElementById('progressDetailsBtn');
        const progressShareBtn = document.getElementById('progressShareBtn');
        const notificationBadge = document.getElementById('notificationBadge');
        const NOTIFICATIONS_KEY = 'codextrms_notifications';
        const NOTIFICATIONS_SEEN_KEY = 'codextrms_notifications_seen_at';

        const readAppNotifications = () => {
            try {
                return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
            } catch {
                return [];
            }
        };

        const saveAppNotifications = (items) => {
            localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(items));
        };

        const getNotificationsSeenAt = () => Number(localStorage.getItem(NOTIFICATIONS_SEEN_KEY) || 0);

        const renderNotifications = () => {
            const list = document.getElementById('notificationsList');
            const notifications = readAppNotifications().sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
            const seenAt = getNotificationsSeenAt();
            const unseenCount = notifications.filter(item => (Number(item.createdAt) || 0) > seenAt).length;

            if (notificationBadge) {
                notificationBadge.textContent = String(unseenCount);
                notificationBadge.style.display = unseenCount > 0 ? 'flex' : 'none';
            }
            const pBadge = document.getElementById('playerNotificationBadge');
            if (pBadge) {
                pBadge.textContent = String(unseenCount);
                pBadge.style.display = unseenCount > 0 ? 'flex' : 'none';
            }

            if (list) {
                list.innerHTML = notifications.length ? notifications.map(item => {
                    const createdAt = Number(item.createdAt) || Date.now();
                    const isNew = createdAt > seenAt;
                    return `
                        <div class="notification-item" style="${isNew ? 'background:rgba(0,240,255,0.07);margin:0 -8px;padding:12px 8px;border-radius:10px;' : ''}">
                            <div style="font-weight:700;font-size:0.9rem;color:var(--text-primary);">${escapeHtml(item.title || 'Notification')}</div>
                            <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px;line-height:1.45;">${escapeHtml(item.body || '')}</div>
                            <div class="notification-time">${timeAgo(createdAt)}</div>
                        </div>
                    `;
                }).join('') : '<p style="color:var(--text-secondary);font-size:0.86rem;line-height:1.45;">Abhi koi notification nahi hai.</p>';
            }
        };

        const markNotificationsSeen = () => {
            localStorage.setItem(NOTIFICATIONS_SEEN_KEY, String(Date.now()));
            renderNotifications();
        };

        window.addNotification = (title, body = '') => {
            const notifications = readAppNotifications();
            notifications.unshift({
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                title,
                body,
                createdAt: Date.now()
            });
            saveAppNotifications(notifications.slice(0, 50));
            renderNotifications();
        };
        renderNotifications();
        
        // Notification Panel Toggle
        notificationIcon.addEventListener('click', () => {
            notificationsPanel.classList.toggle('open');
            overlay.style.display = 'block';
            swipeArea.style.display = 'block';
            markNotificationsSeen();
        });

        closeNotifications.addEventListener('click', () => {
            notificationsPanel.classList.remove('open');
            overlay.style.display = 'none';
            swipeArea.style.display = 'none';
            markNotificationsSeen();
        });

        // Theme Toggle
        themeToggleBtn.addEventListener('click', () => {
            document.body.dataset.theme = document.body.dataset.theme === 'light' ? 'dark' : 'light';
            const isLight = document.body.dataset.theme === 'light';
            const iconHtml = isLight ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            themeToggleBtn.innerHTML = iconHtml;
            const pThemeBtn = document.getElementById('playerThemeToggleBtn');
            if (pThemeBtn) pThemeBtn.innerHTML = iconHtml;
        });

        const playerThemeToggleBtn = document.getElementById('playerThemeToggleBtn');
        if (playerThemeToggleBtn) {
            playerThemeToggleBtn.addEventListener('click', () => {
                document.body.dataset.theme = document.body.dataset.theme === 'light' ? 'dark' : 'light';
                const isLight = document.body.dataset.theme === 'light';
                const iconHtml = isLight ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
                themeToggleBtn.innerHTML = iconHtml;
                playerThemeToggleBtn.innerHTML = iconHtml;
            });
        }

        const playerNotificationIcon = document.getElementById('playerNotificationIcon');
        if (playerNotificationIcon) {
            playerNotificationIcon.addEventListener('click', () => {
                notificationsPanel.classList.toggle('open');
                overlay.style.display = 'block';
                swipeArea.style.display = 'block';
                markNotificationsSeen();
            });
        }

        // Progress Menu Toggle
        progressMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            progressMenu.style.display = progressMenu.style.display === 'block' ? 'none' : 'block';
        });

        // Close menu when clicking outside
        document.addEventListener('click', () => {
            progressMenu.style.display = 'none';
        });

        if (progressDetailsBtn) {
            progressDetailsBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                progressMenu.style.display = 'none';
                showProgressDetails();
            });
        }

        if (progressShareBtn) {
            progressShareBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                progressMenu.style.display = 'none';
                shareProgress();
            });
        }

        const LAST_ACTIVE_SECTION_KEY = 'codextrms_last_active_section';
        const STREAM_BASE_API_CANDIDATES = [
            'https://ascii-newspaper-whilst-year.trycloudflare.com/stream/',
        ];
        const STREAM_BASE_API = STREAM_BASE_API_CANDIDATES[0];
        const GATEWAY_FAVORITE_SUBJECTS_KEY = 'gateway_favorite_subjects';
        const GATEWAY_VIEW_STATE_KEY = 'codextrms_gateway_view_state';

        const buildVideoStreamSources = (channelId, videoId) => {
            if (!channelId || !videoId) return [];
            return STREAM_BASE_API_CANDIDATES.map(
                (base) => `${base}${channelId}/${videoId}?t=${Date.now()}`,
            );
        };

        const normalizeStreamUrl = (url = '') => String(url || '')
            .replace('https://ascii-newspaper-whilst-year.trycloudflare.com/stream/', STREAM_BASE_API)
            .replace('https://ascii-newspaper-whilst-year.trycloudflare.com/stream/', STREAM_BASE_API);

        const buildPdfUrl = (channelId, fileId) => {
            if (!channelId || !fileId) return '';
            return `${STREAM_BASE_API}${channelId}/${fileId}`;
        };

        const VIDEO_STREAM_LOAD_TIMEOUT_MS = 120000;
        const VIDEO_STREAM_RETRY_ROUNDS = 2;

        const stopVideoStreamFallback = (videoElement) => {
            if (!videoElement) return;
            if (videoElement._streamLoadTimer) {
                clearTimeout(videoElement._streamLoadTimer);
                videoElement._streamLoadTimer = null;
            }
            videoElement._streamLoadToken = Symbol('stopped-stream-load');
            videoElement.onerror = null;
            videoElement.onloadedmetadata = null;
            videoElement.oncanplay = null;
            videoElement.onplaying = null;
            videoElement.onstalled = null;
        };

        const applyVideoStreamSource = (videoElement, sources) => {
            if (!videoElement || !sources || !sources.length) return;
            stopVideoStreamFallback(videoElement);

            const loadToken = Symbol('stream-load');
            const maxAttempts = sources.length * VIDEO_STREAM_RETRY_ROUNDS;
            let attemptIndex = 0;
            let settledSource = false;
            videoElement._streamLoadToken = loadToken;

            const clearLoadTimer = () => {
                if (videoElement._streamLoadTimer) {
                    clearTimeout(videoElement._streamLoadTimer);
                    videoElement._streamLoadTimer = null;
                }
            };

            const markSourceReady = () => {
                if (videoElement._streamLoadToken !== loadToken) return;
                settledSource = true;
                clearLoadTimer();
            };

            const trySource = () => {
                if (videoElement._streamLoadToken !== loadToken || settledSource) return;
                clearLoadTimer();
                if (attemptIndex >= maxAttempts) {
                    attemptIndex = 0;
                }
                const source = sources[attemptIndex % sources.length];
                const separator = source.includes('?') ? '&' : '?';
                const playableSource = `${source}${separator}retry=${attemptIndex + 1}-${Date.now()}`;
                attemptIndex += 1;
                videoElement.pause();
                settledSource = false;
                videoElement.src = playableSource;
                videoElement.load();
                videoElement.play().catch(() => {});
                videoElement._streamLoadTimer = setTimeout(() => {
                    if (videoElement._streamLoadToken === loadToken && !settledSource && videoElement.readyState < 2) {
                        trySource();
                    }
                }, VIDEO_STREAM_LOAD_TIMEOUT_MS);
            };
            videoElement.onerror = () => {
                trySource();
            };
            videoElement.onloadedmetadata = markSourceReady;
            videoElement.oncanplay = markSourceReady;
            videoElement.onplaying = markSourceReady;
            videoElement.onstalled = () => {
                if (videoElement._streamLoadToken !== loadToken || videoElement.readyState >= 2) {
                    markSourceReady();
                }
            };
            trySource();
        };

        const setActiveSection = (sectionId) => {
            const targetSection = document.getElementById(sectionId);
            if (!targetSection) return;

            navItems.forEach(navItem => {
                navItem.classList.toggle('active', navItem.dataset.section === sectionId);
            });

            sections.forEach(section => section.classList.remove('active'));
            targetSection.classList.add('active');

            const doubtSection = document.getElementById('doubt-section');
            if (doubtSection) {
                doubtSection.classList.toggle('ds-active', sectionId === 'testsSection');
            }

            if (sectionId === 'profileSection' && typeof initProfile === 'function') {
                initProfile();
            }

            localStorage.setItem(LAST_ACTIVE_SECTION_KEY, sectionId);
        };

        // Navigation
       navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Close any open modals/overlays first
        notificationsPanel.classList.remove('open');
        markNotificationsSeen();
        batchDataModal.classList.remove('active');
        if (videoPlayer && videoPlayer.src && videoModal.style.display === 'flex' && !videoModal.classList.contains('is-floating')) {
            minimizePremiumVideo();
        } else if (!videoModal.classList.contains('is-floating')) {
            videoModal.style.display = 'none';
        }
        overlay.style.display = 'none';
        swipeArea.style.display = 'none';
        localStorage.removeItem(GATEWAY_VIEW_STATE_KEY);
        
        const sectionId = item.dataset.section;
        setActiveSection(sectionId);
    });
});

        const savedSection = localStorage.getItem(LAST_ACTIVE_SECTION_KEY);
        if (savedSection) {
            setActiveSection(savedSection);
        }

        const filterPopularBatches = (searchTerm = '') => {
            const normalizedTerm = searchTerm.trim().toLowerCase();
            let visibleCount = 0;

            getPopularBatchCards().forEach((card) => {
                const titleEl = card.querySelector('.batch-title');
                const instructorEl = card.querySelector('.batch-instructor');
                const title = titleEl ? titleEl.textContent.toLowerCase() : '';
                const instructor = instructorEl ? instructorEl.textContent.toLowerCase() : '';
                const isVisible = !normalizedTerm || title.includes(normalizedTerm) || instructor.includes(normalizedTerm);
                card.style.display = isVisible ? '' : 'none';
                if (isVisible) visibleCount++;
            });

            if (popularBatchNoResults) {
                popularBatchNoResults.style.display = visibleCount === 0 ? 'block' : 'none';
            }
        };

        if (popularBatchSearch) {
            popularBatchSearch.addEventListener('input', (event) => {
                filterPopularBatches(event.target.value);
            });
        }

        continueItems.forEach(item => {
    item.addEventListener('click', () => {
        const title = item.querySelector('.continue-title').textContent;
        openPremiumVideo('', title, null);
    });
});

        // Batch data handling
        let currentBatchData = [];
        let currentBatchTitle = '';  // YE ADD KARO
        let selectedSubject = null;
        let selectedChapter = null;
        let selectedSubjectIndex = -1;
        let selectedChapterIndex = -1;
        let selectedChannelId = '-1003345907635';
        let subjectSearchTerm = '';
        let subjectTab = 'all';
        let currentBatchDataKey = '';
        let isRestoringGatewayState = false;
        let favoriteSubjects = JSON.parse(localStorage.getItem(GATEWAY_FAVORITE_SUBJECTS_KEY) || '[]');
        const getCompletedLectureIds = () => JSON.parse(localStorage.getItem('completed_lectures') || '[]').map(String);
        const ENROLLED_BATCHES_KEY = 'codextrms_enrolled_batches';
        const PINNED_BATCHES_KEY = 'codextrms_pinned_batches';
        const RECENT_SUBJECTS_KEY = 'codextrms_recent_subjects';
        const LECTURE_PROGRESS_KEY = 'codextrms_lecture_progress';
        const STUDY_STATS_KEY = 'codextrms_study_stats';
        const VIDEO_COMMENTS_KEY = 'codextrms_video_comments';
        const CATALOG_SNAPSHOT_KEY = 'codextrms_catalog_snapshot';
        let currentCommentKey = '';
        let editingVideoCommentIndex = -1;

        const getGatewayBatchSources = () => [
            { title: 'GATEWAY – 1ST YEAR', dataKey: 'dataClass13' },
            { title: 'APNA COLLEGE', dataKey: 'dataClass11' },
            { title: 'DSA', dataKey: 'dataClass17' },
            { title: 'CHAI AUR CODE', dataKey: 'dataClass101' },
            { title: 'CODE WITH HARRY', dataKey: 'dataClass114' },
            { title: 'SUPREME COURSE', dataKey: 'dataClass102' },
            { title: 'WEDDING MASTERY', dataKey: 'dataClass103' },
            { title: 'PROFESSOR OF HOW', dataKey: 'dataClass104' },
            { title: 'PW SKILLS', dataKey: 'dataClass105' },
            { title: 'Keerti Purswani HHLD', dataKey: 'dataClass106' },
            { title: 'Financial Modeling Fundamentals', dataKey: 'dataClass107' },
            { title: 'UDEMY', dataKey: 'dataClass108' },
            { title: 'TRADING', dataKey: 'dataClass109' },
            { title: 'DevOps', dataKey: 'dataClass110' },
            { title: 'HARKIRAT COHORT', dataKey: 'dataClass111' },
            { title: 'SHREYANSH CODING', dataKey: 'dataClass112' },
            { title: 'CAMPUS', dataKey: 'dataClass113' },
            { title: 'DROPSHIPPING', dataKey: 'dataClass14' },
            { title: 'JASON FEDIN', dataKey: 'dataClass15' },
            { title: 'INEURON', dataKey: 'dataClass116' },
            { title: 'ADCA', dataKey: 'dataClass115' },
            { title: 'EARNERS', dataKey: 'dataClass201' },
            { title: 'GATEWAY – 3RD SEM', dataKey: 'dataClass202' },
        ];

        const resolveGatewayBatchSource = (data, title = '') => {
            const sources = getGatewayBatchSources();
            return sources.find(source => window[source.dataKey] === data)
                || sources.find(source => source.title === title)
                || sources.find(source => source.title.toLowerCase() === String(title).toLowerCase())
                || { title, dataKey: '' };
        };

        const getBatchThumbnailUrl = (dataKeyOrTitle = '') => {
            const key = String(dataKeyOrTitle || '').toLowerCase();
            const source = getGatewayBatchSources().find(item =>
                item.dataKey === dataKeyOrTitle ||
                item.title === dataKeyOrTitle ||
                item.title.toLowerCase() === key
            );
            const dataKey = (source && source.dataKey) || dataKeyOrTitle;
            const imageMap = {
                dataClass13: (document.querySelector('#gatewayBatchCard img') && document.querySelector('#gatewayBatchCard img').src) || 'https://www.image2url.com/r2/default/images/1776470092513-1033b344-25d1-4b03-a148-0d4ee9e71ddb.webp',
                dataClass11: (document.querySelector('#apnaCollegeBatchCard img') && document.querySelector('#apnaCollegeBatchCard img').src) || 'https://www.image2url.com/r2/default/images/1776470194797-536bb3c6-3692-4a7f-a090-496028f4b395.jpg',
                dataClass101: (document.querySelector('#chaiaurcodeBatchCard img') && document.querySelector('#chaiaurcodeBatchCard img').src) || 'https://www.image2url.com/r2/default/images/1776470301414-0174d86c-2568-43db-b56b-e9030e9d9f0d.png',
                dataClass114: (document.querySelector('#codewithharryBatchCard img') && document.querySelector('#codewithharryBatchCard img').src) || 'https://www.image2url.com/r2/default/images/1776470471033-4af32288-22ec-452b-b10f-bf8fb80637c6.jpg',
                dataClass102: 'image/supreme.jpg',
                dataClass103: 'image/rajaa.jpg',
                dataClass104: 'image/poh.png',
                dataClass105: 'image/pwskill.jpg',
                dataClass106: 'image/keerti.jpg',
                dataClass107: 'image/fmf.jpg',
                dataClass108: 'image/udemy.jpg',
                dataClass109: 'image/trading.jpg',
                dataClass110: 'image/devops.png',
                dataClass111: 'image/cohort.jpg',
                dataClass112: 'image/Shreyansh.webp',
                dataClass113: 'image/college.jpg',
                dataClass115: 'image/adca.jpg',
                dataClass116: 'image/ineuron.jpg',
                dataClass17: 'image/chai.jpg',
                dataClass14: 'image/dropshipping.jpg',
                dataClass15: 'image/jasonfedin.jpg',
                dataClass202: 'image/gw.jpg',
                dataClass201: 'image/EARNERS.jpg',
            };
            return imageMap[dataKey] || '';
        };

        const getBatchThumbBackground = (dataKeyOrTitle = '') => {
            const url = getBatchThumbnailUrl(dataKeyOrTitle);
            return url
                ? `linear-gradient(180deg,rgba(5,8,18,0.1),rgba(5,8,18,0.55)),url('${String(url).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}') center/cover no-repeat`
                : 'linear-gradient(45deg,var(--neon-blue),var(--neon-purple))';
        };

        const getCleanBatchThumbBackground = (dataKeyOrTitle = '') => {
            const url = getBatchThumbnailUrl(dataKeyOrTitle);
            return url
                ? `url('${String(url).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}') center/contain no-repeat`
                : 'linear-gradient(45deg,var(--neon-blue),var(--neon-purple))';
        };

        const ensurePopularBatchCards = () => {
            const grid = document.querySelector('.batch-grid');
            if (!grid) return;
            const existingKeys = new Set(
                [...grid.querySelectorAll('.enroll-batch-btn')]
                    .map((btn) => btn.dataset.batchKey)
                    .filter(Boolean)
            );
            getGatewayBatchSources().forEach((source) => {
                if (!source || !source.dataKey || existingKeys.has(source.dataKey)) return;
                const card = document.createElement('div');
                card.className = 'batch-card';
                card.dataset.batchKey = source.dataKey;
                card.dataset.batchTitle = source.title;
                const imageUrl = getBatchThumbnailUrl(source.dataKey);
                card.innerHTML = `
                    <div class="batch-image">
                        ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(source.title)}">` : `<div style="height:100%;background:${getCleanBatchThumbBackground(source.dataKey)};"></div>`}
                    </div>
                    <div class="batch-details">
                        <h3 class="batch-title">${escapeHtml(source.title)}</h3>
                        <p class="batch-instructor">${escapeHtml(source.instructor || 'CODExTRMS Batch')}</p>
                        <div class="batch-meta">
                            <span><i class="fas fa-book-open"></i> Explore</span>
                            <button class="batch-btn enroll-batch-btn" data-batch-key="${escapeHtml(source.dataKey)}">Enroll Now</button>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
                existingKeys.add(source.dataKey);
            });
        };

        const hydrateBatchThumbnails = () => {
            document.querySelectorAll('.batch-image img').forEach((img) => {
                const wrap = img.closest('.batch-image');
                if (!wrap || !img.getAttribute('src')) return;
                const safeUrl = String(img.getAttribute('src')).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                wrap.style.setProperty('--batch-thumb', `url('${safeUrl}')`);
            });
        };

        const readEnrolledBatches = () => {
            try {
                return JSON.parse(localStorage.getItem(ENROLLED_BATCHES_KEY) || '[]');
            } catch {
                return [];
            }
        };

        const saveEnrolledBatches = (items) => {
            localStorage.setItem(ENROLLED_BATCHES_KEY, JSON.stringify(items));
        };

        const readJson = (key, fallback) => {
            try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
            catch { return fallback; }
        };

        const saveJson = (key, value) => {
            try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
        };

        const buildCatalogSnapshot = () => {
            const batches = {};
            getGatewayBatchSources().forEach((source) => {
                const data = window[source.dataKey] || [];
                if (!Array.isArray(data) || data.length === 0) return;
                batches[source.dataKey] = {
                    title: source.title,
                    subjects: data.map((subject, index) => ({
                        index,
                    name: (subject && subject.batch_name) || `Subject ${index + 1}`
                    }))
                };
            });
            return { updatedAt: Date.now(), batches };
        };

        const detectCatalogNotifications = () => {
            const current = buildCatalogSnapshot();
            const previous = readJson(CATALOG_SNAPSHOT_KEY, null);
            if (!previous || !previous.batches) {
                saveJson(CATALOG_SNAPSHOT_KEY, current);
                return;
            }

            Object.entries(current.batches).forEach(([dataKey, batch]) => {
                const oldBatch = previous.batches[dataKey];
                if (!oldBatch) {
                    if (typeof window.addNotification === 'function') window.addNotification('New batch added', `${batch.title} add hua hai.`);
                    return;
                }

                const oldSubjectNames = new Set((oldBatch.subjects || []).map(item => String(item.name).trim().toLowerCase()));
                (batch.subjects || []).forEach((subject) => {
                    const subjectName = String(subject.name || '').trim();
                    if (subjectName && !oldSubjectNames.has(subjectName.toLowerCase())) {
                        if (typeof window.addNotification === 'function') window.addNotification('New subject added', `${subjectName} - ${batch.title}`);
                    }
                });
            });

            saveJson(CATALOG_SNAPSHOT_KEY, current);
        };

        const getLectureProgress = (videoId) => {
            const progress = readJson(LECTURE_PROGRESS_KEY, {});
            return videoId ? progress[String(videoId)] || null : null;
        };

        const saveLectureProgress = (videoId, data) => {
            if (!videoId) return;
            const progress = readJson(LECTURE_PROGRESS_KEY, {});
            progress[String(videoId)] = { ...progress[String(videoId)], ...data, updatedAt: Date.now() };
            saveJson(LECTURE_PROGRESS_KEY, progress);
        };

        const getVideoCommentKey = (channelId, videoId) => `${channelId || 'channel'}:${videoId || 'video'}`;

        const readVideoComments = (key) => readJson(VIDEO_COMMENTS_KEY, {})[key] || [];

        const saveVideoComments = (key, comments) => {
            const all = readJson(VIDEO_COMMENTS_KEY, {});
            all[key] = comments;
            saveJson(VIDEO_COMMENTS_KEY, all);
        };

        const updateStudyStats = (seconds) => {
            const today = new Date().toISOString().slice(0, 10);
            const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
            const stats = readJson(STUDY_STATS_KEY, { totalSeconds: 0, todaySeconds: 0, streak: 0, lastDate: '' });
            if (stats.lastDate !== today) {
                stats.streak = stats.lastDate === yesterday ? (Number(stats.streak) || 0) + 1 : 1;
                stats.todaySeconds = 0;
                stats.lastDate = today;
            }
            stats.totalSeconds = (Number(stats.totalSeconds) || 0) + seconds;
            stats.todaySeconds = (Number(stats.todaySeconds) || 0) + seconds;
            saveJson(STUDY_STATS_KEY, stats);
            if (typeof renderStudyStats === 'function') renderStudyStats();
        };

        const getBatchProgress = (data = []) => {
            const completed = getCompletedLectureIds();
            const lectures = data.flatMap(subject => subject.chapters || []).flatMap(chapter => chapter.lectures || []);
            const total = lectures.filter(lecture => lecture.video_id).length;
            const done = lectures.filter(lecture => lecture.video_id && completed.includes(String(lecture.video_id))).length;
            return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
        };

        const getSubjectProgress = (subject) => {
            const completed = getCompletedLectureIds();
            const lectures = ((subject && subject.chapters) || []).flatMap(chapter => chapter.lectures || []);
            const total = lectures.filter(lecture => lecture.video_id).length;
            const done = lectures.filter(lecture => lecture.video_id && completed.includes(String(lecture.video_id))).length;
            return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
        };

        const saveRecentSubject = (source, subjectIndex, subject) => {
            if (!source || !source.dataKey || !subject) return;
            const recent = readJson(RECENT_SUBJECTS_KEY, []).filter(item => !(item.dataKey === source.dataKey && item.subjectIndex === subjectIndex));
            recent.unshift({
                dataKey: source.dataKey,
                title: source.title,
                subjectIndex,
                subjectTitle: subject.batch_name || 'Subject',
                timestamp: Date.now()
            });
            saveJson(RECENT_SUBJECTS_KEY, recent.slice(0, 8));
            if (typeof renderRecentSubjects === 'function') renderRecentSubjects();
        };

        const togglePinnedBatch = (dataKey) => {
            const pinned = readJson(PINNED_BATCHES_KEY, []);
            const next = pinned.includes(dataKey) ? pinned.filter(item => item !== dataKey) : [dataKey, ...pinned];
            saveJson(PINNED_BATCHES_KEY, next);
            if (typeof renderPinnedBatches === 'function') renderPinnedBatches();
            showMiniToast(pinned.includes(dataKey) ? 'Batch unpinned.' : 'Batch pinned.');
        };

        const showMiniToast = (message) => {
            const oldToast = document.getElementById('miniToast');
            if (oldToast) oldToast.remove();
            const toast = document.createElement('div');
            toast.id = 'miniToast';
            toast.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:linear-gradient(45deg,var(--neon-blue),var(--neon-pink));color:#000;padding:10px 18px;border-radius:999px;font-weight:800;font-size:0.85rem;z-index:999999;box-shadow:0 10px 30px rgba(0,0,0,0.35);';
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2200);
        };

        const enrollBatch = (dataKey) => {
            const source = getGatewayBatchSources().find(item => item.dataKey === dataKey);
            if (!source) return;

            const enrolled = readEnrolledBatches();
            if (enrolled.includes(dataKey)) {
                saveEnrolledBatches(enrolled.filter(item => item !== dataKey));
                showMiniToast('Batch Favorites se remove ho gaya.');
            } else {
                enrolled.unshift(dataKey);
                saveEnrolledBatches(enrolled);
                showMiniToast('Batch Favorites mein add ho gaya!');
            }
            updateEnrollButtons();
            if (typeof renderPinnedBatches === 'function') renderPinnedBatches();
        };

        const updateEnrollButtons = () => {
            const enrolled = readEnrolledBatches();
            document.querySelectorAll('.enroll-batch-btn').forEach((btn) => {
                const isEnrolled = enrolled.includes(btn.dataset.batchKey);
                btn.textContent = isEnrolled ? 'Unenroll' : 'Enroll Now';
                btn.classList.toggle('is-enrolled', isEnrolled);
            });
        };

        const updatePinButtons = () => {
            const pinned = readJson(PINNED_BATCHES_KEY, []);
            document.querySelectorAll('.pin-batch-btn').forEach((btn) => {
                const isPinned = pinned.includes(btn.dataset.batchKey);
                btn.textContent = isPinned ? 'Pinned' : 'Pin';
                btn.classList.toggle('is-enrolled', isPinned);
            });
        };

        const saveGatewayViewState = (isOpen = true) => {
            if (isRestoringGatewayState || !currentBatchTitle) return;
            try {
                localStorage.setItem(GATEWAY_VIEW_STATE_KEY, JSON.stringify({
                    isOpen,
                    title: currentBatchTitle,
                    dataKey: currentBatchDataKey,
                    subjectIndex: selectedSubjectIndex,
                    chapterIndex: selectedChapterIndex,
                    channelId: selectedChannelId,
                    updatedAt: Date.now()
                }));
                updateUrlState();
            } catch {}
        };

        const updateUrlState = () => {
            const modal = document.getElementById('videoModal');
            const isVideoOpen = modal && modal.style.display === 'flex';
            const batchModal = document.getElementById('batchDataModal');
            const isBatchOpen = batchModal && batchModal.classList.contains('active');
            const frameModal = document.getElementById('apnaCollegeFrameModal');
            const isFrameOpen = frameModal && frameModal.style.display === 'flex';
            let url = window.location.pathname;

            if (isFrameOpen) {
                url += '?batch=dataClass11';
            } else if (isBatchOpen) {
                const params = new URLSearchParams();
                if (currentBatchDataKey) params.set('batch', currentBatchDataKey);
                if (selectedSubjectIndex >= 0) params.set('subject', selectedSubjectIndex);
                if (selectedChapterIndex >= 0) params.set('chapter', selectedChapterIndex);

                if (isVideoOpen) {
                    const lastVideo = JSON.parse(sessionStorage.getItem('last_video') || '{}');
                    if (lastVideo.videoId) {
                        params.set('video', lastVideo.videoId);
                    }
                }
                url += '?' + params.toString();
            }

            const currentSearch = window.location.search;
            const targetSearch = url.includes('?') ? url.substring(url.indexOf('?')) : '';
            if (currentSearch !== targetSearch) {
                window.history.pushState(null, '', url);
            }
        };

        const restoreUrlState = () => {
            const params = new URLSearchParams(window.location.search);
            const batchKey = params.get('batch');
            const subjectIndexStr = params.get('subject');
            const chapterIndexStr = params.get('chapter');
            const videoId = params.get('video');

            if (!batchKey) return;

            if (batchKey === 'dataClass11') {
                openApnaCollegeIframe();
                return;
            }

            const source = getGatewayBatchSources().find(item => item.dataKey === batchKey);
            if (!source) return;

            const data = window[source.dataKey] || [];
            if (!Array.isArray(data) || data.length === 0) return;

            currentBatchData = data;
            currentBatchDataKey = source.dataKey;
            currentBatchTitle = source.title;
            selectedChannelId = source.channelId || '-1003345907635';

            const subIdx = subjectIndexStr !== null ? parseInt(subjectIndexStr) : -1;
            const chapIdx = chapterIndexStr !== null ? parseInt(chapterIndexStr) : -1;

            selectedSubjectIndex = subIdx;
            selectedChapterIndex = chapIdx;

            // Mark batchDataModal as active before rendering
            const batchDataModal = document.getElementById('batchDataModal');
            const overlay = document.getElementById('overlay');
            if (batchDataModal) {
                batchDataModal.classList.add('active');
                if (overlay) overlay.style.display = 'block';

                if (subIdx >= 0 && subIdx < data.length) {
                    selectedSubject = data[subIdx];
                    renderChapters(selectedSubject, subIdx);

                    const chapters = selectedSubject.chapters || [];
                    if (chapIdx >= 0 && chapIdx < chapters.length) {
                        selectedChapter = chapters[chapIdx];
                        renderChapterDetails(selectedChapter, chapIdx);

                        if (videoId && selectedChapter.lectures) {
                            const lecture = selectedChapter.lectures.find(l => String(l.videoId) === String(videoId));
                            if (lecture) {
                                openPremiumVideo(lecture.videoId, lecture.title || 'Video', selectedChapter);
                            }
                        }
                    }
                } else {
                    renderSubjects(data, source.title);
                }
            }
        };
        const openApnaCollegeIframe = () => {
            let frameModal = document.getElementById('apnaCollegeFrameModal');
            if (!frameModal) {
                frameModal = document.createElement('div');
                frameModal.id = 'apnaCollegeFrameModal';
                frameModal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#0b0f19;z-index:999999;display:flex;flex-direction:column;animation:fadeIn 0.3s ease;';
                
                // Header bar with back/close button
                const header = document.createElement('div');
                header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 24px;background:#0d1527;border-bottom:1px solid rgba(255,255,255,0.06);height:60px;box-sizing:border-box;';
                header.innerHTML = `
                    <div style="display:flex;align-items:center;gap:12px;">
                        <button id="closeApnaFrameBtn" style="background:transparent;border:none;color:#fff;font-size:0.9rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:6px;transition:all 0.2s;"><i class="fas fa-chevron-left"></i> BACK</button>
                        <span style="color:#fff;font-family:\'Poppins\',sans-serif;font-weight:700;font-size:1.1rem;letter-spacing:0.5px;">APNA COLLEGE</span>
                    </div>
                    <div style="color:var(--neon-blue,#00f0ff);font-family:\'Poppins\',sans-serif;font-weight:700;font-size:0.75rem;letter-spacing:1px;text-transform:uppercase;background:rgba(0,240,255,0.06);padding:4px 12px;border-radius:999px;border:1px solid rgba(0,240,255,0.15);">Integrated View</div>
                `;
                frameModal.appendChild(header);

                // Loader spinner for iframe loading state
                const spinner = document.createElement('div');
                spinner.id = 'apnaFrameSpinner';
                spinner.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1000000;display:flex;flex-direction:column;align-items:center;gap:16px;';
                spinner.innerHTML = `
                    <div style="width:50px;height:50px;border:4px solid rgba(255,255,255,0.1);border-top:4px solid var(--neon-blue,#00f0ff);border-radius:50%;animation:spin 1s linear infinite;box-shadow:0 0 15px rgba(0,240,255,0.3);"></div>
                    <div style="color:#fff;font-size:0.85rem;font-family:\'Poppins\',sans-serif;animation:pulse 1.5s infinite;">Loading secure learning space...</div>
                `;
                frameModal.appendChild(spinner);

                // Iframe element
                const iframe = document.createElement('iframe');
                iframe.src = '/apna-college-frame/';
                iframe.style.cssText = 'flex:1;width:100%;height:calc(100% - 60px);border:none;background:#0b0f19;opacity:0;transition:opacity 0.4s ease;';
                iframe.onload = () => {
                    spinner.style.display = 'none';
                    iframe.style.opacity = '1';
                };
                frameModal.appendChild(iframe);

                document.body.appendChild(frameModal);

                // Back button click listener
                frameModal.querySelector('#closeApnaFrameBtn').addEventListener('click', () => {
                    frameModal.style.display = 'none';
                    iframe.src = 'about:blank';
                    updateUrlState();
                });
                
                // Add hover effect style to BACK button
                const backBtn = frameModal.querySelector('#closeApnaFrameBtn');
                backBtn.addEventListener('mouseenter', () => { backBtn.style.background = 'rgba(255,255,255,0.06)'; });
                backBtn.addEventListener('mouseleave', () => { backBtn.style.background = 'transparent'; });
            } else {
                frameModal.style.display = 'flex';
                const spinner = frameModal.querySelector('#apnaFrameSpinner');
                const iframe = frameModal.querySelector('iframe');
                if (spinner) spinner.style.display = 'flex';
                if (iframe) {
                    iframe.style.opacity = '0';
                    iframe.src = '/apna-college-frame/';
                }
            }
            updateUrlState();
        };
        window.openApnaCollegeIframe = openApnaCollegeIframe;

        // Export restoreUrlState to window so DOMContentLoaded can trigger it
        window.__restoreUrlState = restoreUrlState;
        window.__updateUrlState = updateUrlState;

        const restoreGatewayViewState = ({ showModal = true } = {}) => {
            try {
                const saved = JSON.parse(localStorage.getItem(GATEWAY_VIEW_STATE_KEY) || 'null');
                if (!saved || !saved.isOpen) return false;

                const source = saved.dataKey
                    ? getGatewayBatchSources().find(item => item.dataKey === saved.dataKey)
                    : getGatewayBatchSources().find(item => item.title === saved.title);
                const data = source ? (window[source.dataKey] || []) : [];
                if (!Array.isArray(data) || data.length === 0) return false;

                isRestoringGatewayState = true;
                currentBatchData = data;
                currentBatchDataKey = source.dataKey;
                currentBatchTitle = saved.title || source.title;
                subjectSearchTerm = '';
                subjectTab = 'all';
                if (subjectSearchInput) subjectSearchInput.value = '';

                const subjectIndex = Number.isInteger(saved.subjectIndex) ? saved.subjectIndex : -1;
                const chapterIndex = Number.isInteger(saved.chapterIndex) ? saved.chapterIndex : -1;
                const subject = subjectIndex >= 0 ? data[subjectIndex] : null;
                const chapter = subject && chapterIndex >= 0 ? (subject.chapters || [])[chapterIndex] : null;

                if (chapter) {
                    renderChapters(subject, subjectIndex);
                    renderChapterDetails(chapter, chapterIndex);
                } else if (subject) {
                    renderChapters(subject, subjectIndex);
                } else {
                    renderSubjects(data, currentBatchTitle);
                }

                if (showModal) {
                    batchDataModal.classList.add('active');
                    overlay.style.display = 'block';
                }
                isRestoringGatewayState = false;
                return true;
            } catch (e) {
                isRestoringGatewayState = false;
                console.warn('Gateway state restore failed:', e);
                return false;
            }
        };

        const getSubjectBadge = (name = '') => {
            const n = name.toLowerCase();
            if (n.includes('physics')) return { text: 'PHY', color: '#3b82f6' };
            if (n.includes('math')) return { text: 'MAT', color: '#ef4444' };
            if (n.includes('chem')) return { text: 'CHE', color: '#10b981' };
            if (n.includes('electrical')) return { text: 'ENG', color: '#f59e0b' };
            if (n.includes('electronics')) return { text: 'ENG', color: '#22c55e' };
            if (n.includes('soft')) return { text: 'SOF', color: '#a855f7' };
            return { text: 'SUB', color: '#00F0FF' };
        };

        const updateSubjectTabUi = () => {
            if (!allSubjectsTabBtn || !favoriteSubjectsTabBtn) return;
            const isAll = subjectTab === 'all';
            allSubjectsTabBtn.style.background = isAll ? 'linear-gradient(45deg, var(--neon-blue), var(--neon-pink))' : 'transparent';
            allSubjectsTabBtn.style.color = isAll ? 'black' : 'var(--text-primary)';
            allSubjectsTabBtn.style.border = isAll ? 'none' : '1px solid rgba(255,255,255,0.22)';
            favoriteSubjectsTabBtn.style.background = !isAll ? 'linear-gradient(45deg, var(--neon-blue), var(--neon-pink))' : 'transparent';
            favoriteSubjectsTabBtn.style.color = !isAll ? 'black' : 'var(--text-primary)';
            favoriteSubjectsTabBtn.style.border = !isAll ? 'none' : '1px solid rgba(255,255,255,0.22)';
        };

        const renderSubjects = (data, title) => {
            batchDataTitle.textContent = title;
            if (subjectSearchInput) subjectSearchInput.placeholder = 'Search subjects...';
            backToSubjectsBtn.style.display = 'none';
            if (subjectControls) subjectControls.style.display = 'flex';
            // All Subjects / Favorites tabs wapas show karo
    const subjectsTabRow = document.querySelector('#subjectPathStrip > div:last-child');
    if (subjectsTabRow) subjectsTabRow.style.display = 'flex';
            if (subjectPathLabel) subjectPathLabel.textContent = title;
            selectedSubject = null;
            selectedChapter = null;
            selectedSubjectIndex = -1;
            selectedChapterIndex = -1;
            selectedChannelId = '-1003345907635';
            updateSubjectTabUi();
            saveGatewayViewState(true);

            const filteredSubjects = data.filter((subject, index) => {
                const subjectName = (subject.batch_name || '').toLowerCase();
                const matchesSearch = !subjectSearchTerm || subjectName.includes(subjectSearchTerm);
                const isFavorite = favoriteSubjects.includes(index);
                if (subjectTab === 'fav') return matchesSearch && isFavorite;
                return matchesSearch;
            });
            const completedLectureIds = getCompletedLectureIds();

            const subjectHtml = filteredSubjects.map((subject) => {
                const index = data.indexOf(subject);
                const chapterCount = Array.isArray(subject.chapters) ? subject.chapters.length : 0;
                const isFavorite = favoriteSubjects.includes(index);
                const badge = getSubjectBadge(subject.batch_name || '');
                const lectures = (subject.chapters || []).flatMap((chapter) => chapter.lectures || []);
                const totalLectures = lectures.length;
                const doneLectures = lectures.filter((lecture) => lecture.video_id && completedLectureIds.includes(String(lecture.video_id))).length;
                const progressPercent = totalLectures > 0 ? Math.round((doneLectures / totalLectures) * 100) : 0;
                return `
                    <div class="gateway-subject-item" data-subject-index="${index}" style="margin-bottom:12px; padding:12px; border-radius:10px; background:rgba(255,255,255,0.08); cursor:pointer; display:flex; align-items:center; gap:10px;">
                        <div style="width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; color:${badge.color}; background:rgba(255,255,255,0.04); border:1px solid ${badge.color}55;">
                            ${badge.text}
                        </div>
                        <div style="flex:1; min-width:0;">
                            <div style="font-weight:600; white-space: normal;">${subject.batch_name || 'Untitled subject'}</div>
                            <div style="font-size:0.82rem; opacity:0.8; margin-top:3px;">${chapterCount} Chapters • ${doneLectures}/${totalLectures} Done</div>
                            <div style="height:4px; margin-top:8px; border-radius:10px; background:rgba(255,255,255,0.12); overflow:hidden;">
                                <div style="width:${progressPercent}%; height:100%; background:#ff4d6d;"></div>
                            </div>
                        </div>
                        <div>
                            <button class="gateway-subject-favorite-btn" data-subject-index="${index}" style="background:none; border:none; color:${isFavorite ? '#ff4d6d' : 'rgba(255,255,255,0.7)'}; cursor:pointer; font-size:1rem;">
                                <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            batchDataContent.innerHTML = subjectHtml || '<p style="margin:0;">No subjects found.</p>';

            // Attach scoped click handlers to subject items to reliably open chapters
            setTimeout(() => {
                const items = batchDataContent.querySelectorAll('.gateway-subject-item');
                items.forEach(item => {
                    // avoid duplicate handlers
                    if (item._subClickHandler) item.removeEventListener('click', item._subClickHandler);
                    const handler = (e) => {
                        e.stopPropagation();
                        const subjectIndex = Number(item.dataset.subjectIndex);
                        const clickedSubject = currentBatchData[subjectIndex];
                        if (!clickedSubject) return;
                        renderChapters(clickedSubject, subjectIndex);
                    };
                    item._subClickHandler = handler;
                    item.addEventListener('click', handler);
                });
            }, 0);
        
        };

        const FAVORITE_CHAPTERS_KEY = 'gateway_favorite_chapters';
let favoriteChapters = JSON.parse(localStorage.getItem(FAVORITE_CHAPTERS_KEY) || '[]');

const renderChapters = (subject, subjectIndex = -1) => {
    batchDataTitle.textContent = subject.batch_name || 'Subject';
    if (subjectSearchInput) subjectSearchInput.placeholder = 'Search chapters...';
    backToSubjectsBtn.style.display = 'flex';
    if (subjectControls) subjectControls.style.display = 'none';
    if (subjectPathLabel) subjectPathLabel.textContent = subject.batch_name || 'Subject';
    // All Subjects / Favorites tabs hide karo chapter view mein
    const subjectsTabRow = document.querySelector('#subjectPathStrip > div:last-child');
    if (subjectsTabRow) subjectsTabRow.style.display = 'none';
    selectedSubject = subject;
    selectedChapter = null;
    selectedSubjectIndex = subjectIndex;
    selectedChapterIndex = -1;
    selectedChannelId = subject.channel_id || '-1003345907635';
    saveRecentSubject(resolveGatewayBatchSource(currentBatchData, currentBatchTitle), subjectIndex, subject);
    saveGatewayViewState(true);

    const chapters = subject.chapters || [];
    const completedLectureIds = getCompletedLectureIds();

    const chapterHtml = `
        <div style="display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap;">
            <button id="chaptersTabBtn" style="padding:6px 16px; border-radius:999px; border:none; background:linear-gradient(45deg,var(--neon-blue),var(--neon-pink)); color:#000; font-weight:600; cursor:pointer; font-size:0.82rem;">Chapters</button>
            <button id="favChaptersTabBtn" style="padding:6px 16px; border-radius:999px; border:1px solid rgba(255,255,255,0.22); background:transparent; color:var(--text-primary); font-weight:600; cursor:pointer; font-size:0.82rem;">Favorites ❤️</button>
            <button id="studyMaterialTabBtn" style="padding:6px 16px; border-radius:999px; border:1px solid rgba(255,255,255,0.22); background:transparent; color:var(--text-primary); font-weight:600; cursor:pointer; font-size:0.82rem;">Study Material</button>
        </div>
        <div id="chapterCardsContainer" style="display:flex; gap:12px; flex-wrap:wrap;"></div>
    `;

    batchDataContent.innerHTML = chapterHtml;

    let currentChapterTab = 'all';

    const renderChapterCards = (filter = 'all') => {
        const container = document.getElementById('chapterCardsContainer');
        if (!container) return;

        const chapterKey = `${subjectIndex}`;
        const filtered = chapters.filter((_, i) => {
            if (filter === 'fav') return favoriteChapters.includes(`${chapterKey}_${i}`);
            return true;
        });

        if (filtered.length === 0) {
            container.innerHTML = '<p style="color:var(--text-secondary); font-size:0.9rem;">No chapters found.</p>';
            return;
        }

        container.innerHTML = filtered.map((chapter) => {
            const realIndex = chapters.indexOf(chapter);
            const favKey = `${chapterKey}_${realIndex}`;
            const isFav = favoriteChapters.includes(favKey);
            const lectures = Array.isArray(chapter.lectures) ? chapter.lectures : [];
            const totalLec = lectures.length;
            const doneLec = lectures.filter(l => l.video_id && completedLectureIds.includes(String(l.video_id))).length;
            const chNum = String(realIndex + 1).padStart(2, '0');

            return `
                <div class="gateway-chapter-item" data-chapter-index="${realIndex}"
                    style="width:160px; min-width:140px; flex-shrink:0; border-radius:14px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); padding:14px 12px; cursor:pointer; position:relative; transition: transform 0.15s, border-color 0.15s;"
                    onmouseover="this.style.transform='translateY(-2px)';this.style.borderColor='rgba(0,240,255,0.35)'"
                    onmouseout="this.style.transform='';this.style.borderColor='rgba(255,255,255,0.1)'">

                    <button class="chapter-fav-btn" data-fav-key="${favKey}"
                        style="position:absolute; top:10px; right:10px; background:none; border:none; cursor:pointer; font-size:0.95rem; color:${isFav ? '#ff4d6d' : 'rgba(255,255,255,0.4)'}; padding:0; line-height:1;"
                        onclick="event.stopPropagation()">
                        <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
                    </button>

                    <div style="font-size:0.72rem; font-weight:700; color:var(--neon-blue); letter-spacing:1px; margin-bottom:8px;">CH — ${chNum}</div>

                    <div style="font-weight:600; font-size:0.88rem; line-height:1.3; margin-bottom:10px; padding-right:18px;">${chapter.chapter_name || 'Untitled'}</div>

                    <div style="font-size:0.78rem; color:var(--text-secondary); display:flex; align-items:center; gap:4px; margin-bottom:6px;">
                        <i class="fas fa-clock" style="font-size:0.7rem;"></i> ${totalLec} Lectures
                    </div>

                    <div style="font-size:0.78rem; font-weight:600; color:var(--neon-blue);">${doneLec}/${totalLec} Done</div>

                    <div style="height:3px; margin-top:8px; border-radius:999px; background:rgba(255,255,255,0.1); overflow:hidden;">
                        <div style="width:${totalLec > 0 ? Math.round((doneLec/totalLec)*100) : 0}%; height:100%; background:linear-gradient(90deg,var(--neon-blue),var(--neon-pink));"></div>
                    </div>
                </div>
            `;
        }).join('');

        // Fav button listeners
        container.querySelectorAll('.chapter-fav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const favKey = btn.dataset.favKey;
                const idx = favoriteChapters.indexOf(favKey);
                if (idx >= 0) favoriteChapters.splice(idx, 1);
                else favoriteChapters.push(favKey);
                localStorage.setItem(FAVORITE_CHAPTERS_KEY, JSON.stringify(favoriteChapters));
                renderChapterCards(currentChapterTab);
            });
        });
    };

    renderChapterCards('all');

    setTimeout(() => {
        const chaptersTabBtn = document.getElementById('chaptersTabBtn');
        if (chaptersTabBtn) chaptersTabBtn.addEventListener('click', () => {
            currentChapterTab = 'all';
            document.getElementById('chaptersTabBtn').style.background = 'linear-gradient(45deg,var(--neon-blue),var(--neon-pink))';
            document.getElementById('chaptersTabBtn').style.color = '#000';
            document.getElementById('chaptersTabBtn').style.border = 'none';
            document.getElementById('favChaptersTabBtn').style.background = 'transparent';
            document.getElementById('favChaptersTabBtn').style.color = 'var(--text-primary)';
            document.getElementById('favChaptersTabBtn').style.border = '1px solid rgba(255,255,255,0.22)';
            document.getElementById('studyMaterialTabBtn').style.background = 'transparent';
            document.getElementById('studyMaterialTabBtn').style.color = 'var(--text-primary)';
            document.getElementById('studyMaterialTabBtn').style.border = '1px solid rgba(255,255,255,0.22)';
            renderChapterCards('all');
        });

        const favChaptersTabBtn = document.getElementById('favChaptersTabBtn');
        if (favChaptersTabBtn) favChaptersTabBtn.addEventListener('click', () => {
            currentChapterTab = 'fav';
            document.getElementById('favChaptersTabBtn').style.background = 'linear-gradient(45deg,var(--neon-blue),var(--neon-pink))';
            document.getElementById('favChaptersTabBtn').style.color = '#000';
            document.getElementById('favChaptersTabBtn').style.border = 'none';
            document.getElementById('chaptersTabBtn').style.background = 'transparent';
            document.getElementById('chaptersTabBtn').style.color = 'var(--text-primary)';
            document.getElementById('chaptersTabBtn').style.border = '1px solid rgba(255,255,255,0.22)';
            document.getElementById('studyMaterialTabBtn').style.background = 'transparent';
            document.getElementById('studyMaterialTabBtn').style.color = 'var(--text-primary)';
            document.getElementById('studyMaterialTabBtn').style.border = '1px solid rgba(255,255,255,0.22)';
            renderChapterCards('fav');
        });

        const studyMaterialTabBtn = document.getElementById('studyMaterialTabBtn');
        if (studyMaterialTabBtn) studyMaterialTabBtn.addEventListener('click', () => {
            currentChapterTab = 'material';
            document.getElementById('studyMaterialTabBtn').style.background = 'linear-gradient(45deg,var(--neon-blue),var(--neon-pink))';
            document.getElementById('studyMaterialTabBtn').style.color = '#000';
            document.getElementById('studyMaterialTabBtn').style.border = 'none';
            document.getElementById('chaptersTabBtn').style.background = 'transparent';
            document.getElementById('chaptersTabBtn').style.color = 'var(--text-primary)';
            document.getElementById('chaptersTabBtn').style.border = '1px solid rgba(255,255,255,0.22)';
            document.getElementById('favChaptersTabBtn').style.background = 'transparent';
            document.getElementById('favChaptersTabBtn').style.color = 'var(--text-primary)';
            document.getElementById('favChaptersTabBtn').style.border = '1px solid rgba(255,255,255,0.22)';
            document.getElementById('chapterCardsContainer').innerHTML = '<p style="color:var(--text-secondary); font-size:0.9rem;">No Study Material uploaded yet.</p>';
        });
    }, 0);

};

const renderChapterDetails = (chapter, chapterIndex = -1) => {
    selectedChapter = chapter;
    selectedChapterIndex = chapterIndex;
    batchDataTitle.textContent = chapter.chapter_name || 'Chapter';
    if (subjectSearchInput) subjectSearchInput.placeholder = 'Search lectures in this subject...';
    saveGatewayViewState(true);
    backToSubjectsBtn.style.display = 'flex';
    if (subjectControls) subjectControls.style.display = 'none';
    if (subjectPathLabel) subjectPathLabel.textContent = chapter.chapter_name || 'Chapter';

    const lectures = Array.isArray(chapter.lectures) ? chapter.lectures : [];
    const videoLectures = lectures.filter(lecture => lecture.video_id);
    const noteLectures = lectures.filter(lecture => lecture.notes_id);
    const dpps = Array.isArray(chapter.dpps) ? chapter.dpps : [];
    const sheets = Array.isArray(chapter.sheets) ? chapter.sheets : [];
    const completedIds = getCompletedLectureIds();
    const availableLectureTabs = [
        videoLectures.length ? { key: 'videos', label: 'Videos' } : null,
        noteLectures.length ? { key: 'notes', label: 'Notes' } : null,
        dpps.length ? { key: 'dpps', label: 'DPPs' } : null,
        sheets.length ? { key: 'sheets', label: 'Sheets' } : null
    ].filter(Boolean);

    // Tab state
    let activeTab = (availableLectureTabs[0] && availableLectureTabs[0].key) || 'videos';

    const renderTab = (tab) => {
        activeTab = tab;

        // Tab button styles update
        availableLectureTabs.forEach(({ key: t }) => {
            const btn = document.getElementById(`lec-tab-${t}`);
            if (!btn) return;
            btn.style.background = t === tab ? 'linear-gradient(45deg,var(--neon-blue),var(--neon-pink))' : 'transparent';
            btn.style.color = t === tab ? '#000' : 'var(--text-primary)';
            btn.style.border = t === tab ? 'none' : '1px solid rgba(255,255,255,0.2)';
            btn.style.fontWeight = '600';
        });

        const listEl = document.getElementById('lec-list');
        if (!listEl) return;

        if (tab === 'videos') {
            if (videoLectures.length === 0) {
                listEl.innerHTML = '<p style="color:var(--text-secondary);">No lectures available.</p>';
                return;
            }
            listEl.innerHTML = videoLectures.map((lec, i) => {
                const lecId = String(lec.video_id);
                const isDone = completedIds.includes(lecId);
                const resume = getLectureProgress(lecId);
                const lecNum = String(i + 1).padStart(2, '0');
                const title = lec.title || `Lecture ${i + 1}`;
                const hasNotes = !!lec.notes_id;

                return `
                    <div class="gateway-lecture-item" data-video-id="${lecId || ''}" data-lecture-title="${title.replace(/"/g,'&quot;')}" style="display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:10px; background:rgba(255,255,255,0.05); margin-bottom:8px; border:1px solid rgba(255,255,255,${isDone ? '0.18' : '0.07'});">
                        
                        <button class="lec-done-btn" data-lec-id="${lecId || ''}"
                            style="background:none; border:none; cursor:pointer; font-size:1.1rem; flex-shrink:0; color:${isDone ? '#22c55e' : 'rgba(255,255,255,0.3)'}; padding:0;"
                            title="Mark as done">
                            <i class="${isDone ? 'fas' : 'far'} fa-check-circle"></i>
                        </button>

                        <div style="flex:1; min-width:0;">
                            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                <span style="font-size:0.7rem; font-weight:700; color:var(--neon-blue); background:rgba(0,240,255,0.1); padding:2px 8px; border-radius:4px; letter-spacing:1px; white-space:nowrap;">LEC — ${lecNum}</span>
                                <span style="font-size:0.88rem; font-weight:600; word-break:break-word;">${title}</span>
                                ${resume && resume.currentTime > 5 ? `<span style="font-size:0.68rem;color:#22c55e;background:rgba(34,197,94,0.12);padding:2px 8px;border-radius:999px;">Resume ${fmtTime(resume.currentTime)}</span>` : ''}
                            </div>
                           <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:3px;">
  <span id="dur-${lec.video_id}" style="opacity:0; transition:opacity 0.3s;">--:--</span>
</div>
                        </div>

                        <div style="display:flex; gap:6px; flex-shrink:0;">
                            <button class="lec-play-btn" data-video-id="${lec.video_id}" data-title="${title.replace(/"/g,'&quot;')}"
                                style="padding:6px 14px; border-radius:999px; border:none; background:linear-gradient(45deg,var(--neon-blue),var(--neon-pink)); color:#000; font-weight:700; font-size:0.78rem; cursor:pointer; display:flex; align-items:center; gap:4px;">
                                <i class="fas fa-play"></i> Play
                            </button>
                            ${hasNotes ? `
                            <button class="lec-pdf-btn" data-notes-id="${lec.notes_id}"
                                style="padding:6px 14px; border-radius:999px; border:1px solid rgba(255,255,255,0.25); background:transparent; color:var(--text-primary); font-weight:600; font-size:0.78rem; cursor:pointer;">
                                PDF
                            </button>` : ''}
                        </div>
                    </div>
                `;
            }).join('');

            // Play button listeners
            listEl.querySelectorAll('.lec-play-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const videoId = btn.dataset.videoId;
                    const title = btn.dataset.title;
                    batchDataModal.classList.remove('active');
openPremiumVideo(videoId, title, selectedChapter);
                });
            });

            // Duration fetch karo har lecture ke liye
listEl.querySelectorAll('.lec-play-btn').forEach(btn => {
  const videoId = btn.dataset.videoId;
  if (videoId) {
    fetchDurationAndShow(videoId, selectedChannelId);
  }
});
            // PDF button listeners
            listEl.querySelectorAll('.lec-pdf-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const notesId = btn.dataset.notesId;
                    const lectureRow = btn.closest('.gateway-lecture-item');
                    const rowTitle = (lectureRow && lectureRow.dataset.lectureTitle) || 'PDF Notes';
                    saveToDownloads(notesId, rowTitle, selectedChannelId, 'notes');
                    openPdfViewer(buildPdfUrl(selectedChannelId, notesId), rowTitle);
                });
            });

            // Mark done listeners
            listEl.querySelectorAll('.lec-done-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const lecId = btn.dataset.lecId;
                    if (!lecId) return;
                    let done = JSON.parse(localStorage.getItem('completed_lectures') || '[]').map(String);
                    const idx = done.indexOf(lecId);
                    if (idx >= 0) done.splice(idx, 1);
                    else done.push(lecId);
                    localStorage.setItem('completed_lectures', JSON.stringify(done));
                    renderTab('videos');
                });
            });

        } else if (tab === 'notes') {
            if (noteLectures.length === 0) {
                listEl.innerHTML = '<p style="color:var(--text-secondary);">No notes available.</p>';
                return;
            }
            listEl.innerHTML = noteLectures.map((lec, i) => `
    <div style="display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:10px; background:rgba(255,255,255,0.05); margin-bottom:8px;">
        <i class="fas fa-file-alt" style="color:var(--neon-blue); font-size:1.1rem; flex-shrink:0;"></i>
        <div style="flex:1; font-size:0.88rem; font-weight:600;">${lec.title || `Notes ${i+1}`}</div>
        <div style="display:flex; gap:6px;">
            <button onclick="openPdfViewer(buildPdfUrl('${selectedChannelId}','${lec.notes_id}'),'${(lec.title || `Notes ${i+1}`).replace(/'/g,"\\'")}')"
                style="padding:6px 14px; border-radius:999px; border:1px solid rgba(255,255,255,0.25); background:transparent; color:var(--text-primary); font-size:0.78rem; cursor:pointer; font-weight:600;">
                View
            </button>
            <button onclick="saveToDownloads('${lec.notes_id}','${(lec.title || `Notes ${i+1}`).replace(/'/g,"\\'")}','${selectedChannelId}','notes')"
                style="padding:6px 14px; border-radius:999px; border:none; background:linear-gradient(45deg,var(--neon-blue),var(--neon-pink)); color:#000; font-size:0.78rem; cursor:pointer; font-weight:700;">
                <i class="fas fa-download"></i>
            </button>
        </div>
    </div>
`).join('');

        } else if (tab === 'dpps') {
            if (dpps.length === 0) {
                listEl.innerHTML = '<p style="color:var(--text-secondary);">No DPPs available.</p>';
                return;
            }
           listEl.innerHTML = dpps.map((d, i) => `
    <div style="display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:10px; background:rgba(255,255,255,0.05); margin-bottom:8px;">
        <i class="fas fa-file-alt" style="color:var(--neon-blue); font-size:1.1rem; flex-shrink:0;"></i>
        <div style="flex:1; font-size:0.88rem; font-weight:600;">${d.title || `DPP ${i+1}`}</div>
        <div style="display:flex; gap:6px;">
            <button onclick="openPdfViewer(buildPdfUrl('${selectedChannelId}','${d.id || d.notes_id}'),'${(d.title || `DPP ${i+1}`).replace(/'/g,"\\'")}')"
                style="padding:6px 14px; border-radius:999px; border:1px solid rgba(255,255,255,0.25); background:transparent; color:var(--text-primary); font-size:0.78rem; cursor:pointer; font-weight:600;">
                View
            </button>
            <button onclick="saveToDownloads('${d.id || d.notes_id}','${(d.title || `DPP ${i+1}`).replace(/'/g,"\\'")}','${selectedChannelId}','dpp')"
                style="padding:6px 14px; border-radius:999px; border:none; background:linear-gradient(45deg,var(--neon-blue),var(--neon-pink)); color:#000; font-size:0.78rem; cursor:pointer; font-weight:700;">
                <i class="fas fa-download"></i>
            </button>
        </div>
    </div>
`).join('');

        } else if (tab === 'sheets') {
            if (sheets.length === 0) {
                listEl.innerHTML = '<p style="color:var(--text-secondary);">No sheets available.</p>';
                return;
            }
            listEl.innerHTML = sheets.map((s, i) => `
    <div style="display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:10px; background:rgba(255,255,255,0.05); margin-bottom:8px;">
        <i class="fas fa-file-alt" style="color:var(--neon-blue); font-size:1.1rem; flex-shrink:0;"></i>
        <div style="flex:1; font-size:0.88rem; font-weight:600;">${s.title || `Sheet ${i+1}`}</div>
        <div style="display:flex; gap:6px;">
            <button onclick="openPdfViewer(buildPdfUrl('${selectedChannelId}','${s.id || s.notes_id}'),'${(s.title || `Sheet ${i+1}`).replace(/'/g,"\\'")}')"
                style="padding:6px 14px; border-radius:999px; border:1px solid rgba(255,255,255,0.25); background:transparent; color:var(--text-primary); font-size:0.78rem; cursor:pointer; font-weight:600;">
                View
            </button>
            <button onclick="saveToDownloads('${s.id || s.notes_id}','${(s.title || `Sheet ${i+1}`).replace(/'/g,"\\'")}','${selectedChannelId}','sheet')"
                style="padding:6px 14px; border-radius:999px; border:none; background:linear-gradient(45deg,var(--neon-blue),var(--neon-pink)); color:#000; font-size:0.78rem; cursor:pointer; font-weight:700;">
                <i class="fas fa-download"></i>
            </button>
        </div>
    </div>
`).join('');
        }
    };

    // Layout with left unit list + right content
    const allChapters = selectedSubject ? (selectedSubject.chapters || []) : [];

    batchDataContent.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:0;">
        
        <!-- Unit List - Collapsible on mobile -->
        <details style="margin-bottom:12px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; overflow:hidden;">
            <summary style="padding:10px 14px; font-size:0.75rem; font-weight:700; letter-spacing:1px; color:var(--text-secondary); text-transform:uppercase; cursor:pointer; background:rgba(255,255,255,0.04); list-style:none; display:flex; align-items:center; justify-content:space-between;">
                UNIT LIST <i class="fas fa-chevron-down" style="font-size:0.7rem;"></i>
            </summary>
            <div style="padding:8px; max-height:220px; overflow-y:auto;">
                ${allChapters.map((ch, i) => `
                    <div class="unit-list-item" data-chapter-idx="${i}"
                        style="padding:8px 10px; border-radius:8px; cursor:pointer; margin-bottom:4px; font-size:0.82rem; font-weight:${i === chapterIndex ? '700' : '500'}; background:${i === chapterIndex ? 'rgba(0,240,255,0.12)' : 'transparent'}; color:${i === chapterIndex ? 'var(--neon-blue)' : 'var(--text-primary)'}; border-left:${i === chapterIndex ? '3px solid var(--neon-blue)' : '3px solid transparent'};">
                        ${i + 1}. ${ch.chapter_name || 'Chapter'}
                    </div>
                `).join('')}
            </div>
        </details>

        <!-- Tabs + Content -->
        <div style="display:flex; flex-direction:column;">
            <div style="display:${videoLectures.length ? 'flex' : 'none'};gap:8px;margin-bottom:12px;flex-wrap:wrap;">
                <button id="markAllDoneBtn" style="padding:6px 12px;border-radius:999px;border:1px solid rgba(34,197,94,0.35);background:rgba(34,197,94,0.12);color:#22c55e;font-weight:700;cursor:pointer;font-size:0.78rem;">Mark All Done</button>
                <button id="resetChapterProgressBtn" style="padding:6px 12px;border-radius:999px;border:1px solid rgba(255,77,109,0.35);background:rgba(255,77,109,0.1);color:#ff4d6d;font-weight:700;cursor:pointer;font-size:0.78rem;">Reset Progress</button>
            </div>
            <div style="display:flex; gap:6px; margin-bottom:14px; flex-wrap:wrap;">
                ${availableLectureTabs.map(tab => `<button id="lec-tab-${tab.key}" style="padding:5px 14px; border-radius:999px; font-size:0.8rem; cursor:pointer;">${tab.label}</button>`).join('')}
            </div>
            <div id="lec-list"></div>
        </div>
    </div>
`;


    // Unit list click
    batchDataContent.querySelectorAll('.unit-list-item').forEach(item => {
        item.addEventListener('click', () => {
            const idx = Number(item.dataset.chapterIdx);
            const ch = allChapters[idx];
            if (ch) renderChapterDetails(ch, idx);
        });
    });

    // Tab listeners
    availableLectureTabs.forEach(({ key }) => {
        const tabButton = document.getElementById(`lec-tab-${key}`);
        if (tabButton) tabButton.addEventListener('click', () => renderTab(key));
    });

    const markAllDoneBtn = document.getElementById('markAllDoneBtn');
    if (markAllDoneBtn) markAllDoneBtn.addEventListener('click', () => {
        const done = new Set(getCompletedLectureIds());
        lectures.forEach(lecture => { if (lecture.video_id) done.add(String(lecture.video_id)); });
        localStorage.setItem('completed_lectures', JSON.stringify([...done]));
        renderTab(activeTab);
        showMiniToast('Chapter complete mark ho gaya.');
    });

    const resetChapterProgressBtn = document.getElementById('resetChapterProgressBtn');
    if (resetChapterProgressBtn) resetChapterProgressBtn.addEventListener('click', () => {
        const lectureIds = new Set(lectures.filter(lecture => lecture.video_id).map(lecture => String(lecture.video_id)));
        const done = getCompletedLectureIds().filter(id => !lectureIds.has(String(id)));
        localStorage.setItem('completed_lectures', JSON.stringify(done));
        renderTab(activeTab);
        showMiniToast('Chapter progress reset ho gaya.');
    });

    if (availableLectureTabs.length) {
        renderTab(activeTab);
    } else {
        const listEl = document.getElementById('lec-list');
        if (listEl) listEl.innerHTML = '<p style="color:var(--text-secondary);">No content available.</p>';
    }
};

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}[char]));

ensurePopularBatchCards();
hydrateBatchThumbnails();

const renderLectureGlobalSearch = (term) => {
    const query = term.trim().toLowerCase();
    if (!query) {
        renderChapterDetails(selectedChapter, selectedChapterIndex);
        return;
    }

    const chapters = (selectedSubject && selectedSubject.chapters) || [];
    const completedIds = getCompletedLectureIds();
    const matches = [];

    chapters.forEach((chapter, chapterIdx) => {
        const chapterName = chapter.chapter_name || `Chapter ${chapterIdx + 1}`;
        (chapter.lectures || []).forEach((lecture, lectureIdx) => {
            const title = lecture.title || `Lecture ${lectureIdx + 1}`;
            const haystack = `${title} ${chapterName}`.toLowerCase();
            if (haystack.includes(query)) {
                matches.push({ chapter, chapterIdx, chapterName, lecture, lectureIdx, title });
            }
        });
    });

    batchDataTitle.textContent = `Search results`;
    if (subjectPathLabel) subjectPathLabel.textContent = `${matches.length} lecture result${matches.length === 1 ? '' : 's'}`;

    if (!matches.length) {
        batchDataContent.innerHTML = `
            <div style="padding:22px 4px; color:var(--text-secondary); font-size:0.92rem;">
                No lectures found for "${escapeHtml(term)}".
            </div>
        `;
        return;
    }

    batchDataContent.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:10px;">
            ${matches.map((item) => {
                const lecId = item.lecture.video_id ? String(item.lecture.video_id) : '';
                const isDone = lecId && completedIds.includes(lecId);
                const hasNotes = !!item.lecture.notes_id;
                return `
                    <div class="gateway-lecture-search-item" data-chapter-idx="${item.chapterIdx}" style="display:flex; align-items:center; gap:12px; padding:13px 14px; border-radius:10px; background:rgba(255,255,255,0.055); border:1px solid rgba(255,255,255,${isDone ? '0.18' : '0.08'});">
                        <button class="lec-done-btn" data-lec-id="${lecId}" style="background:none; border:none; cursor:pointer; font-size:1.1rem; flex-shrink:0; color:${isDone ? '#22c55e' : 'rgba(255,255,255,0.32)'}; padding:0;" title="Mark as done">
                            <i class="${isDone ? 'fas' : 'far'} fa-check-circle"></i>
                        </button>
                        <div style="flex:1; min-width:0;">
                            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                <span style="font-size:0.68rem; font-weight:800; color:var(--neon-blue); background:rgba(0,240,255,0.1); padding:3px 8px; border-radius:4px; letter-spacing:1px; white-space:nowrap;">CH ${String(item.chapterIdx + 1).padStart(2, '0')}</span>
                                <span style="font-size:0.68rem; font-weight:800; color:var(--neon-pink); background:rgba(255,0,122,0.1); padding:3px 8px; border-radius:4px; letter-spacing:1px; white-space:nowrap;">LEC ${String(item.lectureIdx + 1).padStart(2, '0')}</span>
                                <span style="font-size:0.9rem; font-weight:700; word-break:break-word;">${escapeHtml(item.title)}</span>
                            </div>
                            <div style="font-size:0.76rem; color:var(--text-secondary); margin-top:5px;">${escapeHtml(currentBatchTitle || 'Batch')} &gt; ${escapeHtml((selectedSubject && selectedSubject.batch_name) || 'Subject')} &gt; ${escapeHtml(item.chapterName)}</div>
                        </div>
                        <div style="display:flex; gap:6px; flex-shrink:0;">
                            ${lecId ? `<button class="lec-search-play-btn" data-video-id="${lecId}" data-chapter-idx="${item.chapterIdx}" data-title="${escapeHtml(item.title)}" style="padding:6px 14px; border-radius:999px; border:none; background:linear-gradient(45deg,var(--neon-blue),var(--neon-pink)); color:#000; font-weight:700; font-size:0.78rem; cursor:pointer; display:flex; align-items:center; gap:4px;"><i class="fas fa-play"></i> Play</button>` : ''}
                            ${hasNotes ? `<button class="lec-search-pdf-btn" data-notes-id="${item.lecture.notes_id}" style="padding:6px 14px; border-radius:999px; border:1px solid rgba(255,255,255,0.25); background:transparent; color:var(--text-primary); font-weight:600; font-size:0.78rem; cursor:pointer;">PDF</button>` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    batchDataContent.querySelectorAll('.lec-search-play-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const chapterIdx = Number(btn.dataset.chapterIdx);
            const chapter = chapters[chapterIdx] || selectedChapter;
            selectedChapter = chapter;
            selectedChapterIndex = chapterIdx;
            batchDataModal.classList.remove('active');
            openPremiumVideo(btn.dataset.videoId, btn.dataset.title, chapter);
        });
    });

    batchDataContent.querySelectorAll('.lec-search-pdf-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openPdfViewer(buildPdfUrl(selectedChannelId, btn.dataset.notesId), 'PDF');
        });
    });

    batchDataContent.querySelectorAll('.lec-done-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const lecId = btn.dataset.lecId;
            if (!lecId) return;
            let done = JSON.parse(localStorage.getItem('completed_lectures') || '[]').map(String);
            const idx = done.indexOf(lecId);
            if (idx >= 0) done.splice(idx, 1);
            else done.push(lecId);
            localStorage.setItem('completed_lectures', JSON.stringify(done));
            renderLectureGlobalSearch((subjectSearchInput && subjectSearchInput.value) || term);
        });
    });
};

const openBatchModal = (data, title) => {
    syncAppViewportHeight();
    currentBatchData = data;
    const source = resolveGatewayBatchSource(data, title);
    currentBatchDataKey = source.dataKey || '';
    currentBatchTitle = source.title || title;
    subjectSearchTerm = '';
    subjectTab = 'all';
    if (subjectSearchInput) subjectSearchInput.value = '';
    renderSubjects(data, currentBatchTitle);
    batchDataModal.classList.add('active');
    overlay.style.display = 'block';
    saveGatewayViewState(true);
}

        gatewayBatchCard.addEventListener('click', () => {
            openBatchModal(window.dataClass13 || [], 'GATEWAY – 1ST YEAR');
        });

        if (apnaCollegeBatchCard) {
            apnaCollegeBatchCard.addEventListener('click', () => {
                openApnaCollegeIframe();
            });
        }

        if (chaiaurcodeBatchCard) {
            chaiaurcodeBatchCard.addEventListener('click', () => {
                openBatchModal(window.dataClass101 || [], 'CHAI AUR CODE');
            });
        }

        if (codewithharryBatchCard) {
            codewithharryBatchCard.addEventListener('click', () => {
                openBatchModal(window.dataClass114 || [], 'CODE WITH HARRY');
            });
        }

        document.querySelectorAll('.batch-grid .batch-card[data-batch-key]').forEach((card) => {
            card.addEventListener('click', () => {
                const source = getGatewayBatchSources().find(item => item.dataKey === card.dataset.batchKey);
                if (source) openBatchModal(window[source.dataKey] || [], source.title);
            });
        });

        document.querySelectorAll('.enroll-batch-btn').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                enrollBatch(btn.dataset.batchKey);
            });
        });
        updateEnrollButtons();


        batchDataContent.addEventListener('click', (event) => {
            const favoriteButton = event.target.closest('.gateway-subject-favorite-btn');
            if (favoriteButton) {
                const subjectIndex = Number(favoriteButton.dataset.subjectIndex);
                const existingIndex = favoriteSubjects.indexOf(subjectIndex);
                if (existingIndex >= 0) {
                    favoriteSubjects.splice(existingIndex, 1);
                } else {
                    favoriteSubjects.push(subjectIndex);
                }
                localStorage.setItem(GATEWAY_FAVORITE_SUBJECTS_KEY, JSON.stringify(favoriteSubjects));
                renderSubjects(currentBatchData, batchDataTitle.textContent);
                return;
            }

            const lectureItem = event.target.closest('.gateway-lecture-item');
            if (lectureItem) {
                const lectureTitle = lectureItem.dataset.lectureTitle || 'Lecture';
                const videoId = lectureItem.dataset.videoId;
                if (!videoId) return;
                batchDataModal.classList.remove('active');
                openPremiumVideo(videoId, lectureTitle, selectedChapter);
                return;
            }

            const subjectItem = event.target.closest('.gateway-subject-item');
            if (subjectItem) {
                const subjectIndex = Number(subjectItem.dataset.subjectIndex);
                const clickedSubject = currentBatchData[subjectIndex];
                if (!clickedSubject) return;
                renderChapters(clickedSubject, subjectIndex);
                return;
            }

            const chapterItem = event.target.closest('.gateway-chapter-item');
            if (chapterItem && selectedSubject) {
                const chapterIndex = Number(chapterItem.dataset.chapterIndex);
                const chapters = Array.isArray(selectedSubject.chapters) ? selectedSubject.chapters : [];
                const clickedChapter = chapters[chapterIndex];
                if (!clickedChapter) return;
                renderChapterDetails(clickedChapter, chapterIndex);
            }
        });

        backToSubjectsBtn.addEventListener('click', () => {
            if (subjectSearchInput) subjectSearchInput.value = '';
            if (selectedChapter && selectedSubject) {
                renderChapters(selectedSubject, selectedSubjectIndex);
                return;
            }
            renderSubjects(currentBatchData, batchDataTitle.textContent);
        });

        if (modalBatchBackBtn) {
            modalBatchBackBtn.addEventListener('click', () => {
                if (subjectSearchInput) subjectSearchInput.value = '';
                if (selectedChapter && selectedSubject) {
                    renderChapters(selectedSubject, selectedSubjectIndex);
                    return;
                }
                if (selectedSubject) {
                    renderSubjects(currentBatchData, batchDataTitle.textContent);
                    return;
                }
                batchDataModal.classList.remove('active');
                overlay.style.display = 'none';
                saveGatewayViewState(false);
                
            });
        }

        if (subjectSearchInput) {
    subjectSearchInput.addEventListener('input', (event) => {
        const term = event.target.value.trim().toLowerCase();

        // Chapter view
        if (selectedSubject && !selectedChapter) {
            const chapters = selectedSubject.chapters || [];
            const items = batchDataContent.querySelectorAll('.gateway-chapter-item');
            items.forEach((item, i) => {
                const name = ((chapters[i] && chapters[i].chapter_name) || '').toLowerCase();
                item.style.display = name.includes(term) ? '' : 'none';
            });
            return;
        }

        // Lecture view
        if (selectedChapter) {
            renderLectureGlobalSearch(term);
            return;
        }

        // Subject view (default)
        subjectSearchTerm = term;
        renderSubjects(currentBatchData, batchDataTitle.textContent);
    });
}

        restoreGatewayViewState();

        if (allSubjectsTabBtn) {
            allSubjectsTabBtn.addEventListener('click', () => {
                subjectTab = 'all';
                renderSubjects(currentBatchData, batchDataTitle.textContent);
            });
        }

        if (favoriteSubjectsTabBtn) {
            favoriteSubjectsTabBtn.addEventListener('click', () => {
                subjectTab = 'fav';
                renderSubjects(currentBatchData, batchDataTitle.textContent);
            });
        }

        closeBatchData.addEventListener('click', () => {
            batchDataModal.classList.remove('active');
            overlay.style.display = 'none';
            saveGatewayViewState(false);
            
        });

        // Restore video after refresh
(function restoreLastVideo() {
    try {
        if (window.location.search && window.location.search.includes('batch=')) return;
        const saved = JSON.parse(sessionStorage.getItem('last_video') || 'null');
        if (!saved || !saved.videoId) return;

        // Channel ID seedha saved se lo
        selectedChannelId = saved.channelId || '-1003345907635';
        if (!selectedSubject && saved.batchDataKey) {
            const source = getGatewayBatchSources().find(item => item.dataKey === saved.batchDataKey);
            const data = source ? (window[source.dataKey] || []) : [];
            const subject = Number.isInteger(saved.subjectIndex) ? data[saved.subjectIndex] : null;
            const chapter = subject && Number.isInteger(saved.chapterIndex) ? (subject.chapters || [])[saved.chapterIndex] : null;
            if (subject) {
                currentBatchData = data;
                currentBatchDataKey = source.dataKey;
                currentBatchTitle = saved.batchTitle || source.title;
                selectedSubject = subject;
                selectedSubjectIndex = saved.subjectIndex;
                selectedChapter = chapter || null;
                selectedChapterIndex = chapter ? saved.chapterIndex : -1;
            }
        }

        // Video modal directly open karo
        const modal = document.getElementById('videoModal');
        const vp = document.getElementById('videoPlayer');
        
        modal.style.display = 'flex';
        overlay.style.display = 'block';
        document.body.classList.add('video-modal-open');
        document.body.classList.remove('telegram-fullscreen-active', 'telegram-landscape-active');
        setTelegramPlayerMode(true);

        document.getElementById('videoTitle').textContent = saved.chapterName || saved.title || 'Now Playing';
        document.getElementById('videoLectureName').textContent = saved.title || '';
        currentCommentKey = getVideoCommentKey(saved.channelId, saved.videoId);
        editingVideoCommentIndex = -1;
        renderVideoComments();

        // Quote
        const QUOTES = [
            { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
            { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
            { text: "Dreams don't work unless you do.", author: "John C. Maxwell" },
        ];
        const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        const quoteEl = document.getElementById('videoQuote');
        if (quoteEl) quoteEl.innerHTML = `"${q.text}"<br><span style="font-size:0.8rem; color:var(--neon-blue); display:block; margin-top:6px;">— ${q.author}</span>`;

        const sources = buildVideoStreamSources(saved.channelId, saved.videoId);
        if (!sources.length) {
            showMiniToast('Video unavailable. Please try again later.');
            return;
        }
        applyVideoStreamSource(vp, sources);

        // Time restore - seek after metadata loads
        const savedTime = saved.currentTime || 0;
        if (savedTime > 2) {
            vp.addEventListener('loadedmetadata', () => {
    vp.currentTime = savedTime;
    vp.play().catch(() => {});
    // Progress bar manually update karo
    const pct = vp.duration ? Math.min(100, Math.max(0, (savedTime / vp.duration) * 100)) : 0;
    const fill = document.getElementById('progressBarFill');
    const thumb = document.getElementById('progressThumb');
    const track = document.getElementById('progressBarContainer');
    const currentTimeEl = document.getElementById('currentTime');
    const totalDurationEl = document.getElementById('totalDuration');
    if (fill) fill.style.width = pct + '%';
    if (thumb) thumb.style.left = pct + '%';
    if (track) track.setAttribute('aria-valuenow', String(Math.round(pct)));
    if (currentTimeEl) currentTimeEl.textContent = fmtTime(savedTime);
    if (totalDurationEl) totalDurationEl.textContent = fmtTime(vp.duration);
    if (typeof window.refreshPremiumVideoProgress === 'function') window.refreshPremiumVideoProgress();
}, { once: true });
        } else {
            vp.play().catch(() => {});
        }

        const sBtn = document.getElementById('speedBtn');
        if (sBtn && !sBtn.querySelector('i')) {
            sBtn.textContent = '1x';
        }
        document.getElementById('telegramSpeedValue').textContent = '1x';
        vp.playbackRate = 1;

        // Time tracker restart
        if (window._timeTracker) clearInterval(window._timeTracker);
        window._timeTracker = setInterval(() => {
            if (!vp.paused && vp.currentTime > 0) {
                const state = JSON.parse(sessionStorage.getItem('last_video') || '{}');
                state.currentTime = vp.currentTime;
                sessionStorage.setItem('last_video', JSON.stringify(state));
            }
        }, 2000);

    } catch(e) {
        console.warn('Video restore failed:', e);
    }
})();

        // Offline Detection
        window.addEventListener('online', () => {
            offlineIndicator.style.display = 'none';
        });

        window.addEventListener('offline', () => {
            offlineIndicator.style.display = 'block';
        });

        // Check initial connection status
        if (!navigator.onLine) {
            offlineIndicator.style.display = 'block';
        }

        // Close panels when clicking overlay
overlay.addEventListener('click', () => {
    notificationsPanel.classList.remove('open');
    markNotificationsSeen();
    if (!videoModal.classList.contains('is-floating')) {
        closePremiumVideo();
    }
    batchDataModal.classList.remove('active');
    overlay.style.display = 'none';
    swipeArea.style.display = 'none';
            
            if (!videoModal.classList.contains('is-floating') && !videoPlayer.paused) {
                videoPlayer.pause();
            }
        });

        // Swipe to close notifications panel
        let touchStartX = 0;
        let touchEndX = 0;

        swipeArea.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        swipeArea.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            if (touchStartX - touchEndX > 100) {
                notificationsPanel.classList.remove('open');
                markNotificationsSeen();
                overlay.style.display = 'none';
                swipeArea.style.display = 'none';
            }
        });

        // Animate progress bar on page load
function recalculateProgress() {
    const progressPercent = document.getElementById('progressPercent');
    const mainProgress = document.getElementById('mainProgress');
    if (!progressPercent || !mainProgress) return;

    const completed = JSON.parse(localStorage.getItem('completed_lectures') || '[]');
    const allData = [
        ...(window.dataClass13 || []),
        ...(window.dataClass11 || []),
        ...(window.dataClass17 || []),
        ...(window.dataClass101 || []),
        ...(window.dataClass114 || []),
        ...(window.dataClass102 || []),
        ...(window.dataClass103 || []),
        ...(window.dataClass104 || []),
        ...(window.dataClass105 || []),
        ...(window.dataClass106 || []),
        ...(window.dataClass107 || []),
        ...(window.dataClass108 || []),
        ...(window.dataClass109 || []),
        ...(window.dataClass110 || []),
        ...(window.dataClass111 || []),
        ...(window.dataClass112 || []),
        ...(window.dataClass113 || []),
        ...(window.dataClass14 || []),
        ...(window.dataClass15 || []),
        ...(window.dataClass115 || []),
        ...(window.dataClass116 || []),
        ...(window.dataClass201 || []),
        ...(window.dataClass202 || []),
    ];

    let totalLec = 0;
    allData.forEach(batch => {
        (batch.chapters || []).forEach(ch => {
            totalLec += (ch.lectures || []).length;
        });
    });

    const realPercent = totalLec > 0 ? Math.round((completed.length / totalLec) * 100) : 0;

    // Animate to real percent
    let current = parseInt(progressPercent.textContent) || 0;
    const target = realPercent;
    if (current === target) {
        progressPercent.textContent = target;
        mainProgress.style.width = target + '%';
        return;
    }
    const step = current < target ? 1 : -1;
    const interval = setInterval(() => {
        current += step;
        progressPercent.textContent = current;
        mainProgress.style.width = current + '%';
        if (current === target) clearInterval(interval);
    }, 30);
}

function getOverallProgressDetails() {
    const completed = getCompletedLectureIds();
    const sources = getGatewayBatchSources();
    const rows = sources.map((source) => {
        const data = window[source.dataKey] || [];
        const progress = getBatchProgress(data);
        return { ...source, ...progress };
    }).filter(row => row.total > 0);
    const total = rows.reduce((sum, row) => sum + row.total, 0);
    const done = rows.reduce((sum, row) => sum + row.done, 0);
    const pct = total ? Math.round((done / total) * 100) : 0;
    const stats = readJson(STUDY_STATS_KEY, { totalSeconds: 0, todaySeconds: 0, streak: 0 });
    return { completed, rows, total, done, pct, stats };
}

function showProgressDetails() {
    const progressDetailsModal = document.getElementById('progressDetailsModal');
    if (progressDetailsModal) progressDetailsModal.remove();
    const details = getOverallProgressDetails();
    const modal = document.createElement('div');
    modal.id = 'progressDetailsModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0a0a0f;overflow-y:auto;padding:20px;';
    modal.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;position:sticky;top:0;background:#0a0a0f;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
            <button onclick="document.getElementById('progressDetailsModal').remove()" style="background:none;border:none;color:#fff;font-size:1.2rem;cursor:pointer;"><i class="fas fa-arrow-left"></i></button>
            <span style="font-size:1.1rem;font-weight:800;">Progress Details</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;">
            <div style="padding:12px;border-radius:10px;background:rgba(255,255,255,0.06);"><div style="font-size:0.72rem;color:var(--text-secondary);">Completed</div><div style="font-weight:900;color:var(--neon-blue);">${details.done}/${details.total}</div></div>
            <div style="padding:12px;border-radius:10px;background:rgba(255,255,255,0.06);"><div style="font-size:0.72rem;color:var(--text-secondary);">Overall</div><div style="font-weight:900;color:var(--neon-pink);">${details.pct}%</div></div>
            <div style="padding:12px;border-radius:10px;background:rgba(255,255,255,0.06);"><div style="font-size:0.72rem;color:var(--text-secondary);">Streak</div><div style="font-weight:900;color:var(--neon-purple);">${Number(details.stats.streak) || 0} days</div></div>
        </div>
        ${details.rows.map(row => `
            <div style="padding:12px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;gap:10px;font-size:0.88rem;font-weight:800;">
                    <span>${escapeHtml(row.title)}</span><span>${row.done}/${row.total} - ${row.pct}%</span>
                </div>
                <div style="height:5px;margin-top:8px;border-radius:999px;background:rgba(255,255,255,0.12);overflow:hidden;"><div style="width:${row.pct}%;height:100%;background:linear-gradient(90deg,var(--neon-blue),var(--neon-pink));"></div></div>
            </div>
        `).join('')}
    `;
    document.body.appendChild(modal);
}

async function shareProgress() {
    const details = getOverallProgressDetails();
    const streak = Number(details.stats.streak) || 0;
    const todayText = formatWatchMinutes(details.stats.todaySeconds);
    const text = `My CODExTRMS progress: ${details.pct}% complete (${details.done}/${details.total} lectures), ${streak} day streak, today ${todayText} studied.`;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
    grad.addColorStop(0, '#071827');
    grad.addColorStop(0.48, '#111827');
    grad.addColorStop(1, '#34051f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1080);

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.roundRect(70, 70, 940, 940, 36);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,240,255,0.28)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 58px Arial, sans-serif';
    ctx.fillText('CODExTRMS Progress', 120, 160);
    ctx.fillStyle = '#aeb7d8';
    ctx.font = '32px Arial, sans-serif';
    ctx.fillText(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), 120, 210);

    ctx.fillStyle = '#00f0ff';
    ctx.font = '900 170px Arial, sans-serif';
    ctx.fillText(`${details.pct}%`, 120, 420);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 42px Arial, sans-serif';
    ctx.fillText('Overall Completion', 125, 475);

    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.roundRect(125, 530, 830, 22, 11);
    ctx.fill();
    const progressWidth = Math.max(10, Math.min(830, (details.pct / 100) * 830));
    const barGrad = ctx.createLinearGradient(125, 530, 955, 552);
    barGrad.addColorStop(0, '#00f0ff');
    barGrad.addColorStop(1, '#ff1493');
    ctx.fillStyle = barGrad;
    ctx.beginPath();
    ctx.roundRect(125, 530, progressWidth, 22, 11);
    ctx.fill();

    [
        { label: 'Lectures Done', value: `${details.done}/${details.total}` },
        { label: 'Study Streak', value: `${streak} day${streak === 1 ? '' : 's'}` },
        { label: 'Today Studied', value: todayText },
    ].forEach((card, index) => {
        const x = 125 + index * 277;
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.roundRect(x, 620, 248, 170, 24);
        ctx.fill();
        ctx.fillStyle = '#aeb7d8';
        ctx.font = '28px Arial, sans-serif';
        ctx.fillText(card.label, x + 24, 675);
        ctx.fillStyle = index === 1 ? '#ff1493' : '#00f0ff';
        ctx.font = '800 40px Arial, sans-serif';
        ctx.fillText(card.value, x + 24, 735);
    });

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 36px Arial, sans-serif';
    ctx.fillText('Shared from CODExTRMS', 125, 895);
    ctx.fillStyle = '#aeb7d8';
    ctx.font = '28px Arial, sans-serif';
    ctx.fillText('Keep learning. Keep showing up.', 125, 940);

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.95));
    if (!blob) {
        showMiniToast('Progress image ban nahi paya.');
        return;
    }
    const file = new File([blob], 'codextrms-progress.png', { type: 'image/png' });
    try {
        if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
            await navigator.share({ title: 'CODExTRMS Progress', text, files: [file] });
        } else {
            const imageUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = imageUrl;
            a.download = 'codextrms-progress.png';
            a.click();
            URL.revokeObjectURL(imageUrl);
            showMiniToast('Progress image downloaded. WhatsApp/Telegram par send kar sakte ho.');
        }
    } catch {
        showMiniToast('Share cancel ho gaya.');
    }
}

window.addEventListener('load', recalculateProgress);

// Jab bhi lecture mark done ho, progress update ho
const _origSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = function(key, value) {
    _origSetItem(key, value);
    if (key === 'completed_lectures') {
        recalculateProgress();
        if (typeof renderPinnedBatches === 'function') renderPinnedBatches();
        if (typeof updateBatchCardProgress === 'function') updateBatchCardProgress();
    }
    if (key === 'watch_history') {
        renderRecommendedCourses();
        renderContinueWatching();
    }
};

        const PLAYER_QUOTES = [
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
    { text: "Doubt kills more dreams than failure ever will.", author: "Suzy Kassem" },
    { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
    { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
    { text: "Growth begins at the end of your comfort zone.", author: "Tony Robbins" },
    { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
    { text: "Dreams don't work unless you do.", author: "John C. Maxwell" },
];

function openPremiumVideo(videoId, title, chapter) {
    syncAppViewportHeight();
    const modal = document.getElementById('videoModal');
    const vp = document.getElementById('videoPlayer');
    if (!videoId) return;

    modal.classList.remove('is-floating');
    modal.style.display = 'flex';
    overlay.style.display = 'block';
    document.body.classList.add('video-modal-open');
    document.body.classList.remove('telegram-fullscreen-active', 'telegram-landscape-active');
    setTelegramPlayerMode(true);

    const chapterName = (chapter && chapter.chapter_name) || (selectedChapter && selectedChapter.chapter_name) || 'Now Playing';
    document.getElementById('videoTitle').textContent = chapterName;
    const batchTitleEl = document.getElementById('videoBatchTitle');
    if (batchTitleEl) batchTitleEl.textContent = currentBatchTitle || 'Batch';
    document.getElementById('videoLectureName').textContent = title || '';
    document.getElementById('floatingPlayerTitle').textContent = title || chapterName || 'Now Playing';
    currentCommentKey = getVideoCommentKey(selectedChannelId, videoId);
    editingVideoCommentIndex = -1;
    renderVideoComments();
    const commentInput = document.getElementById('videoCommentInput');
    if (commentInput) commentInput.value = '';

    // FIX 4: Quote dikhao
    const q = PLAYER_QUOTES[Math.floor(Math.random() * PLAYER_QUOTES.length)];
    const quoteEl = document.getElementById('videoQuote');
    if (quoteEl) {
        quoteEl.innerHTML = `"${q.text}"<br><span style="font-size:0.8rem; color:var(--neon-blue); display:block; margin-top:6px;">— ${q.author}</span>`;
    }

    const sources = buildVideoStreamSources(selectedChannelId, videoId);
    if (!sources.length) {
        showMiniToast('Video unavailable. Please try again later.');
        return;
    }
    const loader = document.getElementById('videoLoaderOverlay');
    if (loader) loader.style.display = 'flex';
    vp.currentTime = 0;
    applyVideoStreamSource(vp, sources);
    const savedProgress = getLectureProgress(videoId);
        if (savedProgress && savedProgress.currentTime > 5) {
        vp.addEventListener('loadedmetadata', () => {
            if (savedProgress.currentTime < (vp.duration || Infinity) - 5) {
                vp.currentTime = savedProgress.currentTime;
                if (typeof window.refreshPremiumVideoProgress === 'function') window.refreshPremiumVideoProgress();
            }
        }, { once: true });
    }
    if (typeof window.refreshPremiumVideoProgress === 'function') window.refreshPremiumVideoProgress();

    vp.playbackRate = 1;
const sBtn2 = document.getElementById('speedBtn');
if (sBtn2 && !sBtn2.querySelector('i')) {
    sBtn2.textContent = '1x';
}
document.getElementById('telegramSpeedValue').textContent = '1x';

// Save video state for restore
sessionStorage.setItem('last_video', JSON.stringify({
    videoId, title,
    chapterName,
    channelId: selectedChannelId,
    batchTitle: currentBatchTitle,
    batchDataKey: currentBatchDataKey,
    chapterIndex: selectedChapterIndex,
    subjectIndex: selectedSubjectIndex
}));

    // Watch history save karo
const historyKey = 'watch_history';
let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
// Duplicate remove karo
history = history.filter(h => h.videoId !== videoId);
// Nayi entry upar add karo
history.unshift({
    videoId,
    title,
    channelId: selectedChannelId,
    batchTitle: currentBatchTitle || '',
    batchDataKey: currentBatchDataKey || '',
    timestamp: Date.now()
});
// Max 50 videos rakhna
if (history.length > 50) history = history.slice(0, 50);
localStorage.setItem(historyKey, JSON.stringify(history));
    
// Time tracker - har 2 second mein save karo
if (window._timeTracker) clearInterval(window._timeTracker);
window._timeTracker = setInterval(() => {
    if (!vp.paused && vp.currentTime > 0) {
        const state = JSON.parse(sessionStorage.getItem('last_video') || '{}');
        state.currentTime = vp.currentTime;
        sessionStorage.setItem('last_video', JSON.stringify(state));
        saveLectureProgress(videoId, { currentTime: vp.currentTime, duration: vp.duration || 0, title, channelId: selectedChannelId });
        updateStudyStats(2);
    }
}, 2000);

    buildAttachments(chapter);
    if (window.innerWidth < 821) {
        setSidebarView('none');
    } else {
        setSidebarView('comments');
    }
    
    vp.playbackRate = 1;
    const sBtn3 = document.getElementById('speedBtn');
    if (sBtn3 && !sBtn3.querySelector('i')) {
        sBtn3.textContent = '1x';
    }
    document.getElementById('telegramSpeedValue').textContent = '1x';
    if (typeof window.__updateUrlState === 'function') window.__updateUrlState();
}

function minimizePremiumVideo() {
    const modal = document.getElementById('videoModal');
    const vp = document.getElementById('videoPlayer');
    if (!modal || !vp || !vp.src) return;
    if (shouldUseCleanVideoMode()) {
        closePremiumVideo();
        return;
    }
    modal.classList.add('is-floating');
    modal.style.display = 'flex';
    document.body.classList.remove('video-modal-open', 'telegram-fullscreen-active', 'telegram-landscape-active');
    setTelegramPlayerMode(false);
    setSidebarView('none');
    const floatingTitleEl = document.getElementById('floatingPlayerTitle');
    const videoLectureNameEl = document.getElementById('videoLectureName');
    const videoTitleEl = document.getElementById('videoTitle');
    floatingTitleEl.textContent = (videoLectureNameEl && videoLectureNameEl.textContent) || (videoTitleEl && videoTitleEl.textContent) || 'Now Playing';
    updateFloatingPlayButton();
    if (typeof window.__updateUrlState === 'function') window.__updateUrlState();
}

function expandPremiumVideo() {
    syncAppViewportHeight();
    const modal = document.getElementById('videoModal');
    if (!modal) return;
    modal.classList.remove('is-floating');
    modal.style.display = 'flex';
    overlay.style.display = 'block';
    document.body.classList.add('video-modal-open');
    document.body.classList.remove('telegram-fullscreen-active', 'telegram-landscape-active');
    setTelegramPlayerMode(true);

    if (window.innerWidth < 821) {
        setSidebarView('none');
    } else {
        setSidebarView('comments');
    }
    if (typeof window.__updateUrlState === 'function') window.__updateUrlState();
}

function updateFloatingPlayButton() {
    const vp = document.getElementById('videoPlayer');
    const btn = document.getElementById('floatingPlayBtn');
    if (!vp || !btn) return;
    btn.innerHTML = vp.paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
}

function closePremiumVideo() {
    const modal = document.getElementById('videoModal');
    const vp = document.getElementById('videoPlayer');
    modal.classList.remove('is-floating');
    modal.style.display = 'none';
    overlay.style.display = 'none';
    document.body.classList.remove('video-modal-open', 'telegram-fullscreen-active', 'telegram-landscape-active');
    setTelegramPlayerMode(false);
    stopVideoStreamFallback(vp);
    vp.pause();
    vp.currentTime = 0;
    vp.src = '';
    if (typeof window.refreshPremiumVideoProgress === 'function') window.refreshPremiumVideoProgress();
    setSidebarView('none');
    currentCommentKey = '';
    editingVideoCommentIndex = -1;
    if (window._timeTracker) clearInterval(window._timeTracker);
    sessionStorage.removeItem('last_video');

    // Restore batch/chapter view if it was active when video started
    const savedState = JSON.parse(localStorage.getItem(GATEWAY_VIEW_STATE_KEY) || 'null');
    if (savedState && savedState.isOpen) {
        if (typeof restoreGatewayViewState === 'function') {
            restoreGatewayViewState({ showModal: true });
        }
    }
    if (typeof window.__updateUrlState === 'function') window.__updateUrlState();
}

function buildAttachments(chapter) {
    window._currentAttachChapter = chapter;
    const list = document.getElementById('attachmentsList');
    if (!list) return;
    if (!chapter) {
        list.innerHTML = '<p style="color:rgba(255,255,255,0.4); font-size:0.85rem; padding:8px;">No attachments available.</p>';
        return;
    }

    const lectures = Array.isArray(chapter.lectures) ? chapter.lectures : [];
    const videoLectures = lectures.filter(lecture => lecture.video_id);
    const lectureOnlyNotes = lectures.filter(lecture => lecture.notes_id && !lecture.video_id);
    const dpps = Array.isArray(chapter.dpps) ? chapter.dpps : [];
    const sheets = Array.isArray(chapter.sheets) ? chapter.sheets : [];
    const notes = Array.isArray(chapter.notes) ? chapter.notes : [];

    let html = '';

    const sectionHeader = (title) => `
        <div style="font-size:0.7rem; font-weight:800; letter-spacing:1px; color:var(--neon-blue); text-transform:uppercase; padding:14px 4px 6px; border-bottom:1px solid rgba(255,255,255,0.08); margin-bottom:6px;">${title}</div>`;

    const itemRow = (title, playId, viewId) => `
        <div style="margin-bottom:8px; padding:8px; border-radius:8px; background:rgba(255,255,255,0.04);">
            <div style="font-size:0.82rem; font-weight:600; margin-bottom:6px; line-height:1.3; color:#fff;">${escapeHtml(title)}</div>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                ${playId ? `<button class="attachment-play-btn" data-video-id="${escapeHtml(playId)}" data-title="${escapeHtml(title)}" style="padding:4px 12px; border-radius:999px; border:none; background:linear-gradient(45deg,var(--neon-blue),var(--neon-pink)); color:#000; font-size:0.75rem; font-weight:700; cursor:pointer;"><i class="fas fa-play"></i> Play</button>` : ''}
                ${viewId ? `<button onclick="openPdfViewer(buildPdfUrl('${selectedChannelId}','${viewId}'),'${escapeHtml(title).replace(/'/g, "\\'")}')" style="padding:4px 12px; border-radius:999px; border:1px solid rgba(255,255,255,0.2); background:transparent; color:rgba(255,255,255,0.8); font-size:0.75rem; cursor:pointer; font-weight:600;"><i class="fas fa-eye"></i> View</button>` : ''}
            </div>
        </div>`;

    // Lecture Resources
    if (videoLectures.length) {
        html += sectionHeader('Lecture Resources');
        videoLectures.forEach((lec, i) => {
            const t = lec.title || `Lecture ${i+1}`;
            html += itemRow(t, lec.video_id || null, lec.notes_id || null);
        });
    }

    // Notes
    const allNotes = [...lectureOnlyNotes, ...notes];
    if (allNotes.length) {
        html += sectionHeader('Notes');
        allNotes.forEach((n, i) => {
            const t = n.title || `Notes ${i+1}`;
            const id = n.id || n.notes_id;
            html += itemRow(t, null, id);
        });
    }

    // DPPs
    if (dpps.length) {
        html += sectionHeader('DPPs');
        dpps.forEach((d, i) => {
            const t = d.title || `DPP ${i+1}`;
            const id = d.id || d.notes_id;
            html += itemRow(t, null, id);
        });
    }

    // Sheets
    if (sheets.length) {
        html += sectionHeader('Sheets');
        sheets.forEach((s, i) => {
            const t = s.title || `Sheet ${i+1}`;
            const id = s.id || s.notes_id;
            html += itemRow(t, null, id);
        });
    }

    list.innerHTML = html || '<p style="color:rgba(255,255,255,0.4); font-size:0.85rem; padding:8px;">No attachments for this chapter.</p>';
    list.querySelectorAll('.attachment-play-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            openPremiumVideo(btn.dataset.videoId, btn.dataset.title || 'Video', window._currentAttachChapter);
        });
    });
}

(function setupVideoControls() {
    const vp = document.getElementById('videoPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const skipBackBtn = document.getElementById('skipBackBtn');
    const skipFwdBtn = document.getElementById('skipFwdBtn');
    const muteBtn = document.getElementById('muteBtn');
    const volumeSlider = document.getElementById('volumeSlider');

    const playerHeaderBatchesBtn = document.getElementById('playerHeaderBatchesBtn');
    if (playerHeaderBatchesBtn) {
        playerHeaderBatchesBtn.addEventListener('click', () => {
            closePremiumVideo();
            setActiveSection('coursesSection');
        });
    }
    const speedBtn = document.getElementById('speedBtn');
    const speedMenu = document.getElementById('speedMenu');
    const videoDownloadBtn = document.getElementById('videoDownloadBtn');
    if (videoDownloadBtn) {
        videoDownloadBtn.style.display = 'inline-flex';
        videoDownloadBtn.addEventListener('click', () => {
            const state = JSON.parse(sessionStorage.getItem('last_video') || '{}');
            if (state.videoId) {
                saveToDownloads(state.videoId, state.title, state.channelId || selectedChannelId, 'video');
            } else {
                showMiniToast('Error: No active video details found.');
            }
        });
    }

    const tapLeft = document.getElementById('tapLeft');
    const tapRight = document.getElementById('tapRight');
    const tapFeedbackLeft = document.getElementById('tapFeedbackLeft');
    const tapFeedbackRight = document.getElementById('tapFeedbackRight');
    if (tapLeft && tapRight) {
        let leftClicks = 0;
        let leftClickTimer = null;
        tapLeft.addEventListener('click', (e) => {
            leftClicks++;
            if (leftClicks === 1) {
                leftClickTimer = setTimeout(() => {
                    leftClicks = 0;
                    if (vp.paused) vp.play().catch(() => {});
                    else vp.pause();
                }, 250);
            } else if (leftClicks === 2) {
                clearTimeout(leftClickTimer);
                leftClicks = 0;
                vp.currentTime = Math.max(0, vp.currentTime - 10);
                if (tapFeedbackLeft) {
                    tapFeedbackLeft.style.display = 'flex';
                    setTimeout(() => tapFeedbackLeft.style.display = 'none', 600);
                }
            }
        });

        let rightClicks = 0;
        let rightClickTimer = null;
        tapRight.addEventListener('click', (e) => {
            rightClicks++;
            if (rightClicks === 1) {
                rightClickTimer = setTimeout(() => {
                    rightClicks = 0;
                    if (vp.paused) vp.play().catch(() => {});
                    else vp.pause();
                }, 250);
            } else if (rightClicks === 2) {
                clearTimeout(rightClickTimer);
                rightClicks = 0;
                vp.currentTime = Math.min(vp.duration || 0, vp.currentTime + 10);
                if (tapFeedbackRight) {
                    tapFeedbackRight.style.display = 'flex';
                    setTimeout(() => tapFeedbackRight.style.display = 'none', 600);
                }
            }
        });
    }
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const progressBarContainer = document.getElementById('progressBarContainer');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressThumb = document.getElementById('progressThumb');
    const currentTimeEl = document.getElementById('currentTime');
    const totalDurationEl = document.getElementById('totalDuration');

    // FIX 1: HH:MM:SS duration format
    function fmtTime(s) {
    if (isNaN(s) || !s) return '0:00';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${m}:${String(sec).padStart(2,'0')}`;
}

    function updateProgress() {
        const duration = Number.isFinite(vp.duration) ? vp.duration : 0;
        const current = Number.isFinite(vp.currentTime) ? vp.currentTime : 0;
        const pct = duration > 0 ? Math.min(100, Math.max(0, (current / duration) * 100)) : 0;

        progressBarFill.style.width = pct + '%';
        if (progressThumb) progressThumb.style.left = pct + '%';
        progressBarContainer.setAttribute('aria-valuenow', String(Math.round(pct)));
        currentTimeEl.textContent = fmtTime(current);
        totalDurationEl.textContent = fmtTime(duration);
    }

    window.refreshPremiumVideoProgress = updateProgress;

    function seekToClientX(clientX) {
        if (!vp.duration) return;
        const rect = progressBarContainer.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        vp.currentTime = ratio * vp.duration;
        updateProgress();
    }

    playPauseBtn.addEventListener('click', () => {
        if (vp.paused) { vp.play(); playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; }
        else { vp.pause(); playPauseBtn.innerHTML = '<i class="fas fa-play"></i>'; }
        updateFloatingPlayButton();
    });
    vp.addEventListener('play', () => {
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        updateFloatingPlayButton();
    });
    vp.addEventListener('pause', () => {
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        updateFloatingPlayButton();
    });

    skipBackBtn.addEventListener('click', () => {
        vp.currentTime = Math.max(0, vp.currentTime - 10);
        updateProgress();
    });
    skipFwdBtn.addEventListener('click', () => {
        vp.currentTime = Math.min(vp.duration || 0, vp.currentTime + 10);
        updateProgress();
    });

    muteBtn.addEventListener('click', () => {
        vp.muted = !vp.muted;
        muteBtn.innerHTML = vp.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    });
    volumeSlider.addEventListener('input', () => { vp.volume = volumeSlider.value; });

    vp.addEventListener('timeupdate', updateProgress);
    vp.addEventListener('timeupdate', updateVideoCommentComposer);
    vp.addEventListener('durationchange', updateProgress);
    vp.addEventListener('loadedmetadata', updateProgress);
    vp.addEventListener('loadedmetadata', updateVideoCommentComposer);
    vp.addEventListener('seeking', updateProgress);
    vp.addEventListener('seeked', updateProgress);
    vp.addEventListener('ended', () => {
        const state = JSON.parse(sessionStorage.getItem('last_video') || '{}');
        if (state.videoId) {
            let done = getCompletedLectureIds();
            if (!done.includes(String(state.videoId))) {
                done.push(String(state.videoId));
                localStorage.setItem('completed_lectures', JSON.stringify(done));
            }
            saveLectureProgress(state.videoId, { currentTime: 0, duration: vp.duration || 0, completed: true });
            setTimeout(() => playNextLecture(state.videoId), 650);
        }
    });
    progressBarContainer.addEventListener('click', (e) => {
        seekToClientX(e.clientX);
    });
    progressBarContainer.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        progressBarContainer.setPointerCapture(e.pointerId);
        seekToClientX(e.clientX);
    });
    progressBarContainer.addEventListener('pointermove', (e) => {
        if (e.buttons !== 1) return;
        seekToClientX(e.clientX);
    });

    speedBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speedMenu.style.display = speedMenu.style.display === 'none' ? 'block' : 'none';
    });
    document.querySelectorAll('.speed-option').forEach(opt => {
        opt.addEventListener('click', () => {
            vp.playbackRate = parseFloat(opt.dataset.speed);
            if (!speedBtn.querySelector('i')) {
                speedBtn.textContent = opt.dataset.speed + 'x';
            }
            document.getElementById('telegramSpeedValue').textContent = opt.dataset.speed + 'x';
            speedMenu.style.display = 'none';
        });
    });
    document.addEventListener('click', () => speedMenu.style.display = 'none');

    const closeTelegramSettings = () => {
        document.body.classList.remove('telegram-settings-open');
        const telegramSettingsSheet = document.getElementById('telegramSettingsSheet');
        const telegramSpeedChoices = document.getElementById('telegramSpeedChoices');
        if (telegramSettingsSheet) telegramSettingsSheet.setAttribute('aria-hidden', 'true');
        if (telegramSpeedChoices) telegramSpeedChoices.classList.remove('open');
    };

    const telegramPlayerCloseBtn = document.getElementById('telegramPlayerCloseBtn');
    if (telegramPlayerCloseBtn) telegramPlayerCloseBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        closePremiumVideo();
    });

    const telegramSettingsBtn = document.getElementById('telegramSettingsBtn');
    if (telegramSettingsBtn) telegramSettingsBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const willOpen = !document.body.classList.contains('telegram-settings-open');
        document.body.classList.toggle('telegram-settings-open', willOpen);
        const telegramSettingsSheet = document.getElementById('telegramSettingsSheet');
        if (telegramSettingsSheet) telegramSettingsSheet.setAttribute('aria-hidden', willOpen ? 'false' : 'true');
    });

    const telegramSettingsSheet = document.getElementById('telegramSettingsSheet');
    if (telegramSettingsSheet) telegramSettingsSheet.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    document.addEventListener('click', (event) => {
        if (!document.body.classList.contains('telegram-settings-open')) return;
        if (event.target.closest('#telegramSettingsBtn') || event.target.closest('#telegramSettingsSheet')) return;
        closeTelegramSettings();
    });

    const telegramSpeedRow = document.getElementById('telegramSpeedRow');
    if (telegramSpeedRow) telegramSpeedRow.addEventListener('click', () => {
        const telegramSpeedChoices = document.getElementById('telegramSpeedChoices');
        if (telegramSpeedChoices) telegramSpeedChoices.classList.toggle('open');
    });

    document.querySelectorAll('#telegramSpeedChoices button[data-speed]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const speed = Number(btn.dataset.speed) || 1;
            vp.playbackRate = speed;
            if (!speedBtn.querySelector('i')) {
                speedBtn.textContent = btn.dataset.speed + 'x';
            }
            document.getElementById('telegramSpeedValue').textContent = btn.dataset.speed + 'x';
            document.querySelectorAll('#telegramSpeedChoices button[data-speed]').forEach(item => {
                item.classList.toggle('active', item === btn);
            });
            const telegramSpeedChoices = document.getElementById('telegramSpeedChoices');
            if (telegramSpeedChoices) telegramSpeedChoices.classList.remove('open');
        });
    });

    const telegramPipBtn = document.getElementById('telegramPipBtn');
    if (telegramPipBtn) telegramPipBtn.addEventListener('click', async () => {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (document.pictureInPictureEnabled && vp.requestPictureInPicture) {
                await vp.requestPictureInPicture();
            } else {
                showMiniToast('Picture in picture supported nahi hai.');
            }
        } catch {
            showMiniToast('Picture in picture open nahi ho paya.');
        }
        closeTelegramSettings();
    });

    const setFallbackFullscreen = async (active) => {
        syncAppViewportHeight();
        const videoModalEl = document.getElementById('videoModal');
        if (videoModalEl) videoModalEl.classList.remove('is-floating');
        const shouldRotateFallback = active && window.innerWidth < window.innerHeight;
        document.body.classList.toggle('telegram-fullscreen-active', active);
        document.body.classList.toggle('telegram-landscape-active', shouldRotateFallback);
        document.body.classList.toggle('video-modal-open', active || (videoModalEl && videoModalEl.style.display === 'flex'));
        fullscreenBtn.innerHTML = active ? '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';
        try {
            if (active && screen.orientation && screen.orientation.lock) {
                await screen.orientation.lock('landscape');
            } else if (!active && screen.orientation && screen.orientation.unlock) {
                screen.orientation.unlock();
            }
        } catch {}
    };

    const toggleVideoFullscreen = async () => {
        syncAppViewportHeight();
        const isFallbackActive = document.body.classList.contains('telegram-fullscreen-active');
        if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
            const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
            if (exit) {
                try { await exit.call(document); } catch {}
            }
            setFallbackFullscreen(false);
            return;
        }
        if (isFallbackActive) {
            setFallbackFullscreen(false);
            return;
        }

        const req = vp.requestFullscreen || vp.webkitRequestFullscreen || vp.webkitEnterFullscreen || vp.mozRequestFullScreen || vp.msRequestFullscreen;
        if (!req) {
            setFallbackFullscreen(true);
            return;
        }
        try {
            const result = req.call(vp);
            if (result && result.catch) await result;
            setTimeout(() => {
                if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.body.classList.contains('telegram-fullscreen-active')) {
                    setFallbackFullscreen(true);
                }
            }, isTelegramWebView() ? 250 : 700);
        } catch {
            setFallbackFullscreen(true);
        }
    };

    fullscreenBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleVideoFullscreen();
    });

document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
        fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
    } else {
        document.body.classList.remove('telegram-fullscreen-active', 'telegram-landscape-active');
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
    }
});
document.addEventListener('webkitfullscreenchange', () => {
    if (document.webkitFullscreenElement) {
        fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
    } else {
        document.body.classList.remove('telegram-fullscreen-active', 'telegram-landscape-active');
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
    }
});

// Video click = pause/resume (with delay to avoid conflict)
let clickTimeout = null;
vp.addEventListener('click', (e) => {
    e.stopPropagation();
    clearTimeout(clickTimeout);
    clickTimeout = setTimeout(() => {
        if (vp.paused) vp.play();
        else vp.pause();
    }, 200);
});

// F key = fullscreen, Space = pause/resume, Arrows = skip/volume, Volume keys support
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('videoModal');
    if (!modal || modal.style.display !== 'flex') return;
    if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;

    const vp = document.getElementById('videoPlayer');
    const volumeSlider = document.getElementById('volumeSlider');
    if (!vp) return;

    if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleVideoFullscreen();
    }

    if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (vp.paused) vp.play().catch(() => {});
        else vp.pause();
    }

    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        vp.currentTime = Math.max(0, vp.currentTime - 10);
    }

    if (e.key === 'ArrowRight') {
        e.preventDefault();
        vp.currentTime = Math.min(vp.duration || 0, vp.currentTime + 10);
    }

    if (e.key === 'ArrowUp' || e.key === 'VolumeUp') {
        e.preventDefault();
        vp.volume = Math.min(1.0, vp.volume + 0.05);
        if (volumeSlider) volumeSlider.value = vp.volume;
    }

    if (e.key === 'ArrowDown' || e.key === 'VolumeDown') {
        e.preventDefault();
        vp.volume = Math.max(0.0, vp.volume - 0.05);
        if (volumeSlider) volumeSlider.value = vp.volume;
    }
});

    const floatingExpandBtn = document.getElementById('floatingExpandBtn');
    if (floatingExpandBtn) floatingExpandBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        expandPremiumVideo();
    });

    const floatingPlayBtn = document.getElementById('floatingPlayBtn');
    if (floatingPlayBtn) floatingPlayBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (vp.paused) vp.play();
        else vp.pause();
        updateFloatingPlayButton();
    });

    const floatingCloseBtn = document.getElementById('floatingCloseBtn');
    if (floatingCloseBtn) floatingCloseBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        closePremiumVideo();
    });

    const floatingPlayerShell = document.getElementById('floatingPlayerShell');
    if (floatingPlayerShell) floatingPlayerShell.addEventListener('click', (event) => {
        if (event.target.closest('button')) return;
        expandPremiumVideo();
    });

    document.getElementById('videoBackBtn').addEventListener('click', () => {
        closePremiumVideo();
    });

    document.getElementById('attachmentsToggleBtn').addEventListener('click', () => {
        const panel = document.getElementById('attachmentsPanel');
        const list = document.getElementById('attachmentsList');
        if (!panel || !list) return;

        const isCurrentlyShowing = !panel.classList.contains('hidden') && list.style.display !== 'none';
        if (isCurrentlyShowing) {
            setSidebarView('none');
        } else {
            setSidebarView('attachments');
        }
    });

    const notesToggleBtn = document.getElementById('notesToggleBtn');
    if (notesToggleBtn) {
        notesToggleBtn.addEventListener('click', () => {
            const panel = document.getElementById('attachmentsPanel');
            const box = document.getElementById('videoCommentsBox');
            if (!panel || !box) return;

            const isCurrentlyShowing = !panel.classList.contains('hidden') && box.style.display !== 'none';
            if (isCurrentlyShowing) {
                setSidebarView('none');
            } else {
                setSidebarView('comments');
            }
        });
    }

const videoCommentAddBtn = document.getElementById('videoCommentAddBtn');
if (videoCommentAddBtn) videoCommentAddBtn.addEventListener('click', addVideoComment);
const videoCommentCancelBtn = document.getElementById('videoCommentCancelBtn');
if (videoCommentCancelBtn) videoCommentCancelBtn.addEventListener('click', cancelVideoCommentEdit);
const videoCommentInput = document.getElementById('videoCommentInput');
if (videoCommentInput) videoCommentInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        addVideoComment();
    } else if (event.key === 'Escape') {
        event.preventDefault();
        cancelVideoCommentEdit();
    }
});

const videoLoader = document.getElementById('videoLoaderOverlay');
const hideVideoLoader = () => {
    if (videoLoader) videoLoader.style.display = 'none';
};
const showVideoLoader = () => {
    if (videoLoader) videoLoader.style.display = 'flex';
};

if (vp) {
    vp.addEventListener('playing', hideVideoLoader);
    vp.addEventListener('canplay', hideVideoLoader);
    vp.addEventListener('waiting', showVideoLoader);
    vp.addEventListener('error', hideVideoLoader);
    vp.addEventListener('abort', hideVideoLoader);
}
})();



async function fetchContinueDuration(videoId, channelId) {
    const el = document.getElementById(`cw-dur-${videoId}`);
    if (!el || !videoId || !channelId) return;

    const cache = getVidDurCache();
    const now = Date.now();
    if (cache[videoId] && now - cache[videoId].t < VID_DUR_TTL && cache[videoId].d) {
        el.textContent = cache[videoId].d;
        return;
    }

    try {
        const res = await fetch(`https://ascii-newspaper-whilst-year.trycloudflare.com/stream/${channelId}/${videoId}/duration`, { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            const secs = Math.floor(data.duration || data.length || data.seconds || 0);
            if (secs && isFinite(secs)) {
                const formatted = fmtTime(secs);
                const c2 = getVidDurCache();
                c2[videoId] = { d: formatted, t: now };
                saveVidDurCache(c2);
                const elNow = document.getElementById(`cw-dur-${videoId}`);
                if (elNow) elNow.textContent = formatted;
                return;
            }
        }
    } catch {}

    const tempVid = document.createElement('video');
    tempVid.preload = 'metadata';
    tempVid.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;';
    document.body.appendChild(tempVid);
    tempVid.src = `${STREAM_BASE_API}${channelId}/${videoId}`;
    tempVid.onloadedmetadata = () => {
        const secs = Math.floor(tempVid.duration);
        tempVid.src = '';
        tempVid.remove();
        if (!secs || !isFinite(secs)) return;

        const formatted = fmtTime(secs);
        const c2 = getVidDurCache();
        c2[videoId] = { d: formatted, t: now };
        saveVidDurCache(c2);
        const elNow = document.getElementById(`cw-dur-${videoId}`);
        if (elNow) elNow.textContent = formatted;
    };
    tempVid.onerror = () => tempVid.remove();
}

function findLectureContext(videoId, channelId = '') {
    const wantedVideoId = String(videoId || '');
    const wantedChannelId = String(channelId || '');
    if (!wantedVideoId) return null;

    for (const source of getGatewayBatchSources()) {
        const data = window[source.dataKey] || [];
        for (let subjectIndex = 0; subjectIndex < data.length; subjectIndex++) {
            const subject = data[subjectIndex];
            const subjectChannelId = String((subject && subject.channel_id) || '');
            if (wantedChannelId && subjectChannelId && subjectChannelId !== wantedChannelId) continue;

            const chapters = (subject && subject.chapters) || [];
            for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex++) {
                const chapter = chapters[chapterIndex];
                const lecture = ((chapter && chapter.lectures) || []).find(lec => String((lec && lec.video_id) || '') === wantedVideoId);
                if (lecture) {
                    return { source, data, subject, subjectIndex, chapter, chapterIndex, lecture };
                }
            }
        }
    }
    return wantedChannelId ? findLectureContext(videoId, '') : null;
}

function restoreContextForVideo(videoId, channelId, item = {}) {
    const context = findLectureContext(videoId, channelId);
    if (context) {
        currentBatchData = context.data;
        currentBatchDataKey = context.source.dataKey;
        currentBatchTitle = context.source.title;
        selectedSubject = context.subject;
        selectedSubjectIndex = context.subjectIndex;
        selectedChapter = context.chapter;
        selectedChapterIndex = context.chapterIndex;
        selectedChannelId = (context.subject && context.subject.channel_id) || channelId || selectedChannelId;
        return context;
    }

    const source = getGatewayBatchSources().find(src =>
        src.dataKey === item.batchDataKey ||
        src.title === item.batchTitle ||
        src.title.toLowerCase() === String(item.batchTitle || '').toLowerCase()
    );
    if (source) {
        currentBatchData = window[source.dataKey] || [];
        currentBatchDataKey = source.dataKey;
        currentBatchTitle = source.title;
    }
    selectedChannelId = channelId || selectedChannelId;
    return null;
}

function replayFromHistory(videoId, title, channelId, item = null) {
    if (!videoId || !channelId) return;
    const savedItem = item || JSON.parse(localStorage.getItem('watch_history') || '[]').find(historyItem => String(historyItem.videoId) === String(videoId)) || {};
    const context = restoreContextForVideo(videoId, channelId, savedItem);
    batchDataModal.classList.remove('active');
    const historyModal = document.getElementById('historyModal');
    if (historyModal) historyModal.remove();
    openPremiumVideo(videoId, title || (context && context.lecture && context.lecture.title) || 'Video', (context && context.chapter) || selectedChapter || null);
}

function setSidebarView(view) {
    const panel = document.getElementById('attachmentsPanel');
    const list = document.getElementById('attachmentsList');
    const commentsBox = document.getElementById('videoCommentsBox');
    if (!panel) return;

    if (view === 'none') {
        panel.classList.add('hidden');
        panel.style.display = 'none';
        if (list) list.style.display = 'none';
        if (commentsBox) commentsBox.style.display = 'none';
    } else if (view === 'attachments') {
        panel.classList.remove('hidden');
        panel.style.display = '';
        if (list) list.style.display = 'block';
        if (commentsBox) commentsBox.style.display = 'none';
    } else if (view === 'comments') {
        panel.classList.remove('hidden');
        panel.style.display = '';
        if (list) list.style.display = 'none';
        if (commentsBox) commentsBox.style.display = 'flex';
    }
}

function renderVideoComments() {
    const box = document.getElementById('videoCommentsBox');
    const list = document.getElementById('videoCommentsList');
    if (!box || !list || !currentCommentKey) return;
    
    const panel = document.getElementById('attachmentsPanel');
    const attachList = document.getElementById('attachmentsList');
    const isSidebarVisible = panel && !panel.classList.contains('hidden');
    const isAttachListVisible = attachList && attachList.style.display !== 'none';
    if (isSidebarVisible && !isAttachListVisible) {
        box.style.display = 'flex';
    }
    const comments = readVideoComments(currentCommentKey);
    const sub = document.getElementById('videoCommentsSub');
    if (sub) sub.textContent = comments.length ? `${comments.length} timestamped note${comments.length > 1 ? 's' : ''}` : 'Timestamped comments';

    list.innerHTML = comments.length ? comments.map((rawItem, index) => {
        const item = normalizeVideoComment(rawItem);
        const hasTime = Number.isFinite(item.videoTime);
        return `
        <div class="video-comment-item ${editingVideoCommentIndex === index ? 'is-editing' : ''}">
            <button class="video-comment-time" type="button" onclick="seekToVideoComment(${index})" title="Jump to this moment">${hasTime ? formatDuration(item.videoTime) : '--:--'}</button>
            <div class="video-comment-text">
                ${escapeHtml(item.text)}
                <div class="video-comment-meta">${item.updatedAt ? 'Edited' : 'Added'} ${timeAgo(item.updatedAt || item.t || Date.now())}</div>
            </div>
            <div class="video-comment-actions">
                <button class="video-comment-icon" type="button" onclick="editVideoComment(${index})" title="Edit note"><i class="fas fa-pen"></i></button>
                <button class="video-comment-icon delete" type="button" onclick="deleteVideoComment(${index})" title="Delete note"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
    }).join('') : '<div class="video-comment-empty">No notes yet. Add one while watching and it will save with the current time.</div>';
    updateVideoCommentComposer();
}

function addVideoComment() {
    const input = document.getElementById('videoCommentInput');
    const text = ((input && input.value) || '').trim();
    if (!text || !currentCommentKey) return;
    const vp = document.getElementById('videoPlayer');
    const comments = readVideoComments(currentCommentKey);
    if (editingVideoCommentIndex >= 0 && comments[editingVideoCommentIndex]) {
        const old = normalizeVideoComment(comments[editingVideoCommentIndex]);
        comments[editingVideoCommentIndex] = { ...old, text, updatedAt: Date.now() };
    } else {
        comments.push({ text, videoTime: Math.floor((vp && vp.currentTime) || 0), t: Date.now() });
    }
    saveVideoComments(currentCommentKey, comments);
    input.value = '';
    editingVideoCommentIndex = -1;
    renderVideoComments();
}

function normalizeVideoComment(item) {
    if (typeof item === 'string') return { text: item, videoTime: NaN, t: Date.now() };
    return {
        text: (item && item.text) || '',
        videoTime: Number.isFinite(Number(item && item.videoTime)) ? Number(item.videoTime) : NaN,
        t: (item && item.t) || Date.now(),
        updatedAt: (item && item.updatedAt) || null
    };
}

function updateVideoCommentComposer() {
    const vp = document.getElementById('videoPlayer');
    const input = document.getElementById('videoCommentInput');
    const addLabel = document.getElementById('videoCommentAddLabel');
    const timeLabel = document.getElementById('videoCommentTimeLabel');
    const cancelBtn = document.getElementById('videoCommentCancelBtn');
    const isEditing = editingVideoCommentIndex >= 0;
    if (addLabel) addLabel.textContent = isEditing ? 'Update' : 'Add';
    if (timeLabel) timeLabel.textContent = isEditing ? 'Note' : formatDuration((vp && vp.currentTime) || 0);
    if (cancelBtn) cancelBtn.style.display = isEditing ? 'inline-flex' : 'none';
    if (input) input.placeholder = isEditing ? 'Update this note...' : 'Write a note for this moment...';
}

function seekToVideoComment(index) {
    if (!currentCommentKey) return;
    const item = normalizeVideoComment(readVideoComments(currentCommentKey)[index]);
    if (!Number.isFinite(item.videoTime)) return;
    const vp = document.getElementById('videoPlayer');
    const modal = document.getElementById('videoModal');
    if (!vp) return;
    if (modal) modal.classList.remove('is-floating');
    if (modal) modal.style.display = 'flex';
    overlay.style.display = 'block';
    vp.currentTime = Math.max(0, item.videoTime);
    vp.play().catch(() => {});
    if (typeof window.refreshPremiumVideoProgress === 'function') window.refreshPremiumVideoProgress();
}

function editVideoComment(index) {
    if (!currentCommentKey) return;
    const input = document.getElementById('videoCommentInput');
    const item = normalizeVideoComment(readVideoComments(currentCommentKey)[index]);
    editingVideoCommentIndex = index;
    if (input) {
        input.value = item.text;
        input.focus();
    }
    renderVideoComments();
}

function cancelVideoCommentEdit() {
    editingVideoCommentIndex = -1;
    const input = document.getElementById('videoCommentInput');
    if (input) input.value = '';
    renderVideoComments();
}

function deleteVideoComment(index) {
    if (!currentCommentKey) return;
    const comments = readVideoComments(currentCommentKey);
    comments.splice(index, 1);
    saveVideoComments(currentCommentKey, comments);
    if (editingVideoCommentIndex === index) editingVideoCommentIndex = -1;
    else if (editingVideoCommentIndex > index) editingVideoCommentIndex -= 1;
    renderVideoComments();
}

function formatWatchMinutes(seconds) {
    const mins = Math.round((Number(seconds) || 0) / 60);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function formatDuration(seconds) {
    const s = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}

function fmtTime(seconds) {
    return formatDuration(seconds);
}

function renderStudyStats() {
    const box = document.getElementById('studyStatsBox');
    if (!box) return;
    const stats = readJson(STUDY_STATS_KEY, { totalSeconds: 0, todaySeconds: 0, streak: 0 });
    box.innerHTML = [
        ['Today', formatWatchMinutes(stats.todaySeconds)],
        ['Streak', `${Number(stats.streak) || 0} days`],
        ['Total', formatWatchMinutes(stats.totalSeconds)]
    ].map(([label, value]) => `
        <div style="padding:12px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:0.72rem;color:var(--text-secondary);">${label}</div>
            <div style="font-weight:800;font-size:1rem;margin-top:4px;color:var(--neon-blue);">${value}</div>
        </div>
    `).join('');
}

function playNextLecture(currentVideoId) {
    const lectures = (selectedChapter && selectedChapter.lectures) || [];
    const currentIndex = lectures.findIndex(lecture => String(lecture.video_id) === String(currentVideoId));
    const next = currentIndex >= 0 ? lectures.slice(currentIndex + 1).find(lecture => lecture.video_id) : null;
    if (!next) {
        showMiniToast('Chapter complete.');
        return;
    }
    openPremiumVideo(next.video_id, next.title || 'Next Lecture', selectedChapter);
}

function renderPinnedBatches() {
    const container = document.getElementById('pinnedBatchesContainer');
    if (!container) return;
    const enrolled = readEnrolledBatches();
    if (!enrolled.length) {
        container.innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem;padding:8px;">Enroll batches from Courses.</p>';
        return;
    }
    container.innerHTML = enrolled.map((dataKey) => {
        const source = getGatewayBatchSources().find(item => item.dataKey === dataKey);
        const data = source ? (window[source.dataKey] || []) : [];
        if (!source || !data.length) return '';
        const progress = getBatchProgress(data);
        return `
            <div class="continue-item" data-pinned-key="${source.dataKey}" style="cursor:pointer;">
                <div class="continue-thumbnail" style="background:${getBatchThumbBackground(source.dataKey)};"><div class="continue-progress" style="width:${progress.pct}%;"></div></div>
                <div class="continue-info">
                    <div class="continue-title">${escapeHtml(source.title)}</div>
                    <div class="continue-meta"><span>${progress.done}/${progress.total} done</span><span>${progress.pct}%</span></div>
                </div>
            </div>`;
    }).join('');
    container.querySelectorAll('[data-pinned-key]').forEach(card => {
        card.addEventListener('click', () => {
            const source = getGatewayBatchSources().find(item => item.dataKey === card.dataset.pinnedKey);
            if (source) openBatchModal(window[source.dataKey] || [], source.title);
        });
    });
}

function updateBatchCardProgress() {
    getGatewayBatchSources().forEach((source) => {
        const cardMatch = document.querySelector(`.batch-card[data-batch-key="${source.dataKey}"], .batch-card .enroll-batch-btn[data-batch-key="${source.dataKey}"]`);
        const card = cardMatch && cardMatch.closest('.batch-card');
        const data = window[source.dataKey] || [];
        if (!card || !data.length) return;
        const progress = getBatchProgress(data);
        let bar = card.querySelector('.batch-progress-mini');
        if (!bar) {
            bar = document.createElement('div');
            bar.className = 'batch-progress-mini';
            bar.style.cssText = 'margin-top:8px;font-size:0.72rem;color:var(--text-secondary);';
            const batchDetails = card.querySelector('.batch-details');
            if (batchDetails) batchDetails.appendChild(bar);
        }
        bar.innerHTML = `
            <div>${progress.done}/${progress.total} lectures done - ${progress.pct}%</div>
            <div class="batch-progress-bar-wrap"><div class="batch-progress-bar-fill" style="width:${progress.pct}%;"></div></div>
        `;
    });
}

function renderRecentSubjects() {
    const container = document.getElementById('recentSubjectsContainer');
    if (!container) return;
    const recent = readJson(RECENT_SUBJECTS_KEY, []);
    if (!recent.length) {
        container.innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem;padding:8px;">Open a subject to see it here.</p>';
        return;
    }
    container.innerHTML = recent.map((item, index) => `
        <div class="continue-item" data-recent-index="${index}" style="cursor:pointer;">
            <div class="continue-thumbnail" style="background:${getCleanBatchThumbBackground(item.dataKey)};"></div>
            <div class="continue-info">
                <div class="continue-title">${escapeHtml(item.subjectTitle)}</div>
                <div class="continue-meta"><span>${escapeHtml(item.title)}</span><span>${timeAgo(item.timestamp)}</span></div>
            </div>
        </div>
    `).join('');
    container.querySelectorAll('[data-recent-index]').forEach(card => {
        card.addEventListener('click', () => {
            const item = recent[Number(card.dataset.recentIndex)];
            const source = item && getGatewayBatchSources().find(src => src.dataKey === item.dataKey);
            const data = source ? (window[source.dataKey] || []) : [];
            const subject = data[item.subjectIndex];
            if (!source || !subject) return;
            openBatchModal(data, source.title);
            renderChapters(subject, item.subjectIndex);
        });
    });
}

function renderContinueWatching() {
    const history = JSON.parse(localStorage.getItem('watch_history') || '[]');
    const container = document.querySelector('.continue-watching');
    if (!container) return;

    if (history.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary); font-size:0.85rem; padding:8px;">Koi video nahi dekhi abhi tak.</p>';
        return;
    }

    const visibleHistory = history.slice(0, 10);
    container.innerHTML = visibleHistory.map((item, index) => {
        const progress = getLectureProgress(item.videoId);
        const context = findLectureContext(item.videoId, item.channelId);
        const thumbKey = item.batchDataKey || (context && context.source && context.source.dataKey) || item.batchTitle || (context && context.source && context.source.title) || '';
        const batchTitle = item.batchTitle || (context && context.source && context.source.title) || 'CODExTRMS';
        return `
        <div class="continue-item" data-history-index="${index}" style="cursor:pointer;">
            <div class="continue-thumbnail" style="background:${getCleanBatchThumbBackground(thumbKey)};">
                <div class="favorite-icon" style="display:none;"></div>
            </div>
            <div class="continue-info">
                <div class="continue-title" title="${escapeHtml(item.title || 'Video')}">${escapeHtml(item.title || 'Video')}</div>
                <div class="continue-meta">
                    <span>${escapeHtml(batchTitle)}</span>
                    <span id="cw-dur-${item.videoId}" style="font-size:0.75rem; color:var(--neon-blue);">${progress && progress.currentTime > 5 ? `Resume ${formatDuration(progress.currentTime)}` : '--:--'}</span>
                </div>
            </div>
        </div>
    `;
    }).join('');

    container.querySelectorAll('.continue-item[data-history-index]').forEach((card) => {
        card.addEventListener('click', () => {
            const item = visibleHistory[Number(card.dataset.historyIndex)];
            if (!item) return;
            replayFromHistory(item.videoId, item.title, item.channelId, item);
        });
    });

    visibleHistory.forEach((item) => fetchContinueDuration(item.videoId, item.channelId));
}

window.addEventListener('load', renderContinueWatching);
window.addEventListener('load', renderPinnedBatches);
window.addEventListener('load', renderRecentSubjects);
window.addEventListener('load', renderStudyStats);
window.addEventListener('load', updateBatchCardProgress);
window.addEventListener('load', detectCatalogNotifications);
    function showFullHistory() {
    const history = JSON.parse(localStorage.getItem('watch_history') || '[]');
    const modal = document.createElement('div');
        modal.id = 'historyModal';  // YE ADD KARO
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0a0a0f;overflow-y:auto;padding:20px;';
    modal.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;position:sticky;top:0;background:#0a0a0f;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
            <button onclick="document.getElementById('historyModal').remove();setActiveSection(localStorage.getItem('codextrms_last_active_section') || 'dashboardSection');" style="background:none;border:none;color:#fff;font-size:1.2rem;cursor:pointer;"><i class="fas fa-arrow-left"></i></button>
            <span style="font-size:1.1rem;font-weight:700;">Watch History</span>
            <button onclick="localStorage.removeItem('watch_history');document.getElementById('historyModal').remove();renderContinueWatching();" style="margin-left:auto;padding:6px 14px;border-radius:999px;border:1px solid rgba(255,0,0,0.4);background:rgba(255,0,0,0.1);color:#ff4d6d;cursor:pointer;font-size:0.8rem;">Clear All</button>
        </div>
        ${history.length === 0 ? '<p style="color:var(--text-secondary);text-align:center;margin-top:40px;">Koi history nahi hai.</p>' :
        history.map(item => `
            <div onclick="replayFromHistory('${item.videoId}','${item.title.replace(/'/g,"\\'")}','${item.channelId}');this.closest('div[style*=inset]').remove();"
                style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:10px;background:rgba(255,255,255,0.05);margin-bottom:8px;cursor:pointer;border:1px solid rgba(255,255,255,0.07);">
                <div style="width:50px;height:50px;border-radius:10px;background:linear-gradient(45deg,var(--neon-blue),var(--neon-purple));display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fas fa-play" style="color:#000;font-size:1rem;"></i>
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:600;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.title}</div>
                    <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:3px;">${item.batchTitle || 'CODExTRMS'} • ${timeAgo(item.timestamp)}</div>
                </div>
                <i class="fas fa-play-circle" style="color:var(--neon-blue);font-size:1.2rem;flex-shrink:0;"></i>
            </div>
        `).join('')}
    `;
    document.body.appendChild(modal);
}    
        document.addEventListener('click', (e) => {
    if (e.target.id === 'historyBackBtn' || e.target.closest('#historyBackBtn')) {
        const modal = document.getElementById('historyModal');
        if (modal) modal.remove();
    }
});

        function showDonateModal() {
    const modal = document.createElement('div');
    modal.id = 'donateModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML = `
        <div style="background:#121A2A;border-radius:20px;padding:24px;max-width:340px;width:100%;text-align:center;position:relative;border:1px solid rgba(255,255,255,0.1);">
            <button onclick="document.getElementById('donateModal').remove()" style="position:absolute;top:12px;right:14px;background:none;border:none;color:rgba(255,255,255,0.6);font-size:1.3rem;cursor:pointer;">&times;</button>
            
            <div style="font-size:1.1rem;font-weight:700;margin-bottom:4px;">Support CODExTRMS 💜</div>
            <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:16px;">Scan QR ya UPI ID se donate karo</div>
            
            <img src="/image/qrcode.jpg" alt="QR Code" style="width:200px;height:200px;border-radius:12px;object-fit:cover;margin-bottom:16px;border:2px solid rgba(255,255,255,0.1);">
            
            <div style="background:rgba(255,255,255,0.06);border-radius:10px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
                <div>
                    <div style="font-size:0.7rem;color:var(--text-secondary);">UPI ID</div>
                    <div style="font-size:0.95rem;font-weight:700;" id="upiIdText">codextrms@slc</div>
                </div>
                <button onclick="navigator.clipboard.writeText('codextrms@slc').then(()=>{this.textContent='Copied!';this.style.color='#22c55e';setTimeout(()=>{this.textContent='Copy';this.style.color='';},2000)})" 
                    style="padding:6px 14px;border-radius:999px;border:1px solid rgba(255,255,255,0.2);background:transparent;color:var(--text-primary);cursor:pointer;font-size:0.8rem;font-weight:600;white-space:nowrap;">
                    Copy
                </button>
            </div>

            <div style="font-size:0.75rem;color:var(--text-secondary);">Account: MR BITTU KUMAR</div>
            
            <button onclick="
                const link = document.createElement('a');
                link.href = '/image/qrcode.jpg';
                link.download = 'CODExTRMS_QR.jpg';
                link.click();
            " style="margin-top:14px;width:100%;padding:10px;border-radius:10px;border:none;background:linear-gradient(45deg,var(--neon-blue),var(--neon-pink));color:#000;font-weight:700;cursor:pointer;font-size:0.9rem;">
                <i class="fas fa-download"></i> QR Download karo
            </button>
        </div>
    `;
    document.body.appendChild(modal);
    // Bahar click kare tho close ho
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function getFavoriteBatchSource(keyOrTitle) {
    return getGatewayBatchSources().find((source) =>
        source.dataKey === keyOrTitle ||
        source.title === keyOrTitle ||
        source.title.toLowerCase() === String(keyOrTitle).toLowerCase()
    );
}

function openFavoriteSubject(keyOrTitle, subjectIndex) {
    const source = getFavoriteBatchSource(keyOrTitle);
    const data = source ? (window[source.dataKey] || []) : [];
    const subject = data[subjectIndex];
    if (!source || !subject) return;

    const favModal = document.getElementById('favModal');
    if (favModal) favModal.remove();
    openBatchModal(data, source.title);
    renderChapters(subject, subjectIndex);
}

function openFavoriteBatch(keyOrTitle) {
    const source = getFavoriteBatchSource(keyOrTitle);
    const data = source ? (window[source.dataKey] || []) : [];
    if (!source || !data.length) return;

    const favModal = document.getElementById('favModal');
    if (favModal) favModal.remove();
    openBatchModal(data, source.title);
}

function refreshFavoritesModal(tab = 'batches') {
    const favModal = document.getElementById('favModal');
    if (favModal) favModal.remove();
    showFavoritesModal();
    switchFavoriteTab(tab);
}

function removeFavoriteBatch(dataKey) {
    saveEnrolledBatches(readEnrolledBatches().filter(item => item !== dataKey));
    updateEnrollButtons();
    refreshFavoritesModal('batches');
    showMiniToast('Batch remove ho gaya.');
}

function removeFavoriteSubject(subjectIndex) {
    favoriteSubjects = favoriteSubjects.filter(index => Number(index) !== Number(subjectIndex));
    localStorage.setItem(GATEWAY_FAVORITE_SUBJECTS_KEY, JSON.stringify(favoriteSubjects));
    refreshFavoritesModal('subjects');
    showMiniToast('Subject favorite se remove ho gaya.');
}

function removeFavoriteChapter(favKey) {
    favoriteChapters = favoriteChapters.filter(key => key !== favKey);
    localStorage.setItem(FAVORITE_CHAPTERS_KEY, JSON.stringify(favoriteChapters));
    refreshFavoritesModal('chapters');
    showMiniToast('Chapter favorite se remove ho gaya.');
}

function openFavoriteChapter(keyOrTitle, subjectIndex, chapterIndex) {
    const source = getFavoriteBatchSource(keyOrTitle);
    const data = source ? (window[source.dataKey] || []) : [];
    const subject = data[subjectIndex];
    const chapter = subject && subject.chapters && subject.chapters[chapterIndex];
    if (!source || !subject || !chapter) return;

    const favModal = document.getElementById('favModal');
    if (favModal) favModal.remove();
    openBatchModal(data, source.title);
    renderChapters(subject, subjectIndex);
    renderChapterDetails(chapter, chapterIndex);
}

function switchFavoriteTab(tab) {
    const tabs = ['subjects', 'chapters'];
    tabs.forEach((name) => {
        const content = document.getElementById(`fav${name.charAt(0).toUpperCase() + name.slice(1)}Content`);
        const button = document.getElementById(`favTab${name.charAt(0).toUpperCase() + name.slice(1)}`);
        const isActive = name === tab;
        if (content) content.style.display = isActive ? 'block' : 'none';
        if (button) {
            button.style.background = isActive ? 'linear-gradient(45deg,var(--neon-blue),var(--neon-pink))' : 'transparent';
            button.style.color = isActive ? '#000' : 'var(--text-primary)';
            button.style.border = isActive ? 'none' : '1px solid rgba(255,255,255,0.22)';
        }
    });
}

function readDownloads() {
    try {
        return JSON.parse(localStorage.getItem('my_downloads') || '[]');
    } catch {
        return [];
    }
}


function openPdfViewer(url, title = 'PDF') {
    if (!url) {
        showMiniToast('PDF link missing hai.');
        return;
    }
    const viewerUrl = `pdf.html?url=${encodeURIComponent(normalizeStreamUrl(url))}&title=${encodeURIComponent(title || 'PDF')}`;
    const opened = isTelegramWebView() ? null : window.open(viewerUrl, '_blank');
    if (!opened) window.location.href = viewerUrl;
}

function timeAgo(timestamp) {
    const time = Number(timestamp) || Date.now();
    const seconds = Math.max(1, Math.floor((Date.now() - time) / 1000));
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years === 1 ? '' : 's'} ago`;
}

        function showFavoritesModal() {
    const favModal = document.getElementById('favModal');
    if (favModal) favModal.remove();
    const favSubjects = JSON.parse(localStorage.getItem('gateway_favorite_subjects') || '[]');
    const favChapters = JSON.parse(localStorage.getItem('gateway_favorite_chapters') || '[]');

    // Sab batches ka data
    const allBatches = [
        { title: 'GATEWAY – 1ST YEAR', data: window.dataClass13 || [] },
        { title: 'APNA COLLEGE', data: window.dataClass11 || [] },
        { title: 'CHAI AUR CODE', data: window.dataClass101 || [] },
        { title: 'CODE WITH HARRY', data: window.dataClass114 || [] },
        { title: 'SUPREME COURSE', data: window.dataClass102 || [] },
        { title: 'PW SKILLS', data: window.dataClass105 || [] },
        { title: 'UDEMY', data: window.dataClass108 || [] },
        { title: 'TRADING', data: window.dataClass109 || [] },
        { title: 'DevOps', data: window.dataClass110 || [] },
        { title: 'HARKIRAT COHORT', data: window.dataClass111 || [] },
        { title: 'Campus', data: window.dataClass113 || [] },
        { title: 'INEURON', data: window.dataClass116 || [] },
    ];

    allBatches.forEach((batch) => {
        const source = resolveGatewayBatchSource(batch.data, batch.title);
        batch.dataKey = source.dataKey || batch.dataKey || '';
        batch.title = source.title || batch.title;
    });

    // Favorite subjects collect karo
    let favSubjectHtml = '';
    allBatches.forEach(batch => {
        batch.data.forEach((subject, idx) => {
            if (favSubjects.includes(idx)) {
                const totalLec = (subject.chapters || []).flatMap(c => c.lectures || []).length;
                const badge = getSubjectBadge(subject.batch_name || '');
                favSubjectHtml += `
                    <div style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:10px;background:rgba(255,255,255,0.06);margin-bottom:8px;cursor:pointer;border:1px solid rgba(255,255,255,0.08);"
                        onclick="openFavoriteSubject('${(batch.dataKey || batch.title).replace(/'/g, "\\'")}', ${idx})">
                        <div style="width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:700;color:${badge.color};background:rgba(255,255,255,0.04);border:1px solid ${badge.color}55;flex-shrink:0;">${badge.text}</div>
                        <div style="flex:1;min-width:0;">
                            <div style="font-weight:600;font-size:0.88rem;">${subject.batch_name || 'Subject'}</div>
                            <div style="font-size:0.75rem;color:var(--text-secondary);">${batch.title} • ${totalLec} Lectures</div>
                        </div>
                        <button onclick="event.stopPropagation(); removeFavoriteSubject(${idx})" title="Remove favorite"
                            style="width:30px;height:30px;border-radius:50%;border:none;background:transparent;color:#ff4d6d;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;">
                            <i class="fas fa-heart" style="font-size:0.95rem;"></i>
                        </button>
                    </div>`;
            }
        });
    });

    // Favorite chapters collect karo
    let favChapterHtml = '';
    allBatches.forEach(batch => {
        batch.data.forEach((subject, sIdx) => {
            (subject.chapters || []).forEach((chapter, cIdx) => {
                const favKey = `${sIdx}_${cIdx}`;
                if (favChapters.includes(favKey)) {
                    const totalLec = (chapter.lectures || []).length;
                    favChapterHtml += `
                        <div style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:10px;background:rgba(255,255,255,0.06);margin-bottom:8px;cursor:pointer;border:1px solid rgba(255,255,255,0.08);"
                            onclick="openFavoriteChapter('${(batch.dataKey || batch.title).replace(/'/g, "\\'")}', ${sIdx}, ${cIdx})">
                            <div style="width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:700;color:var(--neon-blue);background:rgba(0,240,255,0.08);border:1px solid rgba(0,240,255,0.2);flex-shrink:0;">CH${String(cIdx+1).padStart(2,'0')}</div>
                            <div style="flex:1;min-width:0;">
                                <div style="font-weight:600;font-size:0.88rem;">${chapter.chapter_name || 'Chapter'}</div>
                                <div style="font-size:0.75rem;color:var(--text-secondary);">${subject.batch_name || ''} • ${totalLec} Lectures</div>
                            </div>
                            <button onclick="event.stopPropagation(); removeFavoriteChapter('${favKey}')" title="Remove favorite"
                                style="width:30px;height:30px;border-radius:50%;border:none;background:transparent;color:#ff4d6d;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;">
                                <i class="fas fa-heart" style="font-size:0.95rem;"></i>
                            </button>
                        </div>`;
                }
            });
        });
    });

    const modal = document.createElement('div');
    modal.id = 'favModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0a0a0f;overflow-y:auto;padding:20px;';
    modal.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;position:sticky;top:0;background:#0a0a0f;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
            <button onclick="document.getElementById('favModal').remove();" style="background:none;border:none;color:#fff;font-size:1.2rem;cursor:pointer;"><i class="fas fa-arrow-left"></i></button>
            <span style="font-size:1.1rem;font-weight:700;">❤️ Favorites</span>
        </div>

        <!-- Tabs -->
        <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
            <button id="favTabSubjects" onclick="switchFavoriteTab('subjects')"
                style="padding:6px 16px;border-radius:999px;border:none;background:linear-gradient(45deg,var(--neon-blue),var(--neon-pink));color:#000;font-weight:600;cursor:pointer;font-size:0.82rem;">
                Subjects
            </button>
            <button id="favTabChapters" onclick="switchFavoriteTab('chapters')"
                style="padding:6px 16px;border-radius:999px;border:1px solid rgba(255,255,255,0.22);background:transparent;color:var(--text-primary);font-weight:600;cursor:pointer;font-size:0.82rem;">
                Chapters
            </button>
        </div>

        <!-- Subjects Content -->
        <div id="favSubjectsContent">
            ${favSubjectHtml || '<p style="color:var(--text-secondary);text-align:center;margin-top:30px;font-size:0.9rem;">Koi favorite subject nahi hai.<br><span style="font-size:0.8rem;">Subjects mein ❤️ press karo.</span></p>'}
        </div>

        <!-- Chapters Content -->
        <div id="favChaptersContent" style="display:none;">
            ${favChapterHtml || '<p style="color:var(--text-secondary);text-align:center;margin-top:30px;font-size:0.9rem;">Koi favorite chapter nahi hai.<br><span style="font-size:0.8rem;">Chapters mein ❤️ press karo.</span></p>'}
        </div>
    `;
    document.body.appendChild(modal);
}

async function saveToDownloads(fileId, title, channelId, type) {
    if (type === 'video') {
        if (channelId && fileId) {
            showMiniToast('Starting secure direct download...');
            const cleanTitle = (title || 'video').replace(/[^a-zA-Z0-9]/g, '_');
            const downloadUrl = `/download/${channelId}/${fileId}/${cleanTitle}.mp4`;
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${title || 'video'}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return;
        }
        showMiniToast('Error: Video URL not found.');
        return;
    }

    const key = 'my_downloads';
    let downloads = readDownloads();
    // Duplicate check
    if (downloads.find(d => String(d.fileId) === String(fileId) && String(d.channelId) === String(channelId))) {
        alert('Ye pehle se saved hai!');
        return;
    }


    downloads.unshift({
        fileId, title, channelId, type,
        batchTitle: currentBatchTitle || '',
        subjectTitle: (selectedSubject && selectedSubject.batch_name) || '',
        chapterTitle: (selectedChapter && selectedChapter.chapter_name) || '',
        savedAt: Date.now(),
        url: type === 'video' ? '' : buildPdfUrl(channelId, fileId)
    });
    localStorage.setItem(key, JSON.stringify(downloads));

    // Toast notification
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:linear-gradient(45deg,var(--neon-blue),var(--neon-pink));color:#000;padding:10px 20px;border-radius:999px;font-weight:700;font-size:0.85rem;z-index:999999;';
    toast.textContent = '✓ Downloads mein save ho gaya!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

async function playDownloadedVideo(videoId, title, channelId) {
    const blob = await getVideoBlob(videoId);
    if (blob) {
        const localUrl = URL.createObjectURL(blob);
        openPremiumVideo(videoId, title, { chapter_name: 'Downloaded Video' });
        const vp = document.getElementById('videoPlayer');
        if (vp) {
            vp.src = localUrl;
            vp.load();
            vp.play().catch(err => console.error('Play error:', err));
        }
    } else {
        alert('Offline video nahi mili. Online play kar rahe hain.');
        openPremiumVideo(videoId, title, { chapter_name: 'Streaming Online' });
    }
}
async function deleteDownload(idx) {
    if (!confirm('Are you sure you want to delete this download?')) return;
    let d = JSON.parse(localStorage.getItem('my_downloads') || '[]');
    const item = d[idx];
    if (item) {
        if (item.type === 'video') {
            await deleteVideoBlob(item.fileId);
        }
        d.splice(idx, 1);
        localStorage.setItem('my_downloads', JSON.stringify(d));
    }
    const modal = document.getElementById('downloadsModal');
    if (modal) modal.remove();
    showDownloadsModal();
}

function showDownloadsModal() {
    const downloadsModal = document.getElementById('downloadsModal');
    if (downloadsModal) downloadsModal.remove();
    const downloads = readDownloads();
    const typeIcon = { video: 'fa-video', notes: 'fa-file-alt', dpp: 'fa-tasks', sheet: 'fa-table', 'my-note': 'fa-highlighter' };
    const typeColor = { video: '#a855f7', notes: '#3b82f6', dpp: '#f59e0b', sheet: '#10b981', 'my-note': '#00f0ff' };
    const typeLabel = { video: 'Video', notes: 'Notes', dpp: 'DPP', sheet: 'Sheet', 'my-note': 'My Notes' };

    const modal = document.createElement('div');
    modal.id = 'downloadsModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0a0a0f;overflow-y:auto;padding:20px;';
    modal.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;position:sticky;top:0;background:#0a0a0f;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
            <button onclick="document.getElementById('downloadsModal').remove();" style="background:none;border:none;color:#fff;font-size:1.2rem;cursor:pointer;"><i class="fas fa-arrow-left"></i></button>
            <span style="font-size:1.1rem;font-weight:700;">📥 My Downloads</span>
            ${downloads.length > 0 ? `<button onclick="localStorage.removeItem('my_downloads');document.getElementById('downloadsModal').remove();" style="margin-left:auto;padding:6px 14px;border-radius:999px;border:1px solid rgba(255,0,0,0.4);background:rgba(255,0,0,0.1);color:#ff4d6d;cursor:pointer;font-size:0.8rem;">Clear All</button>` : ''}
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
            ${['all','video','notes','dpp','sheet','my-note'].map(type => `<button class="download-filter-btn" data-filter="${type}" style="padding:6px 14px;border-radius:999px;border:${type === 'all' ? 'none' : '1px solid rgba(255,255,255,0.22)'};background:${type === 'all' ? 'linear-gradient(45deg,var(--neon-blue),var(--neon-pink))' : 'transparent'};color:${type === 'all' ? '#000' : 'var(--text-primary)'};font-weight:700;cursor:pointer;font-size:0.8rem;">${type === 'all' ? 'All' : typeLabel[type]}</button>`).join('')}
        </div>
        <input id="downloadsSearchInput" type="text" placeholder="Search downloads..." style="width:100%;padding:11px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:var(--text-primary);outline:none;margin-bottom:14px;">

        ${downloads.length === 0 ?
            '<p style="color:var(--text-secondary);text-align:center;margin-top:60px;font-size:0.9rem;">Koi downloads nahi hain.<br><span style="font-size:0.8rem;">Notes/DPP/Sheets/Video mein 📥 button press karo.</span></p>' :
            downloads.map((item, idx) => {
                const clickAction = item.type === 'video'
                    ? `document.getElementById('downloadsModal').remove(); playDownloadedVideo('${item.fileId}', '${String(item.title || 'Video').replace(/'/g, "\\'")}', '${item.channelId}');`
                    : `openPdfViewer('${item.url}','${String(item.title || 'PDF').replace(/'/g, "\\'")}')`;
                const btnLabel = item.type === 'video' ? 'Play' : 'View';
                return `
                <div class="download-item" data-type="${item.type}" data-title="${escapeHtml(item.title || '')}" style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:10px;background:rgba(255,255,255,0.05);margin-bottom:8px;border:1px solid rgba(255,255,255,0.07);">
                    <div style="width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.06);flex-shrink:0;">
                        <i class="fas ${typeIcon[item.type] || 'fa-file'}" style="color:${typeColor[item.type] || '#fff'};font-size:1.1rem;"></i>
                    </div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:600;font-size:0.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.title}</div>
                        <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:2px;">${typeLabel[item.type] || 'File'} • ${timeAgo(item.savedAt)}</div>
                    </div>
                    <div style="display:flex;gap:6px;flex-shrink:0;">
                        <button onclick="${clickAction}"
                            style="padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,0.2);background:transparent;color:var(--text-primary);font-size:0.78rem;cursor:pointer;font-weight:600;">
                            ${btnLabel}
                        </button>
                        <button onclick="deleteDownload(${idx})"
                            style="padding:6px 10px;border-radius:999px;border:1px solid rgba(255,0,0,0.3);background:transparent;color:#ff4d6d;font-size:0.78rem;cursor:pointer;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                `;
            }).join('')
        }
    `;
    document.body.appendChild(modal);
    let activeDownloadFilter = 'all';
    const applyDownloadFilter = () => {
        const downloadsSearchInput = document.getElementById('downloadsSearchInput');
        const query = ((downloadsSearchInput && downloadsSearchInput.value) || '').toLowerCase();
        modal.querySelectorAll('.download-item').forEach(item => {
            const typeOk = activeDownloadFilter === 'all' || item.dataset.type === activeDownloadFilter;
            const searchOk = !query || (item.dataset.title || '').toLowerCase().includes(query);
            item.style.display = typeOk && searchOk ? 'flex' : 'none';
        });
    };
    modal.querySelectorAll('.download-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeDownloadFilter = btn.dataset.filter;
            modal.querySelectorAll('.download-filter-btn').forEach(b => {
                const active = b === btn;
                b.style.background = active ? 'linear-gradient(45deg,var(--neon-blue),var(--neon-pink))' : 'transparent';
                b.style.color = active ? '#000' : 'var(--text-primary)';
                b.style.border = active ? 'none' : '1px solid rgba(255,255,255,0.22)';
            });
            applyDownloadFilter();
        });
    });
    const downloadsSearchInput = document.getElementById('downloadsSearchInput');
    if (downloadsSearchInput) downloadsSearchInput.addEventListener('input', applyDownloadFilter);
}

window.showDownloadsModal = showDownloadsModal;
window.showFavoritesModal = showFavoritesModal;

        // ═══════════════════════════════════════════════
// INTEREST-BASED RECOMMENDED COURSES
// Watch history aur completed lectures se detect karta hai
// ═══════════════════════════════════════════════

const ALL_REC_BATCHES = [
  { classId: '13', dataKey: 'dataClass13', title: 'GATEWAY – 1ST YEAR', icon: 'fa-university', color: '#8b5cf6', instructor: 'Engineering Subjects', keywords: ['gateway','physics','math','chemistry','electrical'] },
  { classId: '11', dataKey: 'dataClass11', title: 'APNA COLLEGE', icon: 'fa-code', color: '#22c55e', instructor: 'Shradha Khapra', keywords: ['apna','dsa','web','sigma','programming'] },
  { classId: '17', dataKey: 'dataClass17', title: 'DSA', icon: 'fa-layer-group', color: '#06b6d4', instructor: 'DSA Team', keywords: ['dsa','algorithms','data structures','coding'] },
  { classId: '101', dataKey: 'dataClass101', title: 'CHAI AUR CODE', icon: 'fa-coffee', color: '#d97706', instructor: 'Hitesh Choudhary', keywords: ['chai','javascript','web','backend','hitesh'] },
  { classId: '102', dataKey: 'dataClass102', title: 'SUPREME COURSE', icon: 'fa-trophy', color: '#fbbf24', instructor: 'Love Babbar', keywords: ['supreme','dsa','competitive','babbar'] },
  { classId: '103', dataKey: 'dataClass103', title: 'WEDDING MASTERY', icon: 'fa-film', color: '#f43f5e', instructor: 'Raja Awasthi', keywords: ['wedding','photo','video','cinema'] },
  { classId: '104', dataKey: 'dataClass104', title: 'PROFESSOR OF HOW', icon: 'fa-brain', color: '#22d3ee', instructor: 'Kishor Naruka', keywords: ['3d','blender','design','how'] },
  { classId: '105', dataKey: 'dataClass105', title: 'PW SKILLS', icon: 'fa-bolt', color: '#24abbf', instructor: 'PW Teams', keywords: ['pw','skills','physics','wallah'] },
  { classId: '106', dataKey: 'dataClass106', title: 'Keerti Purswani HHLD', icon: 'fa-server', color: '#0ea5e9', instructor: 'Keerti Purswani', keywords: ['hhld','aws','node','system design'] },
  { classId: '107', dataKey: 'dataClass107', title: 'Financial Modeling Fundamentals', icon: 'fa-file-invoice-dollar', color: '#16a34a', instructor: 'Finance Team', keywords: ['finance','modeling','excel','valuation'] },
  { classId: '108', dataKey: 'dataClass108', title: 'UDEMY', icon: 'fa-graduation-cap', color: '#a78bfa', instructor: 'Udemy Team', keywords: ['udemy','course','skill'] },
  { classId: '109', dataKey: 'dataClass109', title: 'TRADING', icon: 'fa-chart-line', color: '#22c55e', instructor: 'Trading Team', keywords: ['trading','stock','market','finance'] },
  { classId: '110', dataKey: 'dataClass110', title: 'DevOps', icon: 'fa-terminal', color: '#38bdf8', instructor: 'Singam4DevOps', keywords: ['devops','docker','kubernetes','linux'] },
  { classId: '111', dataKey: 'dataClass111', title: 'HARKIRAT COHORT', icon: 'fa-rocket', color: '#818cf8', instructor: 'Harkirat Singh', keywords: ['web3','blockchain','harkirat','cohort'] },
  { classId: '114', dataKey: 'dataClass114', title: 'CODE WITH HARRY', icon: 'fa-laptop-code', color: '#f97316', instructor: 'Haris Ali Khan', keywords: ['python','web','harry','tutorial'] },
  { classId: '115', dataKey: 'dataClass115', title: 'ADCA', icon: 'fa-desktop', color: '#2563eb', instructor: 'ADCA Team', keywords: ['adca','computer','application','office'] },
  { classId: '116', dataKey: 'dataClass116', title: 'INEURON', icon: 'fa-flask', color: '#10b981', instructor: 'iNeuron Team', keywords: ['ml','ai','data','ineuron','python'] },
  { classId: '112', dataKey: 'dataClass112', title: 'SHREYANSH CODING', icon: 'fa-code-branch', color: '#ec4899', instructor: 'Shreyansh', keywords: ['coding','programming','shreyansh'] },
  { classId: '113', dataKey: 'dataClass113', title: 'CAMPUS', icon: 'fa-school', color: '#14b8a6', instructor: 'Campus Team', keywords: ['campus','placement','interview'] },
  { classId: '14', dataKey: 'dataClass14', title: 'DROPSHIPPING', icon: 'fa-store', color: '#f59e0b', instructor: 'Vivek Bindra', keywords: ['dropshipping','business','store','sales'] },
  { classId: '15', dataKey: 'dataClass15', title: 'JASON FEDIN', icon: 'fa-c', color: '#64748b', instructor: 'Jason Fedin', keywords: ['c','programming','beginners'] },
  { classId: '201', dataKey: 'dataClass201', title: 'EARNERS', icon: 'fa-mobile-screen-button', color: '#db2777', instructor: 'Earners Team', keywords: ['editing','ai','youtube','instagram','design'] },
  { classId: '202', dataKey: 'dataClass202', title: 'GATEWAY - 3RD SEM', icon: 'fa-university', color: '#7c3aed', instructor: 'Engineering Subjects', keywords: ['gateway','aktu','third semester','engineering'] },
];

// Cross-batch interest map: agar X dekha toh Y bhi suggest karo
const INTEREST_MAP = {
  'gateway': ['11','105'],
  'apna':    ['101','102','114'],
  'chai':    ['11','114','111'],
  'dsa':     ['11','102'],
  'web':     ['101','111','114'],
  'python':  ['116','114'],
  'devops':  ['110','111'],
  'trading': ['109'],
  'ml':      ['116','105'],
};

function getInterestBasedRecommendations() {
  const history = JSON.parse(localStorage.getItem('watch_history') || '[]');
  const watchedTitles = history.map(h => (h.batchTitle || h.title || '').toLowerCase());
  const hasHistory = history.length > 0;

  // Currently watching batch IDs (to avoid recommending same)
  const currentlyWatching = new Set(
    history.slice(0, 10).map(h => (h.batchTitle || '').toLowerCase().split(' ')[0])
  );

  const scored = ALL_REC_BATCHES.map(batch => {
    let score = 0;
    const batchKey = batch.title.toLowerCase().split(' ')[0];

    // Penalize if already watching this batch
    if (currentlyWatching.has(batchKey)) score -= 10;

    if (hasHistory) {
      watchedTitles.forEach(watched => {
        // Direct keyword match
        batch.keywords.forEach(kw => {
          if (watched.includes(kw)) score += 4;
        });
        // Interest map cross-recommendation
        Object.entries(INTEREST_MAP).forEach(([kw, batchIds]) => {
          if (watched.includes(kw) && batchIds.includes(batch.classId)) {
            score += 3;
          }
        });
      });
    } else {
      // No history → popular defaults
      if (['13','11','101','102'].includes(batch.classId)) score += 6;
      else score += 1;
    }

    // Bonus: batch data actually loaded hai toh recommend karo
    if (window[batch.dataKey] && window[batch.dataKey].length > 0) score += 1;

    return { ...batch, score };
  });

  return scored
    .filter(b => b.score > -5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function renderRecommendedCourses() {
  const container = document.getElementById('recommendedCoursesContainer');
  if (!container) return;

  const recs = getInterestBasedRecommendations();
  const history = JSON.parse(localStorage.getItem('watch_history') || '[]');
  const hasHistory = history.length > 0;

  if (recs.length === 0) {
    container.innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem;padding:8px;">Start watching to get personalized recommendations!</p>';
    return;
  }

  container.innerHTML = recs.map(batch => {
    const totalLectures = (window[batch.dataKey] || [])
      .flatMap(s => s.chapters || [])
      .flatMap(c => c.lectures || []).length;

    return `
      <div class="continue-item" style="cursor:pointer;" onclick="
        openBatchModal(window['${batch.dataKey}'] || [], '${batch.title}');
        setActiveSection('coursesSection');
      ">
        <div class="continue-thumbnail" style="background:linear-gradient(135deg,${batch.color}55,${batch.color}22); position:relative;">
          <i class="fas ${batch.icon}" style="color:${batch.color};"></i>
          ${hasHistory && batch.score > 3 ? `
          <div style="position:absolute;top:4px;right:4px;background:linear-gradient(45deg,var(--neon-blue),var(--neon-pink));color:#000;font-size:0.55rem;font-weight:800;padding:2px 5px;border-radius:999px;">✦ For You</div>
          ` : ''}
        </div>
        <div class="continue-info">
          <div class="continue-title">${batch.title}</div>
          <div class="continue-meta">
            <span>${batch.instructor}</span>
            <span>${totalLectures > 0 ? totalLectures + ' lectures' : 'Explore'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Page load pe render karo
window.addEventListener('load', renderRecommendedCourses);

        // ═══════════════════════════════════════════════
// VIDEO DURATION CACHE SYSTEM
// ═══════════════════════════════════════════════
const VID_DUR_CACHE_KEY = 'vid_dur_cache';
const VID_DUR_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

function getVidDurCache() {
  try { return JSON.parse(localStorage.getItem(VID_DUR_CACHE_KEY) || '{}'); } 
  catch { return {}; }
}

function saveVidDurCache(c) {
  try { localStorage.setItem(VID_DUR_CACHE_KEY, JSON.stringify(c)); } catch {}
}

function fetchDurationAndShow(videoId, channelId) {
  if (!videoId) return;
  
  const cache = getVidDurCache();
  const now = Date.now();
  const el = document.getElementById(`dur-${videoId}`);

  // Cache hit — instantly dikhao
  if (cache[videoId] && now - cache[videoId].t < VID_DUR_TTL) {
    if (el && cache[videoId].d) {
      el.textContent = cache[videoId].d;
      el.style.opacity = '1';
    }
    return;
  }

  // Hidden video element se metadata fetch karo
  const tempVid = document.createElement('video');
  tempVid.preload = 'metadata';
  tempVid.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;';
  document.body.appendChild(tempVid);
  
  tempVid.src = `${STREAM_BASE_API}${channelId}/${videoId}`;

  tempVid.onloadedmetadata = () => {
    const secs = Math.floor(tempVid.duration);
    tempVid.src = '';
    tempVid.remove();

    if (secs && isFinite(secs) && secs > 0) {
      const formatted = fmtTime(secs);
      // Save to cache permanently (30 days)
      const c2 = getVidDurCache();
      c2[videoId] = { d: formatted, t: now };
      saveVidDurCache(c2);

      const elNow = document.getElementById(`dur-${videoId}`);
      if (elNow) {
        elNow.textContent = formatted;
        elNow.style.opacity = '1';
        elNow.style.color = 'var(--neon-blue)';
      }
    }
    tempVid.remove();
  };

  tempVid.onerror = () => tempVid.remove();
}

// Video player keyboard shortcut controls
document.addEventListener('keydown', (event) => {
    const modal = document.getElementById('videoModal');
    const isVideoOpen = modal && modal.style.display === 'flex';
    if (!isVideoOpen) return;

    // Skip shortcuts if user is typing inside any inputs/textarea
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement && document.activeElement.isContentEditable)) {
        return;
    }

    const vp = document.getElementById('videoPlayer');
    if (!vp) return;

    switch (event.key) {
        case ' ': // Spacebar to toggle Play/Pause
            event.preventDefault();
            if (vp.paused) {
                vp.play();
                showMiniToast('Play');
            } else {
                vp.pause();
                showMiniToast('Pause');
            }
            break;
        case 'ArrowLeft': // Left Arrow to skip back 10s
            event.preventDefault();
            vp.currentTime = Math.max(0, vp.currentTime - 10);
            showMiniToast('Rewind -10s');
            break;
        case 'ArrowRight': // Right Arrow to skip forward 10s
            event.preventDefault();
            vp.currentTime = Math.min(vp.duration || Infinity, vp.currentTime + 10);
            showMiniToast('Forward +10s');
            break;
        case 'ArrowUp': // Up Arrow to increase volume
            event.preventDefault();
            vp.volume = Math.min(1, vp.volume + 0.1);
            showMiniToast(`Volume: ${Math.round(vp.volume * 100)}%`);
            break;
        case 'ArrowDown': // Down Arrow to decrease volume
            event.preventDefault();
            vp.volume = Math.max(0, vp.volume - 0.1);
            showMiniToast(`Volume: ${Math.round(vp.volume * 100)}%`);
            break;
        case 'm':
        case 'M': // M to mute/unmute
            event.preventDefault();
            vp.muted = !vp.muted;
            showMiniToast(vp.muted ? 'Mute' : 'Unmute');
            break;
        case 'f':
        case 'F': // F to toggle Fullscreen
            event.preventDefault();
            if (typeof toggleVideoFullscreen === 'function') {
                toggleVideoFullscreen();
            }
            break;
        case '>':
        case '.': // > to increase playback rate
            if (event.key === '>' || event.shiftKey) {
                event.preventDefault();
                let speed = Math.min(3, vp.playbackRate + 0.25);
                vp.playbackRate = speed;
                const speedBtn = document.getElementById('speedBtn');
                if (speedBtn && !speedBtn.querySelector('i')) {
                    speedBtn.textContent = speed + 'x';
                }
                const telegramSpeedValue = document.getElementById('telegramSpeedValue');
                if (telegramSpeedValue) {
                    telegramSpeedValue.textContent = speed + 'x';
                }
                showMiniToast(`Speed: ${speed}x`);
            }
            break;
        case '<':
        case ',': // < to decrease playback rate
            if (event.key === '<' || event.shiftKey) {
                event.preventDefault();
                let speed = Math.max(0.25, vp.playbackRate - 0.25);
                vp.playbackRate = speed;
                const speedBtn = document.getElementById('speedBtn');
                if (speedBtn && !speedBtn.querySelector('i')) {
                    speedBtn.textContent = speed + 'x';
                }
                const telegramSpeedValue = document.getElementById('telegramSpeedValue');
                if (telegramSpeedValue) {
                    telegramSpeedValue.textContent = speed + 'x';
                }
                showMiniToast(`Speed: ${speed}x`);
            }
            break;
    }
});

// Show Telegram Channel Join modal on page load
document.addEventListener('DOMContentLoaded', () => {
    // Restore state from URL query parameters (Option B) if present
    if (typeof window.__restoreUrlState === 'function') {
        window.__restoreUrlState();
    }

    const tgModal = document.getElementById('telegramJoinModal');
    if (tgModal) {
        // Show after a slight delay (e.g. 800ms) for a premium transition effect
        setTimeout(() => {
            tgModal.style.display = 'flex';
        }, 800);

        const closeBtn = document.getElementById('tgModalCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                tgModal.style.display = 'none';
            });
        }

        // Close on clicking overlay
        tgModal.addEventListener('click', (e) => {
            if (e.target === tgModal) {
                tgModal.style.display = 'none';
            }
        });

        const joinBtn = document.getElementById('tgModalJoinBtn');
        if (joinBtn) {
            joinBtn.addEventListener('click', () => {
                tgModal.style.display = 'none';
            });
        }
    }
});
    