import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/guards";
import { saveFoundImage } from "@/lib/storage";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  }

  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image" }, { status: 400 });
  }

  if (!Object.hasOwn(ALLOWED_TYPES, file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG and WebP images are supported" },
      { status: 415 },
    );
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "Image must be smaller than 5 MB" }, { status: 413 });
  }

  const extension = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES];
  const key = `found/${session.user.id}/${crypto.randomUUID()}.${extension}`;

  try {
    await saveFoundImage({
      key,
      body: new Uint8Array(await file.arrayBuffer()),
      contentType: file.type,
    });
    return NextResponse.json({ imageKey: key });
  } catch (error) {
    console.error("Found image upload failed", error);
    return NextResponse.json({ error: "Image storage is unavailable" }, { status: 503 });
  }
}
