// Image Generation Models Configuration

export interface ImageModelConfig {
  id: string;
  name: string;
  displayName: string;
  server: 'server1' | 'server2';
  provider: string;
  description?: string;
  apiDocs: string;
  
  // Feature support
  supportsTextToImage: boolean;
  supportsImageToImage: boolean;
  maxImages: number;
  
  // Options
  aspectRatios: string[];
  resolutions: string[];
  outputFormats: string[];
  
  // Defaults
  defaultAspectRatio: string;
  defaultResolution: string;
  defaultOutputFormat: string;
  
  // Conditional logic
  aspectRatioConditions?: {
    addAutoForImageMode?: boolean;
  };
  
  // Image upload constraints (for server 2)
  imageConstraints?: {
    maxSizeMb?: number;
    allowedFormats?: string[];
  };
}

export interface ImagePricingConfig {
  resolution?: string;
  price: number;
}

export interface ImageModelWithPricing extends ImageModelConfig {
  pricing: ImagePricingConfig[];
}

// Server 1 Models (fal.ai)
export const server1Models: ImageModelWithPricing[] = [
  {
    id: 'server1-nano-banana-pro',
    name: 'fal-ai/nano-banana-pro',
    displayName: 'Nano Banana Pro',
    server: 'server1',
    provider: 'fal.ai',
    description: 'Fast high-quality image generation with text or image input',
    apiDocs: 'https://fal.ai/models/fal-ai/nano-banana-pro/api',
    
    supportsTextToImage: true,
    supportsImageToImage: true,
    maxImages: 14,
    
    aspectRatios: ['21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16'],
    resolutions: ['1K', '2K', '4K'],
    outputFormats: ['png', 'jpeg', 'webp'],
    
    defaultAspectRatio: '1:1',
    defaultResolution: '1K',
    defaultOutputFormat: 'png',
    
    aspectRatioConditions: {
      addAutoForImageMode: true,
    },
    
    pricing: [
      { resolution: '1K', price: 0.15 },
      { resolution: '2K', price: 0.15 },
      { resolution: '4K', price: 0.3 },
    ],
  },
  {
    id: 'server1-imagen3',
    name: 'fal-ai/imagen3',
    displayName: 'Imagen 3',
    server: 'server1',
    provider: 'fal.ai',
    description: 'Google Imagen 3 text-to-image model',
    apiDocs: 'https://fal.ai/models/fal-ai/imagen3/api',
    
    supportsTextToImage: true,
    supportsImageToImage: false,
    maxImages: 0,
    
    aspectRatios: ['1:1', '16:9', '9:16', '3:4', '4:3'],
    resolutions: [],
    outputFormats: [],
    
    defaultAspectRatio: '1:1',
    defaultResolution: '',
    defaultOutputFormat: '',
    
    pricing: [
      { price: 0.05 },
    ],
  },
  {
    id: 'server1-imagen4-ultra',
    name: 'fal-ai/imagen4/preview/ultra',
    displayName: 'Imagen 4 Ultra',
    server: 'server1',
    provider: 'fal.ai',
    description: 'Google Imagen 4 Ultra preview model',
    apiDocs: 'https://fal.ai/models/fal-ai/imagen4/preview/ultra/api',
    
    supportsTextToImage: true,
    supportsImageToImage: false,
    maxImages: 0,
    
    aspectRatios: ['1:1', '16:9', '9:16', '3:4', '4:3'],
    resolutions: ['1K', '2K'],
    outputFormats: ['png', 'jpeg', 'webp'],
    
    defaultAspectRatio: '1:1',
    defaultResolution: '1K',
    defaultOutputFormat: 'png',
    
    pricing: [
      { price: 0.06 },
    ],
  },
  {
    id: 'server1-seedream-4.5',
    name: 'fal-ai/bytedance/seedream/v4.5/text-to-image',
    displayName: 'Seedream 4.5',
    server: 'server1',
    provider: 'fal.ai',
    description: 'Seedream 4.5 high-quality image generation',
    apiDocs: 'https://fal.ai/models/fal-ai/bytedance/seedream/v4.5/text-to-image/api',
    
    supportsTextToImage: true,
    supportsImageToImage: true,
    maxImages: 20,
    
    aspectRatios: ['square_hd', 'square', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9', 'auto_2K', 'auto_4K'],
    resolutions: [],
    outputFormats: [],
    
    defaultAspectRatio: 'square_hd',
    defaultResolution: '',
    defaultOutputFormat: '',
    
    pricing: [
      { price: 0.04 },
    ],
  },
];

// Server 2 Models (GMI Cloud)
export const server2Models: ImageModelWithPricing[] = [
  {
    id: 'server2-nano-banana-pro',
    name: 'gemini-3-pro-image-preview',
    displayName: 'Nano Banana Pro',
    server: 'server2',
    provider: 'gmi-cloud',
    description: 'Fast image generation with text or image input',
    apiDocs: 'https://console.gmicloud.ai/playground/image/gemini-3-pro-image-preview?tab=Description',
    
    supportsTextToImage: true,
    supportsImageToImage: true,
    maxImages: 5,
    
    aspectRatios: ['1:1', '4:5', '5:4', '3:4', '4:3', '9:16', '16:9', '21:9'],
    resolutions: ['1K', '2K', '4K'],
    outputFormats: ['png', 'jpeg', 'webp'],
    
    defaultAspectRatio: '1:1',
    defaultResolution: '1K',
    defaultOutputFormat: 'png',
    
    aspectRatioConditions: {
      addAutoForImageMode: true,
    },
    
    imageConstraints: {
      maxSizeMb: 10,
      allowedFormats: ['jpg', 'png', 'jpeg'],
    },
    
    pricing: [
      { resolution: '1K', price: 0.15 },
      { resolution: '2K', price: 0.15 },
      { resolution: '4K', price: 0.3 },
    ],
  },
  {
    id: 'server2-seedream-4',
    name: 'seedream-4-0-250828',
    displayName: 'Seedream 4',
    server: 'server2',
    provider: 'gmi-cloud',
    description: 'Seedream 4 high-quality image generation',
    apiDocs: 'https://console.gmicloud.ai/playground/image/seedream-4-0-250828?tab=Description',
    
    supportsTextToImage: true,
    supportsImageToImage: true,
    maxImages: 10,
    
    aspectRatios: [
      '1K', '2K', '4K',
      '1024x1024(1:1)', '1440x2560(9:16)', '1664x2496(2:3)', '1728x2304(3:4)',
      '2048x2048(1:1)', '2304x1728(4:3)', '2496x1664(3:2)', '2560x1440(16:9)',
      '3024x1296(21:9)', '4096x4096(1:1)'
    ],
    resolutions: [],
    outputFormats: [],
    
    defaultAspectRatio: '1024x1024(1:1)',
    defaultResolution: '',
    defaultOutputFormat: '',
    
    imageConstraints: {
      maxSizeMb: 10,
      allowedFormats: ['jpg', 'png', 'jpeg'],
    },
    
    pricing: [
      { price: 0.05 },
    ],
  },
];

// Combined models list
export const allImageModels = [...server1Models, ...server2Models];

// Helper functions
export const getImageModelById = (id: string): ImageModelWithPricing | undefined => {
  return allImageModels.find(m => m.id === id);
};

export const getImageModelsByServer = (server: 'server1' | 'server2'): ImageModelWithPricing[] => {
  return server === 'server1' ? server1Models : server2Models;
};

export const calculateImagePrice = (
  model: ImageModelWithPricing,
  options: { resolution?: string }
): number => {
  const { resolution } = options;
  
  // Find matching price based on resolution
  if (resolution && model.pricing.length > 1) {
    const match = model.pricing.find(p => p.resolution === resolution);
    if (match) return match.price;
  }
  
  // Default to first price
  return model.pricing[0]?.price || 0;
};
