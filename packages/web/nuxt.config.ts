import pkg from '../../package.json'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2024-04-03',

  devtools: { enabled: false },
  app: {
    baseURL: '/app/',
    head: {
      title: 'SheepComb - 翻訳支援Webポータル',
      link: [
        { rel: 'canonical', href: 'https://lambuage.com/app' },
        { rel: 'manifest', href: '/app/manifest.webmanifest' },
        { rel: 'icon', type: 'image/svg+xml', href: '/app/icon.svg' },
        { rel: 'alternate icon', type: 'image/png', href: '/app/icon-192.png' },
        { rel: 'apple-touch-icon', href: '/app/icon-192.png' }
      ],
      script: [
        {
          src: 'https://www.googletagmanager.com/gtag/js?id=G-PFT0GHJFSL',
          async: true
        },
        {
          innerHTML: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-PFT0GHJFSL');`
        },
        {
          id: '_bownow_ts',
          innerHTML: `var _bownow_ts = document.createElement('script');\n_bownow_ts.charset = 'utf-8';\n_bownow_ts.src = 'https://contents.bownow.jp/js/UTC_0b6e8f464ee2de6eb03f/trace.js';\ndocument.getElementsByTagName('head')[0].appendChild(_bownow_ts);`
        }
      ]
    }
  },
  modules: [
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/i18n',
    '@nuxtjs/sitemap',
    '@vite-pwa/nuxt'
  ],

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      id: '/app/',
      name: 'SheepComb - 翻訳支援Webポータル',
      short_name: 'SheepComb',
      description: '多言語ドキュメント抽出・翻訳支援・差分解析Webポータル',
      theme_color: '#1e1e2e',
      background_color: '#11111b',
      display: 'standalone',
      orientation: 'any',
      scope: '/app/',
      start_url: '/app/',
      icons: [
        {
          src: '/app/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/app/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: '/app/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: '/app/icon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any'
        }
      ]
    },
    workbox: {
      navigateFallback: '/app/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,wasm}'],
      // WASM 等の大きなファイルを確実にオフラインキャッシュできるように上限を緩和 (5MB)
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
    },
    client: {
      installPrompt: true
    },
    devOptions: {
      // 開発中は Service Worker を無効にして開発時のホットリロードやキャッシュ競合を防ぐ
      enabled: false,
      type: 'module'
    }
  },

  site: {
    url: 'https://lambuage.com'
  },

  sitemap: {
    sitemaps: false
  },

  i18n: {
    locales: [
      { code: 'ja', file: 'ja.json', name: '日本語' },
      { code: 'en', file: 'en.json', name: 'English' },
      { code: 'zh', file: 'zh.json', name: '中文' }
    ],
    langDir: 'locales/',
    defaultLocale: 'ja',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root', // ルートアクセス時にCookieを見てリダイレクト
      alwaysRedirect: true
    }
  },
  nitro: {
    preset: 'static',
    devProxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        prependPath: true,
      },
    },
  },
  runtimeConfig: {
    public: {
      appVersion: pkg.version || '2.0.1',
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || '/api',
      apiPort: process.env.NUXT_PUBLIC_API_PORT || '',
      apiKey: process.env.NUXT_PUBLIC_API_KEY,  // 追加
      apiDev: process.env.NUXT_PUBLIC_API_DEV,
      gaMeasurementId: process.env.NUXT_PUBLIC_GA_MEASUREMENT_ID || 'G-PFT0GHJFSL'
    }
  },
  devServer: {
    host: '127.0.0.1',
    port: 3000
  },
  css: ['~/assets/main.css'],
  vite: {
    optimizeDeps: {
      include: [
        'lucide-vue-next',
        'jszip',
        'xlsx',
        'difflib-ts',
        'flexsearch',
        '@xmldom/xmldom',
        '@codemirror/view',
        '@codemirror/state',
        '@codemirror/commands',
      ]
    }
  },
  // Nuxt 3 uses file-based routing, so we don't need explicit router config here
})
