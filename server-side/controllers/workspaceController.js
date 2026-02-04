import prisma from "../configs/prisma.js";

//* Get all workspaces of a user
export const getUserWorkspaces = async (req, res) => {
  try {
    const { userId } = await req.auth;
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        members: { include: { user: true } },
        projects: {
          include: {
            tasks: {
              include: {
                assignee: true,
                comments: { include: { user: true } },
              },
            },
            members: { include: { user: true } },
          },
        },
        owner: true,
      },
    });
    res.status(200).json({ workspaces });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message || error.code });
  }
};

//* Add member to workspace
export const addMember = async (req, res) => {
  try {
    const { userId } = await req.auth;
    const { email, role, workspaceId, message } = req.body;

    //* Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!workspaceId || !role) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    if (!["ADMIN", "MEMBER"].includes(role.toUpperCase())) {
      return res.status(400).json({ message: "Invalid role" });
    }

    //* Fetch workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      return res.status(400).json({ message: "Workspace not found" });
    }

    //* Check if creator is admin of workspace
    if (
      !workspace.members.find((member) => {
        member.userId === userId && member.role === "ADMIN";
      })
    ) {
      return res
        .status(401)
        .json({ message: "You do not have admin privileges" });
    }

    //* Check if user is already a member
    const existingMember = workspace.members.find((member) => {
      member.userId === userId;
    });

    if (existingMember) {
      return res.status(400).json({ message: "User is already a member" });
    }

    const member = await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId,
        role,
        message,
      },
    });
    res.json({ member, message: "Member added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message || error.code });
  }
};
