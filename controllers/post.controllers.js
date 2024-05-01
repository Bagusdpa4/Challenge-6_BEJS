const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");
const imageKit = require("../libs/imagekit");

module.exports = {
  create: async (req, res, next) => {
    try {
      const { title, description } = req.body;

      if (!req.file || !title || !description) {
        return res.status(400).json({
          status: false,
          message: "Input must be required",
          data: null,
        });
      }

      let exist = await prisma.image.findFirst({
        where: { title },
      });

      if (exist) {
        return res.status(401).json({
          status: false,
          message: "Title has been used!",
          data: null,
        });
      }

      let strFile = req.file.buffer.toString("base64");

      let { url, fileId } = await imageKit.upload({
        fileName: Date.now() + path.extname(req.file.originalname),
        file: strFile,
        folder: "/challenge6/images",
      });

      const postImage = await prisma.image.create({
        data: {
          title,
          description,
          image_url: url,
          user_id: req.user.id,
          image_id: fileId,
        },
      });

      return res.status(201).json({
        status: true,
        message: "Upload Image Successfully",
        data: { postImage },
      });
    } catch (error) {
      next(error);
    }
  },

  index: async (req, res, next) => {
    try {
      const { search } = req.query;

      const Image = await prisma.image.findMany({
        where: { title: { contains: search, mode: "insensitive" } },
      });

      Image.forEach((image) => {
        delete image.image_id;
        delete image.user_id;
      });

      res.status(200).json({
        status: true,
        message: "success",
        data: Image,
      });
    } catch (error) {
      next(error);
    }
  },

  show: async (req, res, next) => {
    const id = Number(req.params.id);
    try {
      const Image = await prisma.image.findUnique({
        where: { id },
      });

      if (!Image) {
        return res.status(404).json({
          status: false,
          message: `Image with id ${id} not found`,
          data: null,
        });
      }
      res.status(200).json({
        status: true,
        message: "success",
        data: Image,
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    const id = Number(req.params.id);
    try {
      const { title, description } = req.body;

      if (!title && !description) {
        return res.status(400).json({
          status: false,
          message: "At least one data must be provided for update",
          data: null,
        });
      }

      const exist = await prisma.image.findUnique({
        where: { id },
      });

      if (!exist) {
        return res.status(404).json({
          status: false,
          message: `Image with id ${id} not found`,
          data: null,
        });
      }

      const Image = await prisma.image.update({
        where: { id },
        data: {
          title,
          description,
        },
      });

      res.status(200).json({
        status: true,
        message: "Image updated successfully",
        data: Image,
      });
    } catch (error) {
      next(error);
    }
  },

  destroy: async (req, res, next) => {
    const id = Number(req.params.id);
    try {
      const exist = await prisma.image.findUnique({
        where: { id },
      });

      if (!exist) {
        return res.status(404).json({
          status: false,
          message: `Image with id ${id} not found`,
          data: null,
        });
      }

      imageKit.deleteFile(exist.image_id, async (error, result) => {
        if (error) {
          console.log(error, "ini error");
          return res.status(500).json({
            status: false,
            message: "Failed to delete image from ImageKit",
          });
        } else {
          console.log(result, "ini result");

          await prisma.image.delete({
            where: { id },
          });
          return res.status(200).json({
            status: true,
            message: "Image deleted successfully",
          });
        }
      });
    } catch (error) {
      next(error);
    }
  },
};
