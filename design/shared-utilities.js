/**
 * TOS共享工具库
 * 前后端通用的工具函数和辅助方法
 * 提供常用的数据处理、格式化、验证等功能
 */

import { BUSINESS_CONFIG } from './shared-domain-library.js';

// ==================== 日期时间工具 ====================

/**
 * 日期时间处理工具
 */
export class DateTimeUtils {
    /**
     * 格式化日期为字符串
     */
    static formatDate(date, format = 'YYYY-MM-DD') {
        if (!date) return '';
        
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    }

    /**
     * 解析日期字符串
     */
    static parseDate(dateString, format = 'YYYY-MM-DD') {
        if (!dateString) return null;
        
        // 支持多种日期格式
        const patterns = [
            /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
            /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/, // YYYY-MM-DD HH:mm:ss
            /^(\d{4})\/(\d{2})\/(\d{2})$/, // YYYY/MM/DD
            /^(\d{2})\/(\d{2})\/(\d{4})$/ // MM/DD/YYYY
        ];
        
        for (const pattern of patterns) {
            const match = dateString.match(pattern);
            if (match) {
                const [, ...parts] = match;
                if (parts.length === 3) {
                    return new Date(parts[0], parts[1] - 1, parts[2]);
                } else if (parts.length === 6) {
                    return new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]);
                }
            }
        }
        
        return new Date(dateString);
    }

    /**
     * 计算两个日期之间的差值
     */
    static dateDiff(startDate, endDate, unit = 'days') {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffMs = end - start;
        
        switch (unit) {
            case 'milliseconds':
                return diffMs;
            case 'seconds':
                return Math.floor(diffMs / 1000);
            case 'minutes':
                return Math.floor(diffMs / (1000 * 60));
            case 'hours':
                return Math.floor(diffMs / (1000 * 60 * 60));
            case 'days':
                return Math.floor(diffMs / (1000 * 60 * 60 * 24));
            default:
                return diffMs;
        }
    }

    /**
     * 获取相对时间描述
     */
    static getRelativeTime(date) {
        const now = new Date();
        const target = new Date(date);
        const diffMs = now - target;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMinutes < 1) return '刚刚';
        if (diffMinutes < 60) return `${diffMinutes}分钟前`;
        if (diffHours < 24) return `${diffHours}小时前`;
        if (diffDays < 30) return `${diffDays}天前`;
        
        return this.formatDate(date, 'YYYY-MM-DD');
    }

    /**
     * 检查日期是否有效
     */
    static isValidDate(date) {
        const d = new Date(date);
        return d instanceof Date && !isNaN(d);
    }

    /**
     * 获取时间范围
     */
    static getTimeRange(range = 'today') {
        const now = new Date();
        const start = new Date(now);
        const end = new Date(now);
        
        switch (range) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'yesterday':
                start.setDate(start.getDate() - 1);
                start.setHours(0, 0, 0, 0);
                end.setDate(end.getDate() - 1);
                end.setHours(23, 59, 59, 999);
                break;
            case 'week':
                const dayOfWeek = start.getDay();
                start.setDate(start.getDate() - dayOfWeek);
                start.setHours(0, 0, 0, 0);
                end.setDate(end.getDate() + (6 - dayOfWeek));
                end.setHours(23, 59, 59, 999);
                break;
            case 'month':
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                end.setMonth(end.getMonth() + 1, 0);
                end.setHours(23, 59, 59, 999);
                break;
        }
        
        return { start, end };
    }
}

// ==================== 数据格式化工具 ====================

/**
 * 数据格式化工具
 */
export class DataFormatter {
    /**
     * 格式化数字
     */
    static formatNumber(number, options = {}) {
        const {
            decimals = 2,
            thousandsSeparator = ',',
            decimalSeparator = '.',
            currency = '',
            showSign = false
        } = options;
        
        if (number === null || number === undefined) return '';
        
        const num = parseFloat(number);
        if (isNaN(num)) return '';
        
        let formatted = num.toFixed(decimals);
        
        // 添加千位分隔符
        if (thousandsSeparator) {
            const parts = formatted.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
            formatted = parts.join('.');
        }
        
        // 替换小数点
        if (decimalSeparator !== '.') {
            formatted = formatted.replace('.', decimalSeparator);
        }
        
        // 添加货币符号
        if (currency) {
            formatted = currency + formatted;
        }
        
        // 添加正负号
        if (showSign && num > 0) {
            formatted = '+' + formatted;
        }
        
        return formatted;
    }

    /**
     * 格式化文件大小
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 格式化百分比
     */
    static formatPercentage(value, decimals = 2) {
        if (value === null || value === undefined) return '';
        
        const num = parseFloat(value);
        if (isNaN(num)) return '';
        
        return num.toFixed(decimals) + '%';
    }

    /**
     * 格式化持续时间
     */
    static formatDuration(seconds) {
        if (seconds < 60) return `${seconds}秒`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时`;
        return `${Math.floor(seconds / 86400)}天`;
    }

    /**
     * 格式化集装箱号
     */
    static formatContainerNumber(containerNumber) {
        if (!containerNumber) return '';
        
        const clean = containerNumber.replace(/[^A-Z0-9]/g, '');
        if (clean.length !== 11) return containerNumber;
        
        return `${clean.substring(0, 4)} ${clean.substring(4, 7)} ${clean.substring(7)}`;
    }

    /**
     * 格式化船舶IMO号
     */
    static formatIMONumber(imoNumber) {
        if (!imoNumber) return '';
        
        const clean = imoNumber.replace(/[^0-9]/g, '');
        if (clean.length !== 7) return imoNumber;
        
        return `IMO ${clean}`;
    }
}

// ==================== 缓存管理工具 ====================

/**
 * 缓存管理工具
 */
export class CacheManager {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = BUSINESS_CONFIG.CACHE.DEFAULT_TTL * 1000; // 转换为毫秒
    }

    /**
     * 设置缓存
     */
    set(key, value, ttl = this.defaultTTL) {
        const expiry = Date.now() + ttl;
        this.cache.set(key, {
            value,
            expiry
        });
    }

    /**
     * 获取缓存
     */
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    /**
     * 删除缓存
     */
    delete(key) {
        return this.cache.delete(key);
    }

    /**
     * 清空所有缓存
     */
    clear() {
        this.cache.clear();
    }

    /**
     * 获取缓存大小
     */
    size() {
        return this.cache.size;
    }

    /**
     * 清理过期缓存
     */
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiry) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * 获取缓存统计信息
     */
    getStats() {
        const now = Date.now();
        let validCount = 0;
        let expiredCount = 0;
        
        for (const item of this.cache.values()) {
            if (now > item.expiry) {
                expiredCount++;
            } else {
                validCount++;
            }
        }
        
        return {
            total: this.cache.size,
            valid: validCount,
            expired: expiredCount
        };
    }
}

// ==================== 本地存储工具 ====================

/**
 * 本地存储工具
 */
export class StorageUtils {
    /**
     * 设置本地存储
     */
    static setItem(key, value, ttl = null) {
        const data = {
            value,
            timestamp: Date.now()
        };
        
        if (ttl) {
            data.expiry = Date.now() + ttl;
        }
        
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('设置本地存储失败:', error);
            return false;
        }
    }

    /**
     * 获取本地存储
     */
    static getItem(key) {
        try {
            const data = localStorage.getItem(key);
            if (!data) return null;
            
            const parsed = JSON.parse(data);
            
            if (parsed.expiry && Date.now() > parsed.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            
            return parsed.value;
        } catch (error) {
            console.error('获取本地存储失败:', error);
            return null;
        }
    }

    /**
     * 删除本地存储
     */
    static removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('删除本地存储失败:', error);
            return false;
        }
    }

    /**
     * 清空本地存储
     */
    static clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('清空本地存储失败:', error);
            return false;
        }
    }
}

// ==================== 字符串工具 ====================

/**
 * 字符串处理工具
 */
export class StringUtils {
    /**
     * 生成随机字符串
     */
    static randomString(length = 8, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
    }

    /**
     * 生成UUID
     */
    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * 截断字符串
     */
    static truncate(str, length = 50, suffix = '...') {
        if (!str || str.length <= length) return str;
        return str.substring(0, length) + suffix;
    }

    /**
     * 首字母大写
     */
    static capitalize(str) {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * 驼峰命名转下划线
     */
    static camelToSnake(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }

    /**
     * 下划线转驼峰命名
     */
    static snakeToCamel(str) {
        return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    }

    /**
     * 移除HTML标签
     */
    static stripHtml(html) {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '');
    }

    /**
     * 转义HTML字符
     */
    static escapeHtml(str) {
        if (!str) return str;
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return str.replace(/[&<>"']/g, m => map[m]);
    }
}

// ==================== 数组工具 ====================

/**
 * 数组处理工具
 */
export class ArrayUtils {
    /**
     * 数组去重
     */
    static unique(arr, key = null) {
        if (!Array.isArray(arr)) return [];
        
        if (key) {
            const seen = new Set();
            return arr.filter(item => {
                const value = item[key];
                if (seen.has(value)) {
                    return false;
                }
                seen.add(value);
                return true;
            });
        }
        
        return [...new Set(arr)];
    }

    /**
     * 数组分组
     */
    static groupBy(arr, key) {
        if (!Array.isArray(arr)) return {};
        
        return arr.reduce((groups, item) => {
            const groupKey = item[key];
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(item);
            return groups;
        }, {});
    }

    /**
     * 数组排序
     */
    static sortBy(arr, key, order = 'asc') {
        if (!Array.isArray(arr)) return [];
        
        return [...arr].sort((a, b) => {
            let aVal = a[key];
            let bVal = b[key];
            
            // 处理日期
            if (aVal instanceof Date && bVal instanceof Date) {
                aVal = aVal.getTime();
                bVal = bVal.getTime();
            }
            
            // 处理字符串
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (order === 'desc') {
                return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
            }
            
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        });
    }

    /**
     * 数组分页
     */
    static paginate(arr, page = 1, pageSize = BUSINESS_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE) {
        if (!Array.isArray(arr)) return { data: [], pagination: { page, pageSize, total: 0, totalPages: 0 } };
        
        const total = arr.length;
        const totalPages = Math.ceil(total / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const data = arr.slice(startIndex, endIndex);
        
        return {
            data,
            pagination: {
                page,
                pageSize,
                total,
                totalPages
            }
        };
    }

    /**
     * 数组扁平化
     */
    static flatten(arr, depth = Infinity) {
        if (!Array.isArray(arr)) return [];
        
        return arr.reduce((flat, item) => {
            if (Array.isArray(item) && depth > 0) {
                return flat.concat(this.flatten(item, depth - 1));
            }
            return flat.concat(item);
        }, []);
    }
}

// ==================== 导出模块 ====================

export default {
    DateTimeUtils,
    DataFormatter,
    CacheManager,
    StorageUtils,
    StringUtils,
    ArrayUtils
}; 