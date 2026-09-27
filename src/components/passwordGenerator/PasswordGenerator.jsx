import React, { useState } from 'react';
import { generatePassword } from '../../scripts/generate'; 
import './style.css'; // Подключаем наши стили

const PasswordGenerator = () => {
    const [length, setLength] = useState(12);
    const [useUpper, setUseUpper] = useState(true);
    const [useLower, setUseLower] = useState(true);
    const [useNumbers, setUseNumbers] = useState(true);
    const [useSymbols, setUseSymbols] = useState(true);
    
    const [password, setPassword] = useState('');
    const [copied, setCopied] = useState(false);

    const handleGenerate = () => {
        if (!useUpper && !useLower && !useNumbers && !useSymbols) {
            alert('Выберите хотя бы один тип символов!');
            return;
        }

        const newPassword = generatePassword(length, {
            useUpper, useLower, useNumbers, useSymbols
        });
        
        setPassword(newPassword);
        setCopied(false);
    };

    const handleCopy = () => {
        if (!password) return;
        navigator.clipboard.writeText(password).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="password-generator">
            <div className="pg-container">
                <h2 className="pg-title">Генератор паролей</h2>
                
                <div className="pg-password-box">
                    <input 
                        type="text" 
                        value={password} 
                        readOnly 
                        placeholder="Нажмите 'Сгенерировать'" 
                        className="pg-password-input"
                    />
                    <button onClick={handleCopy} className="pg-copy-btn" disabled={!password}>
                        {copied ? '✓' : '📋'}
                    </button>
                </div>

                <div className="pg-settings-block">
                    <label className="pg-label">
                        <span>Длина пароля</span>
                        <span className="pg-label-value">{length}</span>
                    </label>
                    <input 
                        type="range" 
                        min="4" 
                        max="32" 
                        value={length} 
                        onChange={(e) => setLength(Number(e.target.value))}
                        className="pg-slider"
                    />
                </div>

                <div className="pg-settings-block">
                    <label className="pg-checkbox-label">
                        <input type="checkbox" checked={useUpper} onChange={() => setUseUpper(!useUpper)} />
                        Заглавные буквы (A-Z)
                    </label>
                    <label className="pg-checkbox-label">
                        <input type="checkbox" checked={useLower} onChange={() => setUseLower(!useLower)} />
                        Строчные буквы (a-z)
                    </label>
                    <label className="pg-checkbox-label">
                        <input type="checkbox" checked={useNumbers} onChange={() => setUseNumbers(!useNumbers)} />
                        Цифры (0-9)
                    </label>
                    <label className="pg-checkbox-label">
                        <input type="checkbox" checked={useSymbols} onChange={() => setUseSymbols(!useSymbols)} />
                        Спецсимволы (!@#$)
                    </label>
                </div>

                {/* Кнопка генерации */}
                <button onClick={handleGenerate} className="pg-generate-btn">
                    Сгенерировать
                </button>
            </div>
        </div>
    );
};

export default PasswordGenerator;