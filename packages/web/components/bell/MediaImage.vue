<template>
  <div ref="containerRef" class="media-image-container" @click="$emit('click')">
    <img
      v-if="mediaUrl"
      :src="mediaUrl"
      :alt="filename"
      class="media-img"
    />
    <div v-else class="media-placeholder">
      <span v-if="isLoading" class="spinner">⏳</span>
      <span v-else class="placeholder-icon">🖼️</span>
      <span class="placeholder-filename">{{ filename || '画像なし' }}</span>
    </div>
    
    <!-- 拡大アイコンバッジ -->
    <div 
      v-if="mediaUrl" 
      class="zoom-badge"
      title="拡大表示"
    >
      <span>🔍</span>
      <span>拡大</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps<{
  filename: string;
  getMediaUrl: (filename: string) => Promise<string>;
}>();

defineEmits<{
  (e: 'click'): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const mediaUrl = ref<string>('');
const isLoading = ref<boolean>(false);
let observer: IntersectionObserver | null = null;

const loadMedia = async () => {
  if (mediaUrl.value || !props.filename) return;
  isLoading.value = true;
  try {
    mediaUrl.value = await props.getMediaUrl(props.filename);
  } catch (err) {
    console.error('Failed to load image:', props.filename, err);
  } finally {
    isLoading.value = false;
  }
};

watch(() => props.filename, () => {
  mediaUrl.value = '';
  loadMedia();
});

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      loadMedia();
      if (observer && containerRef.value) {
        observer.unobserve(containerRef.value);
      }
    }
  }, { rootMargin: '250px' });

  if (containerRef.value) {
    observer.observe(containerRef.value);
  }
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style scoped>
.media-image-container {
  position: relative;
  width: 100%;
  height: 200px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  overflow: hidden;
  background: #000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color var(--transition);
}

.media-image-container:hover {
  border-color: var(--accent);
}

.media-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  transition: transform var(--transition);
}

.media-image-container:hover .media-img {
  transform: scale(1.02);
}

.media-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.placeholder-icon {
  font-size: 1.8rem;
}

.placeholder-filename {
  font-family: monospace;
  font-size: 0.7rem;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.zoom-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 3px 8px;
  background: rgba(0, 0, 0, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #fff;
  font-size: 0.68rem;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity var(--transition);
}

.media-image-container:hover .zoom-badge {
  opacity: 1;
}
</style>
