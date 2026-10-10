<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { initWasm } from '~/utils/wasm'
import AppToast from '~/components/common/AppToast.vue'
import AppSidebarSlot from '~/components/common/AppSidebarSlot.vue'

const isWasmReady = ref(false)

onMounted(async () => {
  try {
    await initWasm()
    isWasmReady.value = true
  } catch {
    console.warn('WASM initialization failed. Some features may be unavailable.')
  }
})
</script>

<template>
  <div class="app-shell">
    <AppHeader v-model:wasm-ready="isWasmReady" />
    
    <div class="app-body-container">
      <main class="main-content">
        <slot />
      </main>
      <AppSidebarSlot />
    </div>

    <AppFooter />
    <AppToast />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.app-body-container {
  display: flex;
  flex: 1;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  gap: 24px;
}

.main-content {
  flex: 1;
  min-width: 0; /* flexbox のオーバーフロー防止 */
  width: 100%;
}
</style>
