/**
 * 이미지 처리 유틸리티 함수들
 * S3 이미지 URL 변환 및 프로젝트/경매 이미지 URL 추출
 */

// S3 이미지 베이스 URL (cloud.aws.s3.bucket=ddip-image, region=ap-northeast-2 기준)
export const S3_IMAGE_BASE_URL =
  process.env.NEXT_PUBLIC_S3_IMAGE_BASE_URL ||
  'https://ddip-image.s3.ap-northeast-2.amazonaws.com';

/**
 * S3 키 또는 이미 전체 URL인 값을 브라우저에서 접근 가능한 URL로 변환
 * @param keyOrUrl - S3 키 또는 전체 URL
 * @returns 변환된 전체 URL 또는 null
 */
export function toS3ImageUrl(keyOrUrl: string | null | undefined): string | null {
  if (!keyOrUrl || typeof keyOrUrl !== 'string') return null;
  const trimmed = keyOrUrl.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const base = S3_IMAGE_BASE_URL.endsWith('/') ? S3_IMAGE_BASE_URL : S3_IMAGE_BASE_URL + '/';
  return base + (trimmed.startsWith('/') ? trimmed.slice(1) : trimmed);
}

/**
 * 백엔드 프로젝트 응답에서 이미지 URL 배열 추출
 * - imageUrls / image_urls (배열)
 * - imageKeys / image_keys (S3 키 배열)
 * - images (객체 배열: s3Key, imageKey, url 등)
 * - imageUrl / thumbnailUrl 단일 값 fallback
 * @param backendProject - 백엔드에서 받은 프로젝트 데이터
 * @returns 첫 번째 이미지 URL과 전체 이미지 URL 배열
 */
export function getProjectImageUrls(backendProject: any): { imageUrl: string | null; imageUrls: string[] | null } {
  const thumbnailUrl = backendProject.thumbnailUrl ?? backendProject.thumbnail_url ?? null;
  const singleUrl = backendProject.imageUrl ?? thumbnailUrl ?? null;
  const imageUrl = toS3ImageUrl(singleUrl) ?? toS3ImageUrl(thumbnailUrl);

  // 배열 형태: imageUrls, image_urls
  let rawArray = backendProject.imageUrls ?? backendProject.image_urls ?? null;
  if (Array.isArray(rawArray) && rawArray.length > 0) {
    const urls = rawArray.map((u: string) => toS3ImageUrl(u)).filter((u): u is string => u != null);
    if (urls.length > 0) {
      return { imageUrl: urls[0], imageUrls: urls };
    }
  }

  // S3 키 배열: imageKeys, image_keys
  rawArray = backendProject.imageKeys ?? backendProject.image_keys ?? null;
  if (Array.isArray(rawArray) && rawArray.length > 0) {
    const urls = rawArray.map((k: string) => toS3ImageUrl(k)).filter((u): u is string => u != null);
    if (urls.length > 0) {
      return { imageUrl: urls[0], imageUrls: urls };
    }
  }

  // 객체 배열: images (경매처럼)
  const images = backendProject.images ?? backendProject.projectImages ?? null;
  if (Array.isArray(images) && images.length > 0) {
    const urls = images
      .map((img: any) => toS3ImageUrl(img.s3Key ?? img.imageKey ?? img.url ?? img.imageUrl ?? img.image_url))
      .filter((u): u is string => u != null);
    if (urls.length > 0) {
      return { imageUrl: urls[0], imageUrls: urls };
    }
  }

  if (imageUrl) {
    return { imageUrl, imageUrls: [imageUrl] };
  }
  return { imageUrl: null, imageUrls: null };
}
