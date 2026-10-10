// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2024-04-03',

  devtools: { enabled: false },
  app: {
    baseURL: '/app/',
    head: {
      link: [
        { rel: 'canonical', href: 'https://lambuage.com/app' }
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
    '@nuxtjs/i18n'
  ],

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
      appVersion: '2.0.0',
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


