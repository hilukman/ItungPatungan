// Helper to resize and compress image to avoid XHR payload limits
export const resizeImage = (base64Str: string, maxWidth = 1024): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

// Enhances image contrast and converts to grayscale to improve OCR accuracy
export const enhanceImageForOCR = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw original
      ctx.drawImage(img, 0, 0);
      
      // Get pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Contrast factor (Range: -255 to 255). 40-50 is usually good for text.
      const contrast = 50; 
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale first using luminance formula
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        
        // Apply contrast
        const newValue = factor * (gray - 128) + 128;
        
        // Clamp values 0-255
        const final = Math.max(0, Math.min(255, newValue));

        data[i] = final;     // Red
        data[i + 1] = final; // Green
        data[i + 2] = final; // Blue
        // Alpha (data[i+3]) remains unchanged
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};