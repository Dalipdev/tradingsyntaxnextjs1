import Embed from "@editorjs/embed";
import List from "@editorjs/list";
import Image from "@editorjs/image";
import Header from "@editorjs/header";
import Quote from "@editorjs/quote";
import Marker from "@editorjs/marker";
import InlineCode from "@editorjs/inline-code";
import { uploadImage } from "@/lib/aws";

// ✅ IMPROVED: Upload function with better error handling and progress
const uploadImageByFile = async (file) => {
  // ✅ ADD: Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    console.error('Invalid file type:', file.type);
    return { 
      success: 0,
      error: 'Invalid file type. Please upload JPEG, PNG, WebP, or GIF images.'
    };
  }

  // ✅ ADD: Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    console.error('File too large:', file.size);
    return { 
      success: 0,
      error: 'File is too large. Maximum size is 5MB.'
    };
  }

  try {
    const url = await uploadImage(file);
    
    if (url) {
      return {
        success: 1,
        file: { 
          url,
          // ✅ ADD: Additional metadata for better rendering
          size: file.size,
          name: file.name,
          type: file.type
        }
      };
    }
    
    return { 
      success: 0,
      error: 'Upload failed. Please try again.'
    };
    
  } catch (error) {
    console.error("Image upload failed:", error);
    return { 
      success: 0,
      error: error.message || 'Upload failed. Please try again.'
    };
  }
};

// ✅ ADD: Upload by URL function for flexibility
const uploadImageByUrl = async (url) => {
  try {
    // ✅ ADD: Basic URL validation
    const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i;
    if (!urlPattern.test(url)) {
      return {
        success: 0,
        error: 'Invalid image URL. Must be JPEG, PNG, WebP, or GIF.'
      };
    }

    return {
      success: 1,
      file: { url }
    };
  } catch (error) {
    console.error("URL validation failed:", error);
    return { 
      success: 0,
      error: 'Invalid URL. Please check and try again.'
    };
  }
};

// ✅ OPTIMIZED: Frozen object prevents accidental mutations
export const tools = Object.freeze({
  embed: {
    class: Embed,
    inlineToolbar: false,
    config: {
      services: {
        youtube: true,
        coub: true,
        // ✅ REMOVED: Twitter (now X, may have API changes)
        // ✅ ADD: More modern embed services
        vimeo: true,
        codepen: true,
        instagram: true,
        twitter: {
          regex: /https?:\/\/(www\.)?(twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)/,
          embedUrl: 'https://twitframe.com/show?url=<%= remote_id %>',
          html: '<iframe style="width: 100%;" height="600" scrolling="no"></iframe>',
          height: 600,
          width: 600,
          id: (groups) => groups.join('/status/')
        },
        // ✅ ADD: GitHub Gist support
        gist: true,
        // ✅ ADD: Pinterest support
        pinterest: true
      }
    }
  },
  list: {
    class: List,
    inlineToolbar: true,
    config: {
      defaultStyle: 'unordered'  // ✅ KEEP: Good default
    },
    // ✅ ADD: Keyboard shortcuts
    shortcut: 'CMD+SHIFT+L'
  },
  image: {
    class: Image,
    config: {
      uploader: {
        uploadByFile: uploadImageByFile,
        uploadByUrl: uploadImageByUrl  // ✅ ADD: URL upload support
      },
      // ✅ ADD: Additional image configuration
      captionPlaceholder: 'Enter image caption (optional)',
      buttonContent: 'Select an image',
      types: 'image/jpeg,image/jpg,image/png,image/webp,image/gif',  // ✅ ADD: File picker filter
      // ✅ ADD: Image features
      withBorder: true,
      withBackground: true,
      stretched: true,
      backgroundColor: '#f5f5f5'
    }
  },
  header: {
    class: Header,
    inlineToolbar: true,
    config: {
      placeholder: "Enter a heading...",  // ✅ IMPROVED: Better placeholder
      levels: [2, 3, 4],  // ✅ KEEP: Good SEO practice (no h1 in content)
      defaultLevel: 2
    },
    // ✅ ADD: Keyboard shortcuts for different levels
    shortcut: 'CMD+SHIFT+H'
  },
  quote: {
    class: Quote,
    inlineToolbar: true,
    config: {
      quotePlaceholder: "Enter a quote...",  // ✅ IMPROVED: Better placeholder
      captionPlaceholder: "Quote's author (optional)"  // ✅ IMPROVED: Indicate it's optional
    },
    // ✅ ADD: Keyboard shortcut
    shortcut: 'CMD+SHIFT+Q'
  },
  marker: {
    class: Marker,
    shortcut: "CMD+SHIFT+M"  // ✅ KEEP: Good shortcut
  },
  inlineCode: {
    class: InlineCode,
    shortcut: "CMD+SHIFT+C"  // ✅ KEEP: Good shortcut
  }
});

// ✅ ADD: Editor configuration constants
export const EDITOR_CONFIG = Object.freeze({
  // ✅ ADD: Placeholder text
  placeholder: 'Start writing your blog post...',
  
  // ✅ ADD: Minimum content height
  minHeight: 400,
  
  // ✅ ADD: Autofocus
  autofocus: true,
  
  // ✅ ADD: Log level for debugging
  logLevel: process.env.NODE_ENV === 'development' ? 'VERBOSE' : 'ERROR',
  
  // ✅ ADD: Sanitizer config for security
  sanitizer: {
    b: true,
    i: true,
    u: true,
    s: true,
    a: {
      href: true,
      target: '_blank',
      rel: 'noopener noreferrer'
    },
    mark: {
      class: true
    },
    code: {
      class: true
    }
  },
  
  // ✅ ADD: I18n configuration
  i18n: {
    messages: {
      ui: {
        blockTunes: {
          toggler: {
            'Click to tune': 'Click to configure',
          }
        }
      },
      toolNames: {
        'Text': 'Paragraph',
        'Heading': 'Header',
        'List': 'List',
        'Quote': 'Quote',
        'Code': 'Code',
        'Image': 'Image',
        'Link': 'Link',
        'Marker': 'Highlight',
        'Bold': 'Bold',
        'Italic': 'Italic'
      }
    }
  }
});

// ✅ ADD: Helper function to validate editor data
export const validateEditorData = (data) => {
  if (!data || !data.blocks || !Array.isArray(data.blocks)) {
    return {
      isValid: false,
      error: 'Invalid editor data structure'
    };
  }

  if (data.blocks.length === 0) {
    return {
      isValid: false,
      error: 'Content cannot be empty'
    };
  }

  // ✅ ADD: Check for at least one non-empty block
  const hasContent = data.blocks.some(block => {
    if (block.type === 'paragraph' || block.type === 'header') {
      return block.data?.text?.trim().length > 0;
    }
    return true; // Other block types (image, embed, etc.) are considered content
  });

  if (!hasContent) {
    return {
      isValid: false,
      error: 'Content must have at least one paragraph or heading with text'
    };
  }

  return {
    isValid: true,
    error: null
  };
};

// ✅ ADD: Helper function to count words in editor content
export const countEditorWords = (data) => {
  if (!data || !data.blocks) return 0;

  return data.blocks.reduce((count, block) => {
    if (block.type === 'paragraph' || block.type === 'header' || block.type === 'quote') {
      const text = block.data?.text || '';
      // Strip HTML tags and count words
      const plainText = text.replace(/<[^>]*>/g, '');
      const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
      return count + words.length;
    }
    return count;
  }, 0);
};

// ✅ ADD: Helper function to estimate reading time
export const estimateReadingTime = (data) => {
  const wordCount = countEditorWords(data);
  const wordsPerMinute = 200; // Average reading speed
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, minutes); // Minimum 1 minute
};