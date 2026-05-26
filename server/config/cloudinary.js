import { v2 as cloudinary } from 'cloudinary';

// Check if Cloudinary credentials are fully configured in the environment
const isConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("Cloudinary CDN driver initialized successfully.");
} else {
  console.log("Cloudinary environment keys are not configured. Falling back to local disk storage driver.");
}

export { cloudinary, isConfigured };
