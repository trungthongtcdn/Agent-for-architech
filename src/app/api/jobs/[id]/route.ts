import { publicUser } from "@/lib/auth";
import { handle, HttpError, ok, requireUser } from "@/lib/http";
import { getJobForUser, jobView } from "@/lib/jobs";

export const GET = handle<RouteContext<"/api/jobs/[id]">>(async (req, ctx) => {
  const user = requireUser(req);
  const { id } = await ctx.params;
  const row = getJobForUser(id, user);
  if (!row) throw new HttpError(404, "Không tìm thấy tác vụ");
  // Trả kèm số dư để client cập nhật sau khi job xong / được hoàn credit.
  return ok({ job: jobView(row), credits: publicUser(user).credits });
});
