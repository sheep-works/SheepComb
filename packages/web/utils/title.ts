import type { RouteLocationNormalizedLoaded, RouteLocationNormalized } from 'vue-router'

/**
 * ルート情報からBowNow・GA・ブラウザタブ向けの完全なページタイトルを生成する
 */
export function getPageTitle(route: RouteLocationNormalizedLoaded | RouteLocationNormalized): string {
  const path = route.path.replace(/^\/(?:en|zh)(?=\/|$)/, '') || '/'
  const metaTitle = (route.meta?.title as string) || ''

  if (path === '/' || path === '') {
    return 'SheepComb - 翻訳支援Webポータル'
  }
  if (path.startsWith('/shuttle')) {
    return `${metaTitle || 'Shuttle'} - SheepShuttle | SheepComb`
  }
  if (path.startsWith('/groom')) {
    return `${metaTitle || 'SheepGroom (対訳作成支援)'} | SheepComb`
  }
  if (path.startsWith('/bell')) {
    return `${metaTitle || 'SheepBell (LQA支援)'} | SheepComb`
  }
  if (path.startsWith('/tools')) {
    return `${metaTitle || 'ツール'} - Tools | SheepComb`
  }
  if (path.startsWith('/play')) {
    return `${metaTitle || '実験室'} - Playground | SheepComb`
  }
  if (path.startsWith('/manual')) {
    return 'マニュアル (Manual) | SheepComb'
  }
  if (path.startsWith('/license')) {
    return 'オープンソースライセンス (License) | SheepComb'
  }
  return metaTitle ? `${metaTitle} | SheepComb` : 'SheepComb'
}
