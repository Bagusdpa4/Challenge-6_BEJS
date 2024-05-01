const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const imageKit = require("../libs/imagekit");
const path = require("path");
const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = process.env;

module.exports = {
  register: async (req, res, next) => {
    try {
      const { first_name, last_name, email, password } = req.body;

      const exist = await prisma.user.findUnique({
        where: { email },
      });

      if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({
          status: false,
          message: "Input must be required",
          data: null,
        });
      } else if (exist) {
        return res.status(401).json({
          status: false,
          message: "Email already used!",
        });
      }

      let encryptedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          first_name,
          last_name,
          email,
          password: encryptedPassword,
        },
      });
      delete user.password;

      res.status(201).json({
        status: true,
        message: "User Created Successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      let { email, password } = req.body;
      let user = await prisma.user.findFirst({ where: { email } });
      if (!user) {
        return res.status(400).json({
          status: false,
          message: "invalid email or password",
          data: null,
        });
      }

      let isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({
          status: false,
          message: "invalid email or password",
          data: null,
        });
      }

      delete user.password;
      let token = jwt.sign(user, JWT_SECRET_KEY);

      return res.status(201).json({
        status: true,
        message: "success",
        data: { ...user, token },
      });
    } catch (error) {
      next(error);
    }
  },

  auth: async (req, res, next) => {
    try {
      return res.status(200).json({
        status: true,
        message: "OK",
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  },

  index: async (req, res, next) => {
    try {
      const { search } = req.query;

      const users = await prisma.user.findMany({
        where: { first_name: { contains: search, mode: "insensitive" } },
      });
      users.forEach((user) => {
        delete user.password;
        delete user.address;
        delete user.occupation;
        delete user.avatar_url;
      });
      res.status(200).json({
        status: true,
        message: "success",
        data: users,
      });
    } catch (error) {
      next(error);
    }
  },

  show: async (req, res, next) => {
    const id = Number(req.params.id);
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return res.status(404).json({
          status: false,
          message: `User with id ${id} not found`,
          data: null,
        });
      }
      delete user.password;
      res.status(200).json({
        status: true,
        message: "success",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    const id = Number(req.params.id);
    try {
      const { first_name, last_name, email, address, occupation } = req.body;

      if (!first_name && !last_name && !email && !address && !occupation) {
        return res.status(400).json({
          status: false,
          message: "At least one data must be provided for update",
          data: null,
        });
      }

      const exist = await prisma.user.findUnique({
        where: { id },
      });

      if (!exist) {
        return res.status(404).json({
          status: false,
          message: `User with id ${id} not found`,
          data: null,
        });
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          first_name,
          last_name,
          email,
          address,
          occupation,
        },
      });
      delete user.password;
      res.status(200).json({
        status: true,
        message: "User updated successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  avatar: async (req, res, next) => {
    const id = Number(req.params.id);
    try {
      if (!req.file) {
        return res.status(400).json({
          status: false,
          message: "Avatar image must be provided",
          data: null,
        });
      }

      if (!user) {
        return res.status(404).json({
          status: false,
          message: `User with id ${id} not found`,
          data: null,
        });
      }

      let strFile = req.file.buffer.toString("base64");

      let { url } = await imageKit.upload({
        fileName: Date.now() + path.extname(req.file.originalname),
        file: strFile,
        folder: "/challenge6/avatar",
      });

      const user = await prisma.user.findUnique({
        where: { id },
      });

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { avatar_url: url },
      });

      delete updatedUser.password;
      res.status(200).json({
        status: true,
        message: "Avatar updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  },

  destroy: async (req, res, next) => {
    const id = Number(req.params.id);
    try {
      const exist = await prisma.user.findUnique({
        where: { id },
        include: { image: true }, // Include related images
      });
  
      if (!exist) {
        return res.status(404).json({
          status: false,
          message: `User with id ${id} not found`,
          data: null,
        });
      }
  
      // Delete images from ImageKit
      for (const image of exist.image) {
        try {
          if (image.image_id) {
            await imageKit.deleteFile(image.image_id);
          } else {
            console.log("Image ID is missing for image:", image.id);
          }
        } catch (error) {
          console.error("Failed to delete image from ImageKit:", error.message);
        }
      }
  
      // Delete images from Prisma
      await prisma.image.deleteMany({
        where: { user_id: id },
      });
  
      // Delete user from Prisma
      await prisma.user.delete({
        where: { id },
      });
  
      res.status(200).json({
        status: true,
        message: "User and associated images deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
  
};
