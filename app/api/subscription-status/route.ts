import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { currentPeriodEnd: "desc" },
  });

  if (!subscription) {
    return NextResponse.json({ status: null });
  }

  return NextResponse.json({
    status: subscription.status,
    plan: subscription.plan,
    trialEndsAt: subscription.trialEndsAt,
    currentPeriodEnd: subscription.currentPeriodEnd,
  });
}
