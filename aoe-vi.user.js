// ==UserScript==
// @name         Age of Empires (vivalarts.com) – Tiếng Việt
// @namespace    https://github.com/thanhbg2606/aoe-vi
// @version      2.0.0
// @description  Việt hóa Age of Empires (1997) trên vivalarts.com. Alt+L để bật/tắt.
// @match        https://vivalarts.com/*
// @match        https://www.vivalarts.com/*
// @run-at       document-start
// @grant        none
// @inject-into  page
// @sandbox      raw
// ==/UserScript==

// Chỉ nạp main.js từ GitHub (qua jsDelivr), mọi logic và bản dịch nằm trong repo.
import('https://cdn.jsdelivr.net/gh/thanhbg2606/aoe-vi@master/main.js');
