'use server';
import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

/**
 * Uploads a file buffer to Cloudinary.
 * This is a server-side function.
 * @param base64String The base64 encoded string of the file to upload.
 * @param options Cloudinary upload options.
 * @returns A promise that resolves with the upload API response.
 */
export async function uploadToCloudinary(base64String: string, options: UploadApiOptions): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) {
                return reject(error);
            }
            if (result) {
                resolve(result);
            } else {
                reject(new Error("Cloudinary upload failed without an error message."));
            }
        });

        // The input is a base64 string, so we prefix it appropriately for the stream
        uploadStream.end(`data:image/png;base64,${base64String}`);
    });
}


/**
 * Deletes a resource from Cloudinary using its public ID.
 * This is a server-side function.
 * @param publicId The public ID of the resource to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export async function deleteFromCloudinary(publicId: string): Promise<any> {
    return cloudinary.uploader.destroy(publicId);
}
