import { v2 as cloudinary } from "cloudinary";
import { route, origin, fail, limit } from "@/lib/http";
import { requireUser } from "@/lib/access";
export const POST = route(async (req) => {
  origin(req);
  const user = await requireUser(true);
  await limit(`upload:${user.id}`, 20);
  if (!process.env.CLOUDINARY_API_SECRET)
    fail(503, "Cloudinary is not configured");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  if (Number(req.headers.get("content-length") || 0) > 4500000)
    fail(413, "Maximum image size is 4 MB");
  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file.arrayBuffer !== "function" || file.size > 4000000)
    fail(400, "Choose an image smaller than 4 MB");
  const data = Buffer.from(await file.arrayBuffer());
  const png = data
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpg = data[0] === 255 && data[1] === 216 && data[2] === 255;
  const webp =
    data.toString("ascii", 0, 4) === "RIFF" &&
    data.toString("ascii", 8, 12) === "WEBP";
  if (!png && !jpg && !webp)
    fail(400, "Only JPEG, PNG and WebP images are accepted");
  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "volt",
          resource_type: "image",
          format: "webp",
          transformation: [{ width: 1600, height: 1600, crop: "limit" }],
        },
        (err, res) => (err ? reject(err) : resolve(res)),
      )
      .end(data);
  });
  return { url: result.secure_url };
});
