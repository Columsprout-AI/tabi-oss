import { auth } from "@clerk/nextjs/server";

export const getAuthUser = async () => {
  const { userId } = await auth();
  return userId;
};
