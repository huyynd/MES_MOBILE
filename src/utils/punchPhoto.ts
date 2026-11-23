import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

export type PunchPhoto = { uri: string; width: number; height: number };

const MAX_W = 640;

/**
 * Ảnh chấm công gửi máy chủ (tối đa 300 KB, JPEG). Thu về rộng 640px, nén 0.6 (~40–80 KB).
 * - Phải truyền CẢ chiều cao (tính theo tỉ lệ): trên web, resize({ height: null }) làm canvas cao 0
 *   → lỗi "createImageData: The source height is zero".
 * - Trên web (chạy thử trên máy tính) ảnh webcam đã nhỏ và đã nén khi chụp → gửi luôn, không qua canvas.
 */
export async function shrinkPunchPhoto(shot: { uri: string; width?: number; height?: number }): Promise<PunchPhoto> {
  const w = Number(shot.width) || 0;
  const h = Number(shot.height) || 0;
  if (Platform.OS === 'web') return shrinkOnWeb(shot.uri);
  if (!w || !h || w <= MAX_W) return { uri: shot.uri, width: w, height: h };
  const ctx = ImageManipulator.ImageManipulator.manipulate(shot.uri);
  ctx.resize({ width: MAX_W, height: Math.round((MAX_W * h) / w) });
  const ref = await ctx.renderAsync();
  const img = await ref.saveAsync({ compress: 0.6, format: ImageManipulator.SaveFormat.JPEG });
  return { uri: img.uri, width: img.width, height: img.height };
}

/** Web: vẽ lại ảnh webcam lên canvas rộng tối đa 640px (kích thước tính từ ảnh thật), xuất JPEG 0.6. */
function shrinkOnWeb(uri: string): Promise<PunchPhoto> {
  return new Promise((resolve, reject) => {
    const img = new (globalThis as any).Image();
    img.onload = () => {
      const w0 = img.naturalWidth || img.width; const h0 = img.naturalHeight || img.height;
      if (!w0 || !h0) { reject(new Error('Ảnh chụp trống — kiểm tra webcam rồi chụp lại')); return; }
      const w = Math.min(MAX_W, w0); const h = Math.round((w * h0) / w0);
      const canvas = (globalThis as any).document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve({ uri: canvas.toDataURL('image/jpeg', 0.6), width: w, height: h });
    };
    img.onerror = () => reject(new Error('Không đọc được ảnh vừa chụp'));
    img.src = uri;
  });
}
