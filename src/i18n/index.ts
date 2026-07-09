/**
 * ERDL MCP Server — Language Detection
 *
 * Priority: --lang flag > ERDL_LANG env > LANG/LC_ALL env > default "en"
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-09
 * @license MIT
 */

import { en } from './en.js'
import { zh } from './zh.js'

export type Lang = 'en' | 'zh'
export type I18nStrings = typeof en

/** Detect language from CLI args, env vars, or system locale */
export function detectLanguage(): Lang {
  // 1. --lang flag
  const langIdx = process.argv.indexOf('--lang')
  if (langIdx >= 0 && process.argv[langIdx + 1]) {
    const val = process.argv[langIdx + 1]
    if (val === 'zh' || val === 'zh-CN' || val === 'zh-TW') return 'zh'
    if (val === 'en' || val === 'en-US') return 'en'
  }

  // 2. ERDL_LANG env
  const erdlLang = process.env.ERDL_LANG
  if (erdlLang) {
    if (erdlLang.startsWith('zh')) return 'zh'
    if (erdlLang.startsWith('en')) return 'en'
  }

  // 3. System LANG/LC_ALL
  const sysLang = process.env.LANG ?? process.env.LC_ALL ?? ''
  if (sysLang.startsWith('zh')) return 'zh'

  // 4. Default
  return 'en'
}

/** Get i18n strings for the detected language */
export function getI18n(lang?: Lang): I18nStrings {
  const l = lang ?? detectLanguage()
  return l === 'zh' ? zh as unknown as I18nStrings : en
}

/** Singleton */
let cached: I18nStrings | null = null

export function i18n(): I18nStrings {
  if (!cached) cached = getI18n()
  return cached
}
