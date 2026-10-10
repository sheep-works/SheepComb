<script setup lang="ts">
import { HelpCircle } from 'lucide-vue-next'

interface Props {
  href: string
  label?: string
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  compact: false,
})
</script>

<template>
  <a
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    class="manual-icon-link"
    :class="{ compact }"
    :title="label ? `${label} - マニュアルを開く` : 'マニュアルを開く'"
    @click.stop
  >
    <HelpCircle :size="compact ? 15 : 16" class="manual-icon" />
  </a>
</template>

<style scoped>
.manual-icon-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  text-decoration: none;
  transition: all var(--transition);
  flex-shrink: 0;
}

.manual-icon-link:hover {
  color: var(--accent);
  background: var(--bg-hover);
  border-color: var(--accent);
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
  transform: translateY(-1px);
}

.manual-icon-link.compact {
  width: 20px;
  height: 20px;
}

.manual-icon {
  flex-shrink: 0;
  transition: transform var(--transition);
}

.manual-icon-link:hover .manual-icon {
  transform: scale(1.1);
}
</style>
