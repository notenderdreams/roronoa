import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.S3_ENDPOINT;
const bucket = process.env.S3_BUCKET;

export const s3 = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: endpoint || undefined,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
});

export function getBucketName() {
  if (!bucket) throw new Error("S3_BUCKET is not configured");
  return bucket;
}

export async function saveFoundImage(input: {
  key: string;
  body: Uint8Array;
  contentType: string;
}) {
  await s3.send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: "private, no-store",
    }),
  );
}

export async function assertFoundImageExists(key: string) {
  await s3.send(new HeadObjectCommand({ Bucket: getBucketName(), Key: key }));
}

export async function getFoundImageUrl(key: string) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: getBucketName(), Key: key }), {
    expiresIn: 300,
  });
}
