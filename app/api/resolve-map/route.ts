import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "No URL" }, { status: 400 });

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const finalUrl = res.url;

    // Pattern 1: @lat,lng trong URL
    const coordMatch1 = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch1) {
      const lat = coordMatch1[1];
      const lng = coordMatch1[2];
      const embedUrl = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d2000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1svi!2svn!4v1`;
      return NextResponse.json({ embedUrl, finalUrl });
    }

    // Pattern 2: /search/lat,+lng (nhÆ° káº¿t quáº£ trÃªn)
    const coordMatch2 = finalUrl.match(/\/search\/(-?\d+\.\d+),\+?(-?\d+\.\d+)/);
    if (coordMatch2) {
      const lat = coordMatch2[1];
      const lng = coordMatch2[2];
      const embedUrl = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d2000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1svi!2svn!4v1`;
      return NextResponse.json({ embedUrl, finalUrl });
    }

    // Pattern 3: query param q=lat,lng
    const qMatch = finalUrl.match(/[?&]q=(-?\d+\.\d+)[,+]+(-?\d+\.\d+)/);
    if (qMatch) {
      const lat = qMatch[1];
      const lng = qMatch[2];
      const embedUrl = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d2000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1svi!2svn!4v1`;
      return NextResponse.json({ embedUrl, finalUrl });
    }

    // Pattern 4: place name
    const placeMatch = finalUrl.match(/place\/([^/@?]+)/);
    if (placeMatch) {
      const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
      const embedUrl = `https://www.google.com/maps/embed/v1/place?q=${encodeURIComponent(placeName)}&zoom=17`;
      return NextResponse.json({ embedUrl, finalUrl });
    }

    return NextResponse.json({ embedUrl: null, finalUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
