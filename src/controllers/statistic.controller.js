import * as StatisticService from "../services/statistic.service.js";
import { successResponse, errorResponse } from "../utils/response.util.js";

export async function getVoteStats(c) {
  try {
    const position_id = parseInt(c.req.param("position_id"));
    const not_votes = c.req.query("not_votes") === "true";

    if (isNaN(position_id)) {
      return errorResponse("Invalid position_id", 400);
    }

    const result = await StatisticService.getVoteStatistics(
      position_id,
      not_votes
    );
    return successResponse(result);
  } catch (error) {
    console.error("Error in getVoteStats:", error);
    return errorResponse(error.message, 400);
  }
}
