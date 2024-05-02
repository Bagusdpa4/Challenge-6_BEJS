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
      delete user.avatar_id;

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

      delete user.address;
      delete user.occupation;
      delete user.avatar_url;
      delete user.avatar_id;
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
      const user = req.user;
      delete user.avatar_id;

      return res.status(200).json({
        status: true,
        message: "Success",
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
        delete user.avatar_id;
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
      delete user.avatar_id;
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
      const { first_name, last_name, address, occupation } = req.body;

      if (!first_name && !last_name && !address && !occupation) {
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
          address,
          occupation,
        },
      });
      delete user.password;
      delete user.avatar_id;
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

      if (!req.file) {
        return res.status(401).json({
          status: false,
          message: "Avatar image must be provided",
          data: null,
        });
      }

      let strFile = req.file.buffer.toString("base64");

      let { url, fileId } = await imageKit.upload({
        fileName: Date.now() + path.extname(req.file.originalname),
        file: strFile,
        folder: "/challenge6/avatar",
      });

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { avatar_url: url, avatar_id: fileId },
      });

      delete updatedUser.password;
      delete updatedUser.avatar_id;
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
        include: { image: true },
      });
  
      if (!exist) {
        return res.status(404).json({
          status: false,
          message: `User with id ${id} not found`,
          data: null,
        });
      }
  
      if (exist.avatar_id) {
        imageKit.deleteFile(exist.avatar_id, async (error, result) => {
          if (error) {
            console.log(error, "ini error");
            return res.status(500).json({
              status: false,
              message: "Failed to delete avatar from ImageKit",
            });
          }
          console.log(result, "ini result");
        });
      }
  
      for (const image of exist.image) {
        try {
          if (image.image_id) {
            await imageKit.deleteFile(image.image_id);
          } else {
            console.log("Image ID is missing for image:", image.id);
          }
        } catch (error) {
          console.error(
            "Failed to delete image from ImageKit:",
            error.message
          );
        }
      }
  
      await prisma.image.deleteMany({
        where: { user_id: id },
      });
  
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
