import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || "us-east-1",
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "minio",
    secretAccessKey: process.env.S3_SECRET_KEY || "minio12345",
  },
});

export async function getPresignedViewUrl(key: string | null | undefined): Promise<string | null> {
  if (!key) return null;
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET || "roronoa",
      Key: key,
    });
    return await getSignedUrl(s3, command, { expiresIn: 900 });
  } catch (error) {
    console.error("Failed to generate presigned view URL", error);
    return null;
  }
}
