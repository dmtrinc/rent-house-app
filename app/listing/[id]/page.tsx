import { notFound, permanentRedirect } from "next/navigation";
import { getListingById } from "../../../lib/listings";
import { listingPath } from "../../../lib/slug";

/* Route cũ /listing/<id> — GIỮ VĨNH VIỄN vì link đã chia sẻ trên Zalo/Facebook.
 * Chỉ làm 1 việc: 308 sang URL thân thiện /phong-tro/<slug>-<id>. */
export const revalidate = 60;

export default async function LegacyListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();
  permanentRedirect(listingPath(listing));
}
