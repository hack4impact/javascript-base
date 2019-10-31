const users = {
  0: {
    firstName: "Jared",
    lastName: "Asch",
    email: "jasch16",
    password: "passw0rd"
  },
  1: {
    firstName: "Steph",
    lastName: "Shi",
    email: "stephshi",
    password: "123456"
  }
};

import { User } from "../../models";
import { UserInputError } from "apollo-server";
import bcrypt from "bcrypt";
import { comparePassword } from "./model";
import jwt from "jsonwebtoken";
import path from "path";
import { config } from "dotenv";

config({ path: path.resolve(__dirname, "../../../.env") });
const resolvers = {
  Query: {
    allUsers: parent => {
      return User.find({});
    },
    user: (parent, { id }) => {
      return User.findById(id);
    },
    login: async (parent, { email, password }) => {
      const u = await User.findOne({ email: email });
      if (u == null) {
        throw new UserInputError("Username or Password is incorrect");
      } else {
        const valid = await comparePassword(u, password);
        if (valid) {
          const payload = {
            user: {
              id: u.id,
              role: u.role
            }
          };

          return jwt.sign(
            payload,
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1d" },
            { algorithm: "HS256" }
          );
        } else {
          throw new UserInputError("Username or Password is incorrect");
        }
      }
    }
  },
  Mutation: {
    createUser: async (
      parent,
      { firstName, lastName, email, password, role },
      context
    ) => {
      const count = await User.countDocuments({ email: email });
      if (count != 0) {
        throw new UserInputError("Account already exists");
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new User({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: hashedPassword,
        role: role
      });
      newUser.save();

      const payload = {
        user: {
          id: newUser.id,
          role: newUser.role
        }
      };

      return jwt.sign(
        payload,
        process.env.JWT_SECRET_KEY,
        { expiresIn: "1d" },
        { algorithm: "HS256" }
      );
    }
  }
};

export default resolvers;
