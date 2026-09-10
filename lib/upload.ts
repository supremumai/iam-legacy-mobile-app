import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

export type UploadCategory = 'avatar' | 'cover' | 'posts';

type UploadResult =
  | { url: string }
  | { error: string }
  | { cancelled: true };

/**
 * Converts a base64 string to an ArrayBuffer.
 * Used instead of fetch().blob() because React Native's fetch polyfill
 * cannot read Android content:// URIs (throws "Network request failed").
 * expo-file-system.readAsStringAsync reliably reads any local URI on both
 * iOS and Android.
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function pickAndUploadImage(
  userId: string,
  category: UploadCategory,
  options?: { aspect?: [number, number] },
): Promise<UploadResult> {
  // 1. Request media library permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    return {
      error:
        'Photo library access is required. Enable it in your device settings.',
    };
  }

  // 2. Launch image library picker
  const pickerResult = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: options?.aspect ?? [1, 1],
    quality: 0.7,
  });

  if (pickerResult.canceled) {
    return { cancelled: true };
  }

  const asset = pickerResult.assets[0];

  try {
    // 3. Read file as base64 via expo-file-system.
    //    This works reliably for both file:// (iOS) and content:// (Android)
    //    URIs, unlike fetch().blob() which fails on Android content:// URIs.
    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const arrayBuffer = base64ToArrayBuffer(base64);

    // Derive file extension from mimeType or uri
    let ext = 'jpg';
    if (asset.mimeType) {
      const parts = asset.mimeType.split('/');
      if (parts[1]) ext = parts[1].replace('jpeg', 'jpg');
    } else {
      const uriParts = asset.uri.split('.');
      const last = uriParts[uriParts.length - 1];
      if (last && last.length <= 5) ext = last.toLowerCase();
    }

    // 4. Build storage path: {userId}/{category}/{timestamp}.{ext}
    const path = `${userId}/${category}/${Date.now()}.${ext}`;

    // 5. Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(path, arrayBuffer, {
        contentType: asset.mimeType ?? 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    // 6. Get public URL and return it
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    return { url: data.publicUrl };
  } catch {
    return { error: 'Could not upload image. Please try again.' };
  }
}
