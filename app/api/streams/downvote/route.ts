import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/db";

const DownvoteSchema = z.object({
    streamId : z.string(),
})
export async function POST(req: NextRequest) {
    
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
        return NextResponse.json(
          {
            message: "Unauthenticated",
          },
          {
            status: 403,
          },
        );
    }
    const user = session.user;

    try {
        const data = DownvoteSchema.parse(await req.json())
    
        await prisma.upvote.delete({
            where: {
                userId_streamId: {
                    userId : user.id,
                    streamId: data.streamId
                }
            }
        })
    
        return NextResponse.json({
            message: "Done!"
        })
    } catch (error) {
        console.log(error)
        return NextResponse.json({message: "Error while upvoting"} , {status:403})
    }

}