import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

export interface Plant {
  _id?: ObjectId;
  title: string;
  category: string;
  price: number;
  image: string;
  description: string;
  careLevel: "Easy" | "Medium" | "Hard";
  stock: number;
  sellerEmail: string;
  sellerName: string;
  createdAt: Date;
}