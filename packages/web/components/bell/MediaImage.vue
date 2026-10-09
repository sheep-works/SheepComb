<template>
  <div ref="containerRef" class="media-image-container relative rounded-xl border border-white/10 overflow-hidden bg-black/40 cursor-pointer group">
    <img
      v-if="mediaUrl"
      :src="mediaUrl"
      :alt="filename"
      class="w-full h-full object-contain block transition-transform group-hover:scale-105 duration-200"
      @click="$emit('click')"
    />
    <div v-else class="flex flex-col items-center justify-center w-full h-full text-white/30 text-xs gap-2">
      <span v-if="isLoading" class="animate-spin text-lg">⏳</span>
      <span v-else class="text-2xl">🖼️</span>
      <span class="text-[11px] font-mono">{{ filename || '画像なし' }}</span>
    </div>
    
    <!-- 拡大アイコンバッジ -->
    <div 
      v-if="mediaUrl" 
      class="absolute bottom-2 right-2 px-2 py-1 bg-black/70 hover:bg-black/90 text-white/90 text-[10px] rounded-lg border border-white/20 backdrop-blur flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
      @click.stop="$emit('click')"
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
  width: 100%;
  height: 200px;
}
</style>
