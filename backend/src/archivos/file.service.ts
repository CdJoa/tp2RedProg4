import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';


@Injectable()
export class FileService {

  constructor(config: ConfigService) {
    cloudinary.config({
      cloud_name: config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: config.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: config.getOrThrow<string>('CLOUDINARY_API_SECRET'),
    });
  }

  // carpeta: dónde se guarda en Cloudinary ('usuarios' o 'publicaciones')
  cloudinaryUploader(
    file: Express.Multer.File,
    carpeta = 'usuarios',
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: carpeta,
          // Sin public_id: Cloudinary genera un nombre único, así dos
          // archivos con el mismo nombre no se pisan.
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            reject(new Error('No se pudo subir la foto a Cloudinary'));
          } else if (!result?.secure_url) {
            reject(new Error('Cloudinary no devolvió la URL de la foto'));
          } else {
            resolve(result.secure_url);
          }
        },
      );

      stream.on('error', () => {
        reject(new Error('No se pudo enviar la foto a Cloudinary'));
      });

      stream.end(file.buffer);
    });
  }
}
