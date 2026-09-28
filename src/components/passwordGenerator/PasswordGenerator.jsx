import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    generatePassword,
    TEMPLATES,
    applyTemplate,
    detectTemplate,
} from '../../scripts/generate';
import './style.css';

const HISTORY_SIZE = 5;

const DEFAULT_OPTIONS = {
    useUpper: true,
    useLower: true,
    useNumbers: true,
    useSymbols: true,
    excludeAmbiguous: true,
};

const PasswordGenerator = () => {
    const [length, setLength] = useState(16);
    const [options, setOptions] = useState(DEFAULT_OPTIONS);
    const [templateKey, setTemplateKey] = useState('full');

    const [password, setPassword] = useState('');
    const [batch, setBatch] = useState([]);          // массовая генерация
    const [history, setHistory] = useState([]);      // только в памяти, без localStorage
    const [copied, setCopied] = useState(false);
    const [masked, setMasked] = useState(false);
    const [darkTheme, setDarkTheme] = useState(false);

    const copiedTimer = useRef(null);
    const optionsRef = useRef(options);
    optionsRef.current = options;

    const hasAnyCharSet = (opts) =>
        opts.useUpper || opts.useLower || opts.useNumbers || opts.useSymbols;

    const pushToHistory = useCallback((pwd) => {
        if (!pwd) return;
        setHistory((h) => [pwd, ...h.filter((p) => p !== pwd)].slice(0, HISTORY_SIZE));
    }, []);

    const regenerate = useCallback(() => {
        const opts = optionsRef.current;
        if (!hasAnyCharSet(opts)) return; // не генерируем, пока ничего не выбрано
        const pwd = generatePassword(length, opts);
        setPassword(pwd);
        setBatch([]);
        pushToHistory(pwd);
        setCopied(false);
    }, [length, pushToHistory]);

    // ===== Автогенерация: пароль обновляется при любой смене настроек =====
    useEffect(() => {
        regenerate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [length, options]);

    // ===== Тёмная тема =====
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkTheme ? 'dark' : 'light');
    }, [darkTheme]);

    const flashCopied = () => {
        setCopied(true);
        clearTimeout(copiedTimer.current);
        copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    };

    const fallbackCopy = (text) => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, text.length);
        let ok = false;
        try {
            ok = document.execCommand('copy');
        } catch (e) {
            ok = false;
        }
        document.body.removeChild(ta);
        return ok;
    };

    const copyText = useCallback((text) => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(flashCopied).catch(() => { });
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text)
                .then(flashCopied)
                .catch(() => {
                    if (fallbackCopy(text)) flashCopied();
                });
        } else if (fallbackCopy(text)) {
            flashCopied();
        }
    }, []);

    const handleCopy = () => copyText(password);

    const handleTemplateChange = (key) => {
        setTemplateKey(key);
        if (key !== 'custom') {
            setOptions((prev) => applyTemplate(key, prev));

            const tplLength = TEMPLATES[key]?.length;
            if (typeof tplLength === 'number') {
                setLength(tplLength);
            }
        }
    };

    const toggleOption = (key) => {
        setOptions((prev) => {
            const next = { ...prev, [key]: !prev[key] };
            setTemplateKey(detectTemplate(next));
            return next;
        });
    };

    const handleGenerateBatch = (count) => {
        if (!hasAnyCharSet(options)) return;
        const list = Array.from({ length: count }, () => generatePassword(length, options));
        setBatch(list);
        setPassword(list[0]);
        setHistory((h) => [...list, ...h].slice(0, HISTORY_SIZE));
        setCopied(false);
    };

    // ===== Горячие клавиши: Space — перегенерировать, Ctrl/Cmd+C — копировать =====
    useEffect(() => {
        const onKeyDown = (e) => {
            const tag = e.target?.tagName;
            const isFormElement =
                tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
                tag === 'BUTTON' || e.target?.isContentEditable;

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
                // Не перехватываем выделенный пользователем текст
                const sel = window.getSelection?.()?.toString();
                if (!sel && password) {
                    e.preventDefault();
                    copyText(password);
                }
                return;
            }

            if (e.code === 'Space' && !isFormElement && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                regenerate();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [regenerate, password, copyText]);

    const displayPassword = masked && password ? '•'.repeat(password.length) : password;

    return (
        <div className="password-generator">
            <div className="pg-container">
                <div className="pg-header">
                    <h2 className="pg-title">Генератор паролей</h2>
                    <label className="pg-theme-toggle" title="Тёмная тема">
                        <input
                            type="checkbox"
                            checked={darkTheme}
                            onChange={() => setDarkTheme(!darkTheme)}
                        />
                        <span>{darkTheme ? '☀️' : '🌙'}</span>
                    </label>
                </div>

                <div className="pg-password-box">
                    <input
                        type="text"
                        value={displayPassword}
                        readOnly
                        placeholder="Выберите хотя бы один тип символов"
                        className="pg-password-input"
                    />
                    <button
                        onClick={() => setMasked(!masked)}
                        className="pg-icon-btn"
                        title={masked ? 'Показать' : 'Скрыть'}
                        disabled={!password}
                    >
                        {masked ? '👁️' : '🙈'}
                    </button>
                    <button
                        onClick={handleCopy}
                        className="pg-copy-btn"
                        disabled={!password}
                        title="Скопировать (Ctrl+C)"
                    >
                        {copied ? '✓' : '📋'}
                    </button>
                </div>

                {/* Шаблоны */}
                <div className="pg-settings-block">
                    <label className="pg-label">
                        <span>Шаблон</span>
                    </label>
                    <select
                        className="pg-select"
                        value={templateKey}
                        onChange={(e) => handleTemplateChange(e.target.value)}
                    >
                        {Object.entries(TEMPLATES).map(([key, t]) => (
                            <option key={key} value={key}>{t.label}</option>
                        ))}
                        {templateKey === 'custom' && <option value="custom">Свой набор</option>}
                    </select>
                </div>

                {/* Длина */}
                <div className="pg-settings-block">
                    <label className="pg-label">
                        <span>Длина пароля</span>
                        <span className="pg-label-value">{length}</span>
                    </label>
                    <input
                        type="range"
                        min="4"
                        max="64"
                        value={length}
                        onChange={(e) => setLength(Number(e.target.value))}
                        className="pg-slider"
                    />
                </div>

                {/* Наборы символов */}
                <div className="pg-settings-block">
                    <label className="pg-checkbox-label">
                        <input type="checkbox" checked={options.useUpper} onChange={() => toggleOption('useUpper')} />
                        Заглавные буквы (A-Z)
                    </label>
                    <label className="pg-checkbox-label">
                        <input type="checkbox" checked={options.useLower} onChange={() => toggleOption('useLower')} />
                        Строчные буквы (a-z)
                    </label>
                    <label className="pg-checkbox-label">
                        <input type="checkbox" checked={options.useNumbers} onChange={() => toggleOption('useNumbers')} />
                        Цифры (0-9)
                    </label>
                    <label className="pg-checkbox-label">
                        <input type="checkbox" checked={options.useSymbols} onChange={() => toggleOption('useSymbols')} />
                        Спецсимволы (!@#$)
                    </label>
                    <label className="pg-checkbox-label">
                        <input type="checkbox" checked={options.excludeAmbiguous} onChange={() => toggleOption('excludeAmbiguous')} />
                        Без похожих символов (lI1O0…)
                    </label>
                    {!hasAnyCharSet(options) && (
                        <p className="pg-warning">Выберите хотя бы один тип символов!</p>
                    )}
                </div>

                {/* Массовая генерация */}
                <div className="pg-batch-block">
                    <button
                        onClick={() => handleGenerateBatch(5)}
                        className="pg-batch-btn"
                        disabled={!hasAnyCharSet(options)}
                    >
                        Сгенерировать 5 штук
                    </button>
                    <button
                        onClick={regenerate}
                        className="pg-generate-btn"
                        disabled={!hasAnyCharSet(options)}
                        title="Или нажмите Space"
                    >
                        Обновить (Space)
                    </button>
                </div>

                {batch.length > 0 && (
                    <div className="pg-history">
                        <div className="pg-history-header">
                            <span className="pg-history-title">Партия ({batch.length})</span>
                            <button className="pg-export-btn" onClick={() => copyText(batch.join('\n'))}>
                                Копировать все
                            </button>
                        </div>
                        <ul className="pg-history-list">
                            {batch.map((p, i) => (
                                <li key={`b-${i}`} className="pg-history-item" onClick={() => copyText(p)}>
                                    <code>{masked ? '•'.repeat(p.length) : p}</code>
                                    <span className="pg-history-copy">📋</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* История (только в памяти) */}
                {history.length > 0 && (
                    <div className="pg-history">
                        <div className="pg-history-header">
                            <span className="pg-history-title">История (последние {HISTORY_SIZE}, только в памяти)</span>
                            <button className="pg-clear-btn" onClick={() => setHistory([])}>Очистить</button>
                        </div>
                        <ul className="pg-history-list">
                            {history.map((p, i) => (
                                <li key={`${p}-${i}`} className="pg-history-item" onClick={() => copyText(p)}>
                                    <code>{masked ? '•'.repeat(p.length) : p}</code>
                                    <span className="pg-history-copy">📋</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <p className="pg-hint">
                    Горячие клавиши: <kbd>Space</kbd> — перегенерировать, <kbd>Ctrl</kbd>+<kbd>C</kbd> — копировать
                </p>
            </div>
        </div>
    );
};

export default PasswordGenerator;
