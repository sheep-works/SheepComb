<template>
  <div ref="containerRef" class="media-video-container">
    <video
      v-if="mediaUrl"
      :src="mediaUrl"
      controls
      preload="metadata"
      class="video-player"
      playsinline
    ></video>
    <div v-else class="video-placeholder">
      <span v-if="isLoading" class="spinner">⏳</span>
      <span v-else class="placeholder-icon">🎬</span>
      <span class="placeholder-filename">{{ filename || '動画なし' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps<{
  filename: string;
  getMediaUrl: (filename: string) => Promise<string>;
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
    console.error('Failed to load video:', props.filename, err);
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
.media-video-container {
  position: relative;
  width: 100%;
  height: 200px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  overflow: hidden;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
  outline: none;
  background: #000;
}

.video-placeholder {
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
</style>
