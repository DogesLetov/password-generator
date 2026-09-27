// generate.js

const charUp = 'QWERTYUIOPASDFGHJKLZXCVBNM';
const charLow = 'qwertyuiopasdfghjklzxcvbnm';
const charNum = '1234567890';
const charSpec = '!@#$%^&*';

export function generatePassword(length = 8, options = {}) {
    const { 
        useUpper = true, 
        useLower = true, 
        useNumbers = true, 
        useSymbols = true 
    } = options;

    let pool = '';
    let mandatoryChars = [];

    if (useUpper) {
        pool += charUp;
        mandatoryChars.push(charUp[Math.floor(Math.random() * charUp.length)]);
    }
    if (useLower) {
        pool += charLow;
        mandatoryChars.push(charLow[Math.floor(Math.random() * charLow.length)]);
    }
    if (useNumbers) {
        pool += charNum;
        mandatoryChars.push(charNum[Math.floor(Math.random() * charNum.length)]);
    }
    if (useSymbols) {
        pool += charSpec;
        mandatoryChars.push(charSpec[Math.floor(Math.random() * charSpec.length)]);
    }

    if (pool === '') return ''; 

    const finalLength = Math.max(length, mandatoryChars.length);

    let passwordArray = [...mandatoryChars];

    for (let i = passwordArray.length; i < finalLength; i++) {
        passwordArray.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    for (let i = passwordArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }

    return passwordArray.join('');
}