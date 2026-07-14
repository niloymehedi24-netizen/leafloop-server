import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI!;

const client = new MongoClient(uri); // Simplify this to avoid complex type errors

export default client;
