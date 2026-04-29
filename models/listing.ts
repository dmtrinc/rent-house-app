import mongoose, { Schema, models } from "mongoose";

const listingSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Vui long nhap tieu de tin dang"],
      trim: true
    },
    address: {
      type: String,
      required: [true, "Vui long nhap dia chi"],
      trim: true
    },
    price: {
      type: Number,
      required: [true, "Vui long nhap gia cho thue"],
      default: 0
    },
    description: {
      type: String,
      default: ""
    },
    coverImage: {
      type: String,
      default: ""
    },
    images: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ["active", "hide"],
      default: "active"
    },
    category: {
      type: String,
      default: "Phong tro"
    },
    amenities: {
      type: [String],
      default: []
    },
    contactPhone: {
      type: String,
      default: ""
    },
    deviceId: {
      type: String,
      default: null
    },
    userId: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Listing = models.Listing || mongoose.model("Listing", listingSchema);

export default Listing;
