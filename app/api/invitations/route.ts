import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

// Create a new invitation
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id as string;
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if the user is trying to invite themselves
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (currentUser?.email === email) {
      return NextResponse.json({ error: 'You cannot invite yourself' }, { status: 400 });
    }

    // Check if an invitation already exists for this email from this sender
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        senderId: userId,
        status: 'pending'
      }
    });

    if (existingInvitation) {
      return NextResponse.json({ error: 'An invitation has already been sent to this email' }, { status: 400 });
    }

    // Create the invitation
    const invitation = await prisma.invitation.create({
      data: {
        email,
        senderId: userId,
        status: 'pending',
        // If the recipient already exists in the system, link them
        recipient: {
          connect: {
            email,
          },
        },
      },
    });

    return NextResponse.json(invitation);
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json({ error: 'Error creating invitation' }, { status: 500 });
  }
}

// Get all invitations for the current user (both sent and received)
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id as string;
    const type = request.nextUrl.searchParams.get('type') || 'all';

    let invitations;
    if (type === 'sent') {
      // Get invitations sent by the user
      invitations = await prisma.invitation.findMany({
        where: { senderId: userId },
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (type === 'received') {
      // Get invitations received by the user
      invitations = await prisma.invitation.findMany({
        where: {
          OR: [
            { recipientId: userId },
            { email: session.user.email as string, recipientId: null },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Get all invitations (both sent and received)
      invitations = await prisma.invitation.findMany({
        where: {
          OR: [
            { senderId: userId },
            { recipientId: userId },
            { email: session.user.email as string, recipientId: null },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ error: 'Error fetching invitations' }, { status: 500 });
  }
}