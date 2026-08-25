import axios from "axios";
import imageCompression from "browser-image-compression";

/**
 * Uploads an image to cloud storage with compression and optimization
 * @param {File} img - The image file to upload
 * @param {Object} options - Optional configuration
 * @returns {Promise<string|null>} - Public URL of uploaded image or null on failure
 */
export const uploadImage = async (img, options = {}) => {
  // ✅ ADD: Validate input
  if (!img || !(img instanceof File)) {
    console.error("Invalid file provided to uploadImage");
    return null;
  }

  // ✅ ADD: Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(img.type)) {
    console.error("Invalid file type:", img.type);
    throw new Error('Invalid file type. Please upload JPEG, PNG, WebP, or GIF images.');
  }

  // ✅ ADD: Validate file size (10MB max before compression)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (img.size > maxSize) {
    console.error("File too large:", img.size);
    throw new Error('File is too large. Maximum size is 10MB.');
  }

  try {
    // ✅ IMPROVED: More aggressive compression options with override support
    const compressionOptions = {
      maxSizeMB: options.maxSizeMB || 0.5,
      maxWidthOrHeight: options.maxWidthOrHeight || 1920,
      useWebWorker: true,
      initialQuality: options.initialQuality || 0.8,
      fileType: img.type,  // ✅ ADD: Preserve original file type
      ...options  // ✅ ADD: Allow custom options override
    };

    let compressedImage = img;
    const compressionThreshold = 500 * 1024; // 500KB

    // ✅ IMPROVED: Always compress if over threshold, with progress logging
    if (img.size > compressionThreshold) {
      console.log(`Compressing image from ${(img.size / 1024).toFixed(2)}KB...`);
      compressedImage = await imageCompression(img, compressionOptions);
      console.log(`Compressed to ${(compressedImage.size / 1024).toFixed(2)}KB`);
    }

    // ✅ ADD: Check if server domain is configured
    if (!process.env.NEXT_PUBLIC_SERVER_DOMAIN) {
      throw new Error('Server domain not configured');
    }

    // ✅ IMPROVED: Get upload URL with timeout and error handling
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/get-upload-url`,
      {
        timeout: 10000,  // ✅ ADD: 10 second timeout
        params: {
          fileType: compressedImage.type,  // ✅ ADD: Send file type to backend
          fileSize: compressedImage.size   // ✅ ADD: Send file size for validation
        }
      }
    );

    // ✅ ADD: Validate response data
    if (!data || !data.uploadUrl || !data.fileName) {
      throw new Error('Invalid response from server: missing upload URL or filename');
    }

    const { uploadUrl, fileName } = data;

    // ✅ IMPROVED: Upload with proper content type and error handling
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: compressedImage,
      headers: { 
        "Content-Type": compressedImage.type,  // ✅ IMPROVED: Use actual file type
        "Content-Length": compressedImage.size.toString()  // ✅ ADD: Content length
      },
      // ✅ ADD: AbortController for timeout
      signal: AbortSignal.timeout(30000)  // 30 second timeout for upload
    });

    // ✅ IMPROVED: Better error handling
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => 'Unknown error');
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
    }

    // ✅ IMPROVED: Construct public URL with better error handling
    try {
      // 🔧 FIX: .trim() strips any stray leading/trailing whitespace that the
      // backend's /get-upload-url endpoint may embed in the signed URL/object
      // key (e.g. from an untrimmed original filename). This is a client-side
      // safety net — the real fix belongs in the /get-upload-url handler.
      const publicUrl = uploadUrl.split("?")[0].replace("/upload/sign/", "/public/").trim();
      
      // ✅ ADD: Validate URL format
      if (!publicUrl.startsWith('http')) {
        throw new Error('Invalid public URL generated');
      }

      console.log(`Image uploaded successfully: ${fileName}`);
      return publicUrl;
      
    } catch (urlError) {
      console.error("Error constructing public URL:", urlError);
      throw new Error('Failed to generate public URL for uploaded image');
    }

  } catch (err) {
    console.error("Image upload failed:", err);
    
    // ✅ IMPROVED: More specific error messages
    if (err.name === 'TimeoutError' || err.code === 'ECONNABORTED') {
      throw new Error('Upload timed out. Please check your connection and try again.');
    } else if (err.name === 'AbortError') {
      throw new Error('Upload was cancelled. Please try again.');
    } else if (err.response?.status === 413) {
      throw new Error('File is too large for server. Please use a smaller image.');
    } else if (err.response?.status === 401) {
      throw new Error('Unauthorized. Please log in and try again.');
    } else if (err.response?.status === 503) {
      throw new Error('Storage service unavailable. Please try again later.');
    } else if (err.message) {
      throw err;  // ✅ Re-throw known errors
    } else {
      throw new Error('Image upload failed. Please try again.');
    }
  }
};

// ✅ ADD: Helper function to validate image before upload
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!file || !(file instanceof File)) {
    return { valid: false, error: 'No file provided' };
  }

  if (!validTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Invalid file type. Please upload JPEG, PNG, WebP, or GIF images.' 
    };
  }

  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 10MB.` 
    };
  }

  if (file.size === 0) {
    return { 
      valid: false, 
      error: 'File is empty' 
    };
  }

  return { valid: true, error: null };
};

// ✅ ADD: Helper function to get image dimensions
export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
};

// ✅ ADD: Helper function to create image preview
export const createImagePreview = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      resolve(e.target.result);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

// ✅ ADD: Batch upload function for multiple images
export const uploadMultipleImages = async (files, options = {}) => {
  const validFiles = files.filter(file => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      console.warn(`Skipping invalid file: ${file.name} - ${validation.error}`);
      return false;
    }
    return true;
  });

  if (validFiles.length === 0) {
    throw new Error('No valid images to upload');
  }

  // ✅ ADD: Upload with concurrency limit
  const concurrencyLimit = options.concurrencyLimit || 3;
  const results = [];
  
  for (let i = 0; i < validFiles.length; i += concurrencyLimit) {
    const batch = validFiles.slice(i, i + concurrencyLimit);
    const batchResults = await Promise.allSettled(
      batch.map(file => uploadImage(file, options))
    );
    results.push(...batchResults);
  }

  // ✅ ADD: Separate successful and failed uploads
  const successful = results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);
  
  const failed = results
    .filter(r => r.status === 'rejected' || !r.value)
    .map((r, i) => ({
      file: validFiles[i].name,
      error: r.reason?.message || 'Upload failed'
    }));

  return {
    successful,
    failed,
    total: validFiles.length,
    successCount: successful.length,
    failureCount: failed.length
  };
};