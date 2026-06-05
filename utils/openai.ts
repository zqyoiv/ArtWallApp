// utils/openai.ts
// Room cleanup using OpenAI GPT-Image-1 inpainting

const OPENAI_API_URL = 'https://api.openai.com/v1/images/edits';

/** Landscape output size for gpt-image-1 (1536×1024, widescreen). */
const CLEANUP_IMAGE_SIZE = '1536x1024';

const CLEANUP_PROMPT = `Remove all clutter, loose objects, cables, boxes, and miscellaneous household items from this room.
Also remove every item on the walls: paintings, framed art, posters, prints, wall decor, mirrors, shelves with objects, and any other wall-mounted visuals.
Leave all wall surfaces completely blank and empty—plain painted or textured walls only, with no artwork or decorations remaining.
Preserve furniture, flooring, windows, doors, architectural elements, lighting, colors, shadows, and room perspective.
Do not redesign the room or change its layout.
The output must be a single widescreen 16:9 landscape photograph (horizontal, cinematic aspect ratio). Compose and crop the scene to fill a 16:9 frame edge-to-edge—no square, portrait, or letterboxed framing.
Return a clean, realistic version of the same space with bare walls ready for new artwork.`;

export async function cleanupRoomImage(
  imageBase64: string,
  apiKey: string
): Promise<string> {
  const dataUrlMatch = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
  const mimeType = dataUrlMatch?.[1] || 'image/png';
  const base64Data = dataUrlMatch?.[2] || imageBase64.split(',')[1] || imageBase64;

  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  const ext =
    mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/webp' ? 'webp' : 'png';

  const formData = new FormData();
  formData.append('image', blob, `room.${ext}`);
  formData.append('prompt', CLEANUP_PROMPT);
  formData.append('model', 'gpt-image-1');
  formData.append('n', '1');
  formData.append('size', CLEANUP_IMAGE_SIZE);
  // gpt-image-1 always returns base64; response_format is only for dall-e-2

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'AI cleanup failed');
  }

  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image returned from API');

  return `data:image/png;base64,${b64}`;
}

// Convert local file URI to base64
export async function uriToBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
