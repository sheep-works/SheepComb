<template>
  <div ref="containerRef" class="media-video-container relative rounded-xl border border-white/10 overflow-hidden bg-black flex items-center justify-center">
    <video
      v-if="mediaUrl"
      :src="mediaUrl"
      controls
      preload="metadata"
      class="w-full h-full object-contain outline-none bg-black"
      playsinline
    ></video>
    <div v-else class="flex flex-col items-center justify-center w-full h-full text-white/30 text-xs gap-2">
      <span v-if="isLoading" class="animate-spin text-lg">⏳</span>
      <span v-else class="text-2xl">🎬</span>
      <span class="text-[11px] font-mono">{{ filename || '動画なし' }}</span>
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
  width: 100%;
  height: 200px;
}
</style>
