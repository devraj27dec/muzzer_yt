import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
//@ts-expect-error // because no module type
import youtubesearchapi from "youtube-search-api";
import { YT_REGEX } from "@/lib/utils";


const CreateStreamSchema = z.object({
  creatorId: z.string(),
  url: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const data = await CreateStreamSchema.parse(await req.json());

    console.log("user id", data.creatorId);

    const isYT = data.url.match(YT_REGEX);
    const videoId = data.url.match(YT_REGEX)?.[1];

    if (!isYT) {
      return NextResponse.json(
        { message: "Invalid Youtube Url format" },
        { status: 400 }
      );
    }

    const extractedId = data.url.split("?v=")[1];
    // console.log('extractedId' , extractedId);

    const res = await youtubesearchapi.GetVideoDetails(videoId);
    console.log(res.title);
    console.log(res.thumbnail.thumbnails);
    const thumbnails = res.thumbnail.thumbnails;
    thumbnails.sort((a: { width: number }, b: { width: number }) =>
      a.width < b.width ? -1 : 1
    );

    const userExists = await prisma.user.findUnique({
      where: { id: data.creatorId },
    });

    if (!userExists) {
      console.log("user id", data.creatorId);

      return NextResponse.json(
        { message: "User does not exist" },
        { status: 404 }
      );
    }

    const stream = await prisma.stream.create({
      data: {
        userId: data.creatorId,
        url: data.url,
        extractedId,
        type: "Youtube",
        title: res.title ?? "Can not find Video",
        smallImg:
        (thumbnails.length > 1
            ? thumbnails[thumbnails.length - 2].url
            : thumbnails[thumbnails.length - 1].url) ??
          "https://cdn.pixabay.com/photo/2024/02/28/07/42/european-shorthair-8601492_640.jpg",
        bigImg: thumbnails[thumbnails.length - 1].url ?? "https://cdn.pixabay.com/photo/2024/02/28/07/42/european-shorthair-8601492_640.jpg",
      },
    });

    console.log("Created Stream", stream);

    return NextResponse.json({
      ...stream,
      hasUpvoted: false,
      upvotes:0
      
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Error while adding a stream" },
      { status: 500 }
    );
  }
}




export async function GET(req: NextRequest) {
  const creatorid = req.nextUrl.searchParams.get("creatorid");


  if(!creatorid) {
    return NextResponse.json({message: "Creator Not Exist" }, {status:403})
  }
  const stream = await prisma.stream.findMany({
    where: {
      userId: creatorid ?? "",
    },
  });

  return NextResponse.json(stream);
}