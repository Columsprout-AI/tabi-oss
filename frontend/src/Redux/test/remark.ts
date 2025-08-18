import { RecordUserRemarkResponse } from "../Remark/types";

export const recordUserRemarkAPI = async ({
  sessionId,
  userRemark,
}: {
  sessionId: string;
  userRemark: "like" | "dislike";
}) => {
  console.log("📢 Mock API: Recording User Remark...", {
    sessionId,
    userRemark,
  });

  return new Promise<RecordUserRemarkResponse>((resolve) =>
    setTimeout(() => {
      console.log("✅ Mock API: User Remark Recorded!");
      resolve({
        message: `User remark '${userRemark}' recorded successfully.`,
        userRemarkValue: 2,
      });
    }, 800)
  );
};
