import { CreateBucketCommand, S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

try {
  await s3.send(new CreateBucketCommand({ Bucket: process.env.S3_BUCKET! }));
  console.log(`bucket created: ${process.env.S3_BUCKET}`);
} catch (e) {
  if (["BucketAlreadyOwnedByYou", "BucketAlreadyExists"].includes((e as Error).name))
    console.log(`bucket exists: ${process.env.S3_BUCKET}`);
  else throw e;
}
