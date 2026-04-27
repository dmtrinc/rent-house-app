import mongoose from "mongoose";

const ListingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  availableDate: { type: Date, required: true },
  hasWindow: { type: Boolean, default: false },
  hasBalcony: { type: Boolean, default: false },
  images: [String],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.models.Listing || mongoose.model("Listing", ListingSchema);