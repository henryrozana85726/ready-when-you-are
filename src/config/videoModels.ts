// Video Models Configuration
// This file contains all the model configurations for video generation

export interface ModelConfig {
  id: string;
  name: string;
  displayName: string;
  server: 'server1' | 'server2';
  provider: 'fal_ai' | 'gmicloud';
  description?: string;
  
  // Feature flags
  supportsTextToVideo: boolean;
  supportsImageToVideo: boolean;
  supportsFirstLastFrame: boolean;
  supportsAudio: boolean;
  supportsNegativePrompt: boolean;
  supportsMotionControl?: boolean;
  
  // Input limits
  maxImages: number;
  maxVideoDuration?: number;
  
  // Available options
  aspectRatios: string[];
  durations: number[];
  resolutions: string[];
  modes: string[];
  
  // Default values
  defaultAspectRatio: string;
  defaultDuration: number;
  defaultResolution: string;
  defaultMode: string;
  
  // Conditional logic
  aspectRatioConditions?: {
    textToVideoOnly?: boolean;
    hideWhenImageToVideoStandard?: boolean;
  };
  modeConditions?: {
    textToVideo?: string[];
    imageToVideo?: string[];
    firstLastFrame?: string[];
  };
  
  // API documentation URLs
  apiDocs: {
    textToVideo?: string;
    imageToVideo?: string;
    textToVideoPro?: string;
    imageToVideoPro?: string;
    motionControl?: string;
    motionControlPro?: string;
  };
}

export interface PricingConfig {
  duration?: number;
  audioOn?: boolean;
  mode?: string;
  resolution?: string;
  price: number;
  pricePerSecond?: number;
}

export interface ModelWithPricing extends ModelConfig {
  pricing: PricingConfig[];
}

// Server 1 Models (fal.ai)
export const server1Models: ModelWithPricing[] = [
  {
    id: 'veo-3.1-fast-s1',
    name: 'veo-3.1-fast',
    displayName: 'Google Veo 3.1 Fast',
    server: 'server1',
    provider: 'fal_ai',
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsFirstLastFrame: true,
    supportsAudio: true,
    supportsNegativePrompt: false,
    maxImages: 2,
    aspectRatios: ['auto', '16:9', '9:16'],
    durations: [4, 6, 8],
    resolutions: ['720p', '1080p'],
    modes: ['standard'],
    defaultAspectRatio: 'auto',
    defaultDuration: 8,
    defaultResolution: '1080p',
    defaultMode: 'standard',
    apiDocs: {},
    pricing: [
      { duration: 4, audioOn: false, price: 0.4 },
      { duration: 6, audioOn: false, price: 0.6 },
      { duration: 8, audioOn: false, price: 0.8 },
      { duration: 4, audioOn: true, price: 0.6 },
      { duration: 6, audioOn: true, price: 0.9 },
      { duration: 8, audioOn: true, price: 1.2 },
    ],
  },
  {
    id: 'sora-2-s1',
    name: 'sora-2',
    displayName: 'Sora 2',
    server: 'server1',
    provider: 'fal_ai',
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsFirstLastFrame: false,
    supportsAudio: false,
    supportsNegativePrompt: false,
    maxImages: 1,
    aspectRatios: ['16:9', '9:16'],
    durations: [4, 8, 12],
    resolutions: ['720p'],
    modes: ['standard'],
    defaultAspectRatio: '16:9',
    defaultDuration: 8,
    defaultResolution: '720p',
    defaultMode: 'standard',
    apiDocs: {},
    pricing: [
      { duration: 4, price: 0.4 },
      { duration: 8, price: 0.8 },
      { duration: 12, price: 1.2 },
    ],
  },
  {
    id: 'kling-v2.6-s1',
    name: 'kling-v2.6',
    displayName: 'Kling v2.6',
    server: 'server1',
    provider: 'fal_ai',
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsFirstLastFrame: false,
    supportsAudio: true,
    supportsNegativePrompt: true,
    maxImages: 2,
    aspectRatios: ['9:16', '16:9', '1:1'],
    durations: [5, 10],
    resolutions: ['720p'],
    modes: ['pro'],
    defaultAspectRatio: '16:9',
    defaultDuration: 5,
    defaultResolution: '720p',
    defaultMode: 'pro',
    aspectRatioConditions: { textToVideoOnly: true },
    apiDocs: {
      textToVideo: 'https://fal.ai/models/fal-ai/kling-video/v2.6/pro/text-to-video/api',
      imageToVideo: 'https://fal.ai/models/fal-ai/kling-video/v2.6/pro/image-to-video/api',
    },
    pricing: [
      { duration: 5, audioOn: false, price: 0.35 },
      { duration: 5, audioOn: true, price: 0.7 },
      { duration: 10, audioOn: false, price: 0.7 },
      { duration: 10, audioOn: true, price: 1.4 },
    ],
  },
  {
    id: 'kling-v2.6-motion-s1',
    name: 'kling-v2.6-motion',
    displayName: 'Kling v2.6 - Motion Control',
    server: 'server1',
    provider: 'fal_ai',
    supportsTextToVideo: false,
    supportsImageToVideo: true,
    supportsFirstLastFrame: false,
    supportsAudio: true,
    supportsNegativePrompt: false,
    supportsMotionControl: true,
    maxImages: 1,
    maxVideoDuration: 30,
    aspectRatios: [],
    durations: [],
    resolutions: ['720p'],
    modes: ['standard', 'pro'],
    defaultAspectRatio: '',
    defaultDuration: 0,
    defaultResolution: '720p',
    defaultMode: 'standard',
    apiDocs: {
      motionControl: 'https://fal.ai/models/fal-ai/kling-video/v2.6/standard/motion-control/api',
      motionControlPro: 'https://fal.ai/models/fal-ai/kling-video/v2.6/pro/motion-control/api',
    },
    pricing: [
      { mode: 'standard', pricePerSecond: 0.07, price: 0 },
      { mode: 'pro', pricePerSecond: 0.112, price: 0 },
    ],
  },
  {
    id: 'kling-v2.5-turbo-s1',
    name: 'kling-v2.5-turbo',
    displayName: 'Kling v2.5 Turbo',
    server: 'server1',
    provider: 'fal_ai',
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsFirstLastFrame: true,
    supportsAudio: false,
    supportsNegativePrompt: true,
    maxImages: 2,
    aspectRatios: ['16:9', '9:16', '1:1'],
    durations: [5, 10],
    resolutions: ['720p'],
    modes: ['standard', 'pro'],
    defaultAspectRatio: '16:9',
    defaultDuration: 5,
    defaultResolution: '720p',
    defaultMode: 'standard',
    aspectRatioConditions: { textToVideoOnly: true },
    modeConditions: {
      textToVideo: ['pro'],
      imageToVideo: ['standard', 'pro'],
      firstLastFrame: ['pro'],
    },
    apiDocs: {
      imageToVideo: 'https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/standard/image-to-video/api',
      textToVideoPro: 'https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/text-to-video/api',
      imageToVideoPro: 'https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/image-to-video/api',
    },
    pricing: [
      { duration: 5, mode: 'standard', price: 0.21 },
      { duration: 10, mode: 'standard', price: 0.42 },
      { duration: 5, mode: 'pro', price: 0.35 },
      { duration: 10, mode: 'pro', price: 0.7 },
    ],
  },
  {
    id: 'kling-v2.1-s1',
    name: 'kling-v2.1',
    displayName: 'Kling v2.1',
    server: 'server1',
    provider: 'fal_ai',
    supportsTextToVideo: false,
    supportsImageToVideo: true,
    supportsFirstLastFrame: true,
    supportsAudio: false,
    supportsNegativePrompt: true,
    maxImages: 2,
    aspectRatios: [],
    durations: [5, 10],
    resolutions: ['720p'],
    modes: ['standard', 'pro'],
    defaultAspectRatio: '',
    defaultDuration: 5,
    defaultResolution: '720p',
    defaultMode: 'standard',
    modeConditions: {
      imageToVideo: ['standard', 'pro'],
      firstLastFrame: ['pro'],
    },
    apiDocs: {
      imageToVideo: 'https://fal.ai/models/fal-ai/kling-video/v2.1/standard/image-to-video/api',
      imageToVideoPro: 'https://fal.ai/models/fal-ai/kling-video/v2.1/pro/image-to-video/api',
    },
    pricing: [
      { duration: 5, mode: 'standard', price: 0.3 },
      { duration: 10, mode: 'standard', price: 0.6 },
      { duration: 5, mode: 'pro', price: 0.5 },
      { duration: 10, mode: 'pro', price: 1.0 },
    ],
  },
  {
    id: 'kling-v1.6-s1',
    name: 'kling-v1.6',
    displayName: 'Kling v1.6',
    server: 'server1',
    provider: 'fal_ai',
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsFirstLastFrame: true,
    supportsAudio: false,
    supportsNegativePrompt: true,
    maxImages: 2,
    aspectRatios: ['16:9', '9:16'],
    durations: [5, 10],
    resolutions: ['720p'],
    modes: ['standard', 'pro'],
    defaultAspectRatio: '16:9',
    defaultDuration: 5,
    defaultResolution: '720p',
    defaultMode: 'standard',
    aspectRatioConditions: { hideWhenImageToVideoStandard: true },
    modeConditions: {
      textToVideo: ['standard', 'pro'],
      imageToVideo: ['standard', 'pro'],
      firstLastFrame: ['pro'],
    },
    apiDocs: {
      textToVideo: 'https://fal.ai/models/fal-ai/kling-video/v1.6/standard/text-to-video/api',
      textToVideoPro: 'https://fal.ai/models/fal-ai/kling-video/v1.6/pro/text-to-video/api',
      imageToVideo: 'https://fal.ai/models/fal-ai/kling-video/v1.6/standard/image-to-video/api',
      imageToVideoPro: 'https://fal.ai/models/fal-ai/kling-video/v1.6/pro/image-to-video/api',
    },
    pricing: [
      { duration: 5, mode: 'standard', price: 0.25 },
      { duration: 10, mode: 'standard', price: 0.5 },
      { duration: 5, mode: 'pro', price: 0.5 },
      { duration: 10, mode: 'pro', price: 1.0 },
    ],
  },
];

// Server 2 Models (gmicloud)
export const server2Models: ModelWithPricing[] = [
  {
    id: 'veo-3.1-fast-s2',
    name: 'veo-3.1-fast',
    displayName: 'Google Veo 3.1 Fast',
    server: 'server2',
    provider: 'gmicloud',
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsFirstLastFrame: true,
    supportsAudio: true,
    supportsNegativePrompt: false,
    maxImages: 2,
    aspectRatios: ['16:9', '9:16'],
    durations: [4, 6, 8],
    resolutions: ['720p'],
    modes: ['standard'],
    defaultAspectRatio: '16:9',
    defaultDuration: 8,
    defaultResolution: '720p',
    defaultMode: 'standard',
    apiDocs: {
      textToVideo: 'https://console.gmicloud.ai/playground/video/veo-3.1-fast-generate-preview?tab=Description',
    },
    pricing: [
      { duration: 4, audioOn: false, price: 0.4 },
      { duration: 6, audioOn: false, price: 0.6 },
      { duration: 8, audioOn: false, price: 0.8 },
      { duration: 4, audioOn: true, price: 0.6 },
      { duration: 6, audioOn: true, price: 0.9 },
      { duration: 8, audioOn: true, price: 1.2 },
    ],
  },
  {
    id: 'sora-2-s2',
    name: 'sora-2',
    displayName: 'Sora 2',
    server: 'server2',
    provider: 'gmicloud',
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsFirstLastFrame: false,
    supportsAudio: false,
    supportsNegativePrompt: false,
    maxImages: 1,
    aspectRatios: ['16:9', '9:16'],
    durations: [4, 8, 12],
    resolutions: ['720p'],
    modes: ['standard'],
    defaultAspectRatio: '16:9',
    defaultDuration: 8,
    defaultResolution: '720p',
    defaultMode: 'standard',
    apiDocs: {
      textToVideo: 'https://console.gmicloud.ai/playground/video/sora-2?tab=Description',
    },
    pricing: [
      { duration: 4, price: 0.4 },
      { duration: 8, price: 0.8 },
      { duration: 12, price: 1.2 },
    ],
  },
  {
    id: 'kling-v2.6-motion-s2',
    name: 'kling-v2.6-motion',
    displayName: 'Kling v2.6 - Motion Control',
    server: 'server2',
    provider: 'gmicloud',
    supportsTextToVideo: false,
    supportsImageToVideo: true,
    supportsFirstLastFrame: false,
    supportsAudio: true,
    supportsNegativePrompt: false,
    supportsMotionControl: true,
    maxImages: 1,
    maxVideoDuration: 30,
    aspectRatios: [],
    durations: [],
    resolutions: ['720p'],
    modes: ['standard', 'pro'],
    defaultAspectRatio: '',
    defaultDuration: 0,
    defaultResolution: '720p',
    defaultMode: 'standard',
    apiDocs: {
      motionControl: 'https://console.gmicloud.ai/playground/video/kling-2.6-motion-control?tab=Description',
    },
    pricing: [
      { mode: 'standard', pricePerSecond: 0.07, price: 0 },
      { mode: 'pro', pricePerSecond: 0.112, price: 0 },
    ],
  },
  {
    id: 'kling-v2.6-s2',
    name: 'kling-v2.6',
    displayName: 'Kling v2.6',
    server: 'server2',
    provider: 'gmicloud',
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsFirstLastFrame: false,
    supportsAudio: true,
    supportsNegativePrompt: false,
    maxImages: 1,
    aspectRatios: [],
    durations: [5, 10],
    resolutions: ['720p'],
    modes: ['pro'],
    defaultAspectRatio: '',
    defaultDuration: 5,
    defaultResolution: '720p',
    defaultMode: 'pro',
    apiDocs: {
      textToVideo: 'https://console.gmicloud.ai/playground/video/kling-v2-6?tab=Description',
    },
    pricing: [
      { duration: 5, audioOn: false, price: 0.35 },
      { duration: 10, audioOn: false, price: 0.7 },
      { duration: 5, audioOn: true, price: 0.7 },
      { duration: 10, audioOn: true, price: 1.4 },
    ],
  },
  {
    id: 'kling-v2.5-turbo-s2',
    name: 'kling-v2.5-turbo',
    displayName: 'Kling v2.5 Turbo',
    server: 'server2',
    provider: 'gmicloud',
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsFirstLastFrame: false,
    supportsAudio: false,
    supportsNegativePrompt: true,
    maxImages: 1,
    aspectRatios: [],
    durations: [5, 10],
    resolutions: ['720p'],
    modes: ['pro'],
    defaultAspectRatio: '',
    defaultDuration: 5,
    defaultResolution: '720p',
    defaultMode: 'pro',
    apiDocs: {
      textToVideo: 'https://console.gmicloud.ai/playground/video/kling-v2-5-turbo?tab=Description',
    },
    pricing: [
      { duration: 5, price: 0.35 },
      { duration: 10, price: 0.7 },
    ],
  },
  {
    id: 'kling-v2.1-s2',
    name: 'kling-v2.1',
    displayName: 'Kling v2.1',
    server: 'server2',
    provider: 'gmicloud',
    supportsTextToVideo: false,
    supportsImageToVideo: true,
    supportsFirstLastFrame: false,
    supportsAudio: false,
    supportsNegativePrompt: true,
    maxImages: 1,
    aspectRatios: [],
    durations: [5, 10],
    resolutions: ['720p'],
    modes: ['standard', 'pro'],
    defaultAspectRatio: '',
    defaultDuration: 5,
    defaultResolution: '720p',
    defaultMode: 'standard',
    apiDocs: {
      imageToVideo: 'https://console.gmicloud.ai/playground/video/Kling-Image2Video-V2.1-Standard?tab=Description',
      imageToVideoPro: 'https://console.gmicloud.ai/playground/video/Kling-Image2Video-V2.1-Pro?tab=Description',
    },
    pricing: [
      { duration: 5, mode: 'standard', price: 0.3 },
      { duration: 10, mode: 'standard', price: 0.6 },
      { duration: 5, mode: 'pro', price: 0.5 },
      { duration: 10, mode: 'pro', price: 1.0 },
    ],
  },
  {
    id: 'kling-v1.6-s2',
    name: 'kling-v1.6',
    displayName: 'Kling v1.6',
    server: 'server2',
    provider: 'gmicloud',
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsFirstLastFrame: true,
    supportsAudio: false,
    supportsNegativePrompt: true,
    maxImages: 2,
    aspectRatios: ['16:9', '9:16'],
    durations: [5, 10],
    resolutions: ['720p'],
    modes: ['standard', 'pro'],
    defaultAspectRatio: '16:9',
    defaultDuration: 5,
    defaultResolution: '720p',
    defaultMode: 'standard',
    aspectRatioConditions: { textToVideoOnly: true },
    modeConditions: {
      textToVideo: ['standard'],
      imageToVideo: ['standard', 'pro'],
      firstLastFrame: ['pro'],
    },
    apiDocs: {
      textToVideo: 'https://console.gmicloud.ai/playground/video/Kling-Text2Video-V1.6-Standard?tab=Description',
      imageToVideo: 'https://console.gmicloud.ai/playground/video/Kling-Image2Video-V1.6-Standard?tab=Description',
      imageToVideoPro: 'https://console.gmicloud.ai/playground/video/Kling-Image2Video-V1.6-Pro?tab=Description',
    },
    pricing: [
      { duration: 5, mode: 'standard', price: 0.3 },
      { duration: 10, mode: 'standard', price: 0.6 },
      { duration: 5, mode: 'pro', price: 0.5 },
      { duration: 10, mode: 'pro', price: 1.0 },
    ],
  },
];

export const allModels = [...server1Models, ...server2Models];

export const getModelById = (id: string): ModelWithPricing | undefined => {
  return allModels.find((m) => m.id === id);
};

export const getModelsByServer = (server: 'server1' | 'server2'): ModelWithPricing[] => {
  return server === 'server1' ? server1Models : server2Models;
};

export const calculatePrice = (
  model: ModelWithPricing,
  options: {
    duration?: number;
    audioOn?: boolean;
    mode?: string;
    resolution?: string;
    videoDuration?: number; // For per-second pricing
  }
): number => {
  const { duration, audioOn, mode, resolution, videoDuration } = options;

  // Find matching pricing
  for (const p of model.pricing) {
    // Check for per-second pricing
    if (p.pricePerSecond && videoDuration) {
      if (!mode || p.mode === mode) {
        return p.pricePerSecond * videoDuration;
      }
      continue;
    }

    // Match by all provided criteria
    let matches = true;
    if (duration !== undefined && p.duration !== undefined && p.duration !== duration) matches = false;
    if (audioOn !== undefined && p.audioOn !== undefined && p.audioOn !== audioOn) matches = false;
    if (mode && p.mode && p.mode !== mode) matches = false;
    if (resolution && p.resolution && p.resolution !== resolution) matches = false;

    if (matches) {
      return p.price;
    }
  }

  // Fallback to first price or 0
  return model.pricing[0]?.price || 0;
};
