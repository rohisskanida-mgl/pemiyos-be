import { getDatabase } from "../config/database.js";
import { ObjectId } from "mongodb";

export async function getVoteStatistics(position_id, not_votes = false) {
  const db = getDatabase();
  const electionsColl = db.collection("elections");

  // Find ongoing election first, then latest closed if none
  let election;
  const ongoing = await electionsColl
    .find({
      status: "ongoing",
      deleted_at: { $exists: false },
    })
    .sort({ period_end: -1 })
    .limit(1)
    .toArray();

  if (ongoing.length > 0) {
    election = ongoing[0];
  } else {
    const closed = await electionsColl
      .find({
        status: "closed",
        deleted_at: { $exists: false },
      })
      .sort({ period_end: -1 })
      .limit(1)
      .toArray();

    if (closed.length > 0) {
      election = closed[0];
    } else {
      throw new Error("No suitable election found for statistics");
    }
  }

  const { period_start, period_end } = election;

  if (not_votes) {
    // Get all voters who haven't voted for this position
    const votesColl = db.collection("votes");
    const usersColl = db.collection("users");

    // Get all user_ids who voted for this position
    const votedUsers = await votesColl
      .find({
        position_id,
        period_start,
        period_end,
        deleted_at: { $exists: false },
      })
      .project({ user_id: 1 })
      .toArray();

    const votedUserIds = votedUsers.map((vote) => vote.user_id);

    // Get all users with role 'voter' who haven't voted
    const nonVoters = await usersColl
      .find({
        role: "voter",
        status: "active",
        deleted_at: { $exists: false },
        _id: { $nin: votedUserIds },
      })
      .project({
        nis: 1,
        nama_lengkap: 1,
        class: 1,
        gender: 1,
      })
      .toArray();

    return {
      position_id,
      non_voters: nonVoters,
      total_non_voters: nonVoters.length,
    };
  }

  // Original vote statistics logic
  const candidatesColl = db.collection("candidates");
  const candidates = await candidatesColl
    .find({
      position_id,
      period_start,
      period_end,
      status: "active",
      deleted_at: { $exists: false },
    })
    .sort({ candidate_number: 1 })
    .toArray();

  const votesColl = db.collection("votes");
  const data = [];
  let total_votes = 0;

  for (const candidate of candidates) {
    const voters = await votesColl.countDocuments({
      candidate_id: candidate._id,
      position_id,
      period_start,
      period_end,
      deleted_at: { $exists: false },
    });

    data.push({
      candidate_number: candidate.candidate_number,
      name: candidate.name,
      voters,
    });

    total_votes += voters;
  }

  return {
    position_id,
    total_votes,
    data,
  };
}
